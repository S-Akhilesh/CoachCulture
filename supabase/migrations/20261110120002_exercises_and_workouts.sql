-- FormFit migration 2: exercise library, editable workout plans, immutable revisions

CREATE TYPE public.plan_status AS ENUM ('draft', 'active');
CREATE TYPE public.assignment_status AS ENUM ('active', 'completed', 'cancelled');

-- ---------------------------------------------------------------------------
-- exercises (system library when owner_coach_id IS NULL)
-- ---------------------------------------------------------------------------

CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_coach_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text NOT NULL DEFAULT '',
  equipment text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT exercises_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT exercises_name_length CHECK (char_length(name) <= 200)
);

CREATE INDEX exercises_owner_coach_id_idx ON public.exercises (owner_coach_id);
CREATE INDEX exercises_muscle_group_idx ON public.exercises (muscle_group);
CREATE INDEX exercises_name_idx ON public.exercises (lower(name));

CREATE TRIGGER exercises_set_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_exercise_owner_is_coach()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  owner_role public.user_role;
BEGIN
  IF NEW.owner_coach_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO owner_role FROM public.profiles WHERE id = NEW.owner_coach_id;

  IF owner_role IS DISTINCT FROM 'coach' THEN
    RAISE EXCEPTION 'exercises.owner_coach_id must reference a coach profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER exercises_enforce_owner_role
BEFORE INSERT OR UPDATE OF owner_coach_id ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.enforce_exercise_owner_is_coach();

-- ---------------------------------------------------------------------------
-- workout_plans — coach editable workspace (not what clients read)
-- ---------------------------------------------------------------------------

CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status public.plan_status NOT NULL DEFAULT 'draft',
  current_revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT workout_plans_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT workout_plans_revision_non_negative CHECK (current_revision >= 0)
);

CREATE INDEX workout_plans_coach_id_idx ON public.workout_plans (coach_id);
CREATE INDEX workout_plans_coach_status_idx ON public.workout_plans (coach_id, status);

CREATE TRIGGER workout_plans_set_updated_at
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_workout_plan_coach_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  coach_role public.user_role;
BEGIN
  SELECT role INTO coach_role FROM public.profiles WHERE id = NEW.coach_id;

  IF coach_role IS DISTINCT FROM 'coach' THEN
    RAISE EXCEPTION 'workout_plans.coach_id must reference a coach profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER workout_plans_enforce_coach_role
BEFORE INSERT OR UPDATE OF coach_id ON public.workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.enforce_workout_plan_coach_role();

-- ---------------------------------------------------------------------------
-- Editable plan structure (workspace)
-- ---------------------------------------------------------------------------

CREATE TABLE public.workout_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans (id) ON DELETE CASCADE,
  day_name text NOT NULL,
  day_order integer NOT NULL DEFAULT 1,
  is_rest_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT workout_days_name_not_blank CHECK (length(trim(day_name)) > 0),
  CONSTRAINT workout_days_order_positive CHECK (day_order >= 1),
  CONSTRAINT workout_days_plan_order_unique UNIQUE (workout_plan_id, day_order)
);

CREATE INDEX workout_days_plan_id_idx ON public.workout_days (workout_plan_id);

CREATE TRIGGER workout_days_set_updated_at
BEFORE UPDATE ON public.workout_days
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_day_id uuid NOT NULL REFERENCES public.workout_days (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises (id) ON DELETE RESTRICT,
  exercise_order integer NOT NULL DEFAULT 1,
  sets integer NOT NULL DEFAULT 1,
  reps text NOT NULL DEFAULT '',
  prescribed_weight numeric(10, 2),
  rest_seconds integer,
  coach_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT workout_exercises_order_positive CHECK (exercise_order >= 1),
  CONSTRAINT workout_exercises_sets_positive CHECK (sets >= 1),
  CONSTRAINT workout_exercises_weight_non_negative CHECK (
    prescribed_weight IS NULL OR prescribed_weight >= 0
  ),
  CONSTRAINT workout_exercises_rest_non_negative CHECK (
    rest_seconds IS NULL OR rest_seconds >= 0
  ),
  CONSTRAINT workout_exercises_day_order_unique UNIQUE (workout_day_id, exercise_order)
);

CREATE INDEX workout_exercises_day_id_idx ON public.workout_exercises (workout_day_id);
CREATE INDEX workout_exercises_exercise_id_idx ON public.workout_exercises (exercise_id);

CREATE TRIGGER workout_exercises_set_updated_at
BEFORE UPDATE ON public.workout_exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable published revisions (what clients and history reference)
-- ---------------------------------------------------------------------------

CREATE TABLE public.workout_plan_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans (id) ON DELETE CASCADE,
  revision integer NOT NULL,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  published_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  CONSTRAINT workout_plan_revisions_revision_positive CHECK (revision >= 1),
  CONSTRAINT workout_plan_revisions_plan_revision_unique UNIQUE (workout_plan_id, revision)
);

CREATE INDEX workout_plan_revisions_plan_id_idx
  ON public.workout_plan_revisions (workout_plan_id);

CREATE TABLE public.workout_revision_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid NOT NULL REFERENCES public.workout_plan_revisions (id) ON DELETE CASCADE,
  day_name text NOT NULL,
  day_order integer NOT NULL,
  is_rest_day boolean NOT NULL DEFAULT false,
  CONSTRAINT workout_revision_days_order_positive CHECK (day_order >= 1),
  CONSTRAINT workout_revision_days_revision_order_unique UNIQUE (revision_id, day_order)
);

CREATE INDEX workout_revision_days_revision_id_idx
  ON public.workout_revision_days (revision_id);

CREATE TABLE public.workout_revision_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_day_id uuid NOT NULL REFERENCES public.workout_revision_days (id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises (id) ON DELETE RESTRICT,
  exercise_order integer NOT NULL,
  sets integer NOT NULL,
  reps text NOT NULL DEFAULT '',
  prescribed_weight numeric(10, 2),
  rest_seconds integer,
  coach_notes text NOT NULL DEFAULT '',
  CONSTRAINT workout_revision_exercises_order_positive CHECK (exercise_order >= 1),
  CONSTRAINT workout_revision_exercises_sets_positive CHECK (sets >= 1),
  CONSTRAINT workout_revision_exercises_weight_non_negative CHECK (
    prescribed_weight IS NULL OR prescribed_weight >= 0
  ),
  CONSTRAINT workout_revision_exercises_day_order_unique UNIQUE (revision_day_id, exercise_order)
);

CREATE INDEX workout_revision_exercises_day_id_idx
  ON public.workout_revision_exercises (revision_day_id);
CREATE INDEX workout_revision_exercises_exercise_id_idx
  ON public.workout_revision_exercises (exercise_id);

-- Block direct mutation of immutable revision rows (except service_role).
CREATE OR REPLACE FUNCTION public.prevent_revision_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'published plan revisions are immutable';
END;
$$;

CREATE TRIGGER workout_plan_revisions_immutable
BEFORE UPDATE OR DELETE ON public.workout_plan_revisions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

CREATE TRIGGER workout_revision_days_immutable
BEFORE UPDATE OR DELETE ON public.workout_revision_days
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

CREATE TRIGGER workout_revision_exercises_immutable
BEFORE UPDATE OR DELETE ON public.workout_revision_exercises
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

-- Allow INSERT into revision tables only from publish function (security definer)
-- or service_role. Ordinary authenticated role cannot insert revisions directly.
CREATE OR REPLACE FUNCTION public.enforce_revision_insert_privilege()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- SECURITY DEFINER publish_* runs as owner and bypasses this when we use
  -- session_replication_role, OR we check current_user / is_service_role.
  -- Supabase: definer functions run as postgres and bypass RLS; triggers still fire.
  -- Allow inserts when called from publish (owner is typically postgres/supabase_admin)
  -- by requiring either service_role JWT or current_setting flag.
  IF public.is_service_role() THEN
    RETURN NEW;
  END IF;

  IF current_setting('formfit.publishing', true) = '1' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'revisions can only be created via publish_* functions';
END;
$$;

CREATE TRIGGER workout_plan_revisions_insert_guard
BEFORE INSERT ON public.workout_plan_revisions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

CREATE TRIGGER workout_revision_days_insert_guard
BEFORE INSERT ON public.workout_revision_days
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

CREATE TRIGGER workout_revision_exercises_insert_guard
BEFORE INSERT ON public.workout_revision_exercises
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

-- Set publishing flag inside publish function
CREATE OR REPLACE FUNCTION public.publish_workout_plan(p_plan_id uuid)
RETURNS public.workout_plan_revisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_row public.workout_plans;
  new_revision integer;
  rev public.workout_plan_revisions;
  day_row public.workout_days;
  new_day_id uuid;
  ex_row public.workout_exercises;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO plan_row
  FROM public.workout_plans
  WHERE id = p_plan_id
  FOR UPDATE;

  IF plan_row.id IS NULL THEN
    RAISE EXCEPTION 'workout plan not found';
  END IF;

  IF plan_row.coach_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the owning coach can publish this plan';
  END IF;

  PERFORM set_config('formfit.publishing', '1', true);

  new_revision := plan_row.current_revision + 1;

  INSERT INTO public.workout_plan_revisions (
    workout_plan_id, revision, name, goal, description, published_by
  )
  VALUES (
    plan_row.id, new_revision, plan_row.name, plan_row.goal, plan_row.description, auth.uid()
  )
  RETURNING * INTO rev;

  FOR day_row IN
    SELECT * FROM public.workout_days
    WHERE workout_plan_id = plan_row.id
    ORDER BY day_order
  LOOP
    INSERT INTO public.workout_revision_days (
      revision_id, day_name, day_order, is_rest_day
    )
    VALUES (rev.id, day_row.day_name, day_row.day_order, day_row.is_rest_day)
    RETURNING id INTO new_day_id;

    FOR ex_row IN
      SELECT * FROM public.workout_exercises
      WHERE workout_day_id = day_row.id
      ORDER BY exercise_order
    LOOP
      INSERT INTO public.workout_revision_exercises (
        revision_day_id, exercise_id, exercise_order, sets, reps,
        prescribed_weight, rest_seconds, coach_notes
      )
      VALUES (
        new_day_id, ex_row.exercise_id, ex_row.exercise_order, ex_row.sets,
        ex_row.reps, ex_row.prescribed_weight, ex_row.rest_seconds, ex_row.coach_notes
      );
    END LOOP;
  END LOOP;

  UPDATE public.workout_plans
  SET current_revision = new_revision,
      status = 'active',
      updated_at = timezone('utc', now())
  WHERE id = plan_row.id;

  RETURN rev;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_workout_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_workout_plan(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- workout_assignments — pin a client to an immutable revision
-- ---------------------------------------------------------------------------

CREATE TABLE public.workout_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES public.workout_plans (id) ON DELETE RESTRICT,
  workout_plan_revision_id uuid NOT NULL REFERENCES public.workout_plan_revisions (id) ON DELETE RESTRICT,
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  start_date date,
  end_date date,
  status public.assignment_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT workout_assignments_date_range CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

CREATE INDEX workout_assignments_plan_id_idx ON public.workout_assignments (workout_plan_id);
CREATE INDEX workout_assignments_revision_id_idx
  ON public.workout_assignments (workout_plan_revision_id);
CREATE INDEX workout_assignments_coach_id_idx ON public.workout_assignments (coach_id);
CREATE INDEX workout_assignments_client_id_idx ON public.workout_assignments (client_id);
CREATE INDEX workout_assignments_client_status_idx
  ON public.workout_assignments (client_id, status);

CREATE UNIQUE INDEX workout_assignments_one_active_per_client_idx
  ON public.workout_assignments (client_id)
  WHERE status = 'active';

CREATE TRIGGER workout_assignments_set_updated_at
BEFORE UPDATE ON public.workout_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_workout_assignment_integrity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  plan_coach uuid;
  rev_plan uuid;
  rel_exists boolean;
BEGIN
  SELECT coach_id INTO plan_coach
  FROM public.workout_plans
  WHERE id = NEW.workout_plan_id;

  IF plan_coach IS NULL THEN
    RAISE EXCEPTION 'workout_plan_id not found';
  END IF;

  NEW.coach_id := plan_coach;

  SELECT workout_plan_id INTO rev_plan
  FROM public.workout_plan_revisions
  WHERE id = NEW.workout_plan_revision_id;

  IF rev_plan IS NULL THEN
    RAISE EXCEPTION 'workout_plan_revision_id not found';
  END IF;

  IF rev_plan <> NEW.workout_plan_id THEN
    RAISE EXCEPTION 'revision does not belong to the assignment plan';
  END IF;

  -- New active assignments require an active coach–client relationship.
  IF NEW.status = 'active' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.coach_clients cc
      WHERE cc.coach_id = NEW.coach_id
        AND cc.client_id = NEW.client_id
        AND cc.status = 'active'
    ) INTO rel_exists;

    IF NOT rel_exists THEN
      RAISE EXCEPTION 'client must belong to an active coach relationship';
    END IF;
  END IF;

  -- Default new assignments to latest published revision when not supplied.
  IF TG_OP = 'INSERT' AND NEW.workout_plan_revision_id IS NOT NULL THEN
    NULL; -- already validated above
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER workout_assignments_enforce_integrity
BEFORE INSERT OR UPDATE ON public.workout_assignments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_workout_assignment_integrity();

-- Helper: assign latest published revision (coach-facing convenience).
CREATE OR REPLACE FUNCTION public.assign_latest_workout_plan(
  p_plan_id uuid,
  p_client_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS public.workout_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_row public.workout_plans;
  rev_id uuid;
  created public.workout_assignments;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO plan_row FROM public.workout_plans WHERE id = p_plan_id;

  IF plan_row.id IS NULL OR plan_row.coach_id <> auth.uid() THEN
    RAISE EXCEPTION 'plan not found or not owned by caller';
  END IF;

  IF plan_row.current_revision < 1 THEN
    RAISE EXCEPTION 'publish the plan before assigning';
  END IF;

  SELECT id INTO rev_id
  FROM public.workout_plan_revisions
  WHERE workout_plan_id = p_plan_id
    AND revision = plan_row.current_revision;

  -- Soft-cancel existing active assignment for this client (same coach).
  UPDATE public.workout_assignments
  SET status = 'cancelled',
      updated_at = timezone('utc', now())
  WHERE client_id = p_client_id
    AND coach_id = auth.uid()
    AND status = 'active';

  INSERT INTO public.workout_assignments (
    workout_plan_id, workout_plan_revision_id, coach_id, client_id,
    start_date, end_date, status
  )
  VALUES (
    p_plan_id, rev_id, auth.uid(), p_client_id, p_start_date, p_end_date, 'active'
  )
  RETURNING * INTO created;

  RETURN created;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_latest_workout_plan(uuid, uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_latest_workout_plan(uuid, uuid, date, date) TO authenticated;
