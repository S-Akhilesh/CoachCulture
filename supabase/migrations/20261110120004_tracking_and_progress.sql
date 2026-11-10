-- FormFit migration 4: validated workout/meal tracking + progress

CREATE TYPE public.workout_session_status AS ENUM (
  'in_progress',
  'completed',
  'abandoned'
);

CREATE TYPE public.meal_log_status AS ENUM (
  'pending',
  'completed',
  'skipped'
);

-- ---------------------------------------------------------------------------
-- workout_sessions — must reference client's assignment + revision day
-- ---------------------------------------------------------------------------

CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  workout_assignment_id uuid NOT NULL REFERENCES public.workout_assignments (id) ON DELETE RESTRICT,
  workout_revision_day_id uuid NOT NULL REFERENCES public.workout_revision_days (id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  completed_at timestamptz,
  status public.workout_session_status NOT NULL DEFAULT 'in_progress',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT workout_sessions_completed_after_start CHECK (
    completed_at IS NULL OR completed_at >= started_at
  )
);

CREATE INDEX workout_sessions_client_id_idx ON public.workout_sessions (client_id);
CREATE INDEX workout_sessions_assignment_id_idx ON public.workout_sessions (workout_assignment_id);
CREATE INDEX workout_sessions_revision_day_id_idx ON public.workout_sessions (workout_revision_day_id);
CREATE INDEX workout_sessions_client_started_idx
  ON public.workout_sessions (client_id, started_at DESC);

CREATE TRIGGER workout_sessions_set_updated_at
BEFORE UPDATE ON public.workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_workout_session_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_client uuid;
  assignment_status public.assignment_status;
  assignment_revision uuid;
  day_revision uuid;
BEGIN
  SELECT client_id, status, workout_plan_revision_id
  INTO assignment_client, assignment_status, assignment_revision
  FROM public.workout_assignments
  WHERE id = NEW.workout_assignment_id;

  IF assignment_client IS NULL THEN
    RAISE EXCEPTION 'workout_assignment_id not found';
  END IF;

  IF assignment_client <> NEW.client_id THEN
    RAISE EXCEPTION 'workout session client must match assignment client';
  END IF;

  -- New sessions require an active assignment; completed historical sessions
  -- may still be updated after the assignment is cancelled/completed.
  IF TG_OP = 'INSERT' AND assignment_status <> 'active' THEN
    RAISE EXCEPTION 'workout sessions require an active assignment';
  END IF;

  SELECT revision_id INTO day_revision
  FROM public.workout_revision_days
  WHERE id = NEW.workout_revision_day_id;

  IF day_revision IS NULL THEN
    RAISE EXCEPTION 'workout_revision_day_id not found';
  END IF;

  IF day_revision <> assignment_revision THEN
    RAISE EXCEPTION 'workout day must belong to the assigned plan revision';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER workout_sessions_enforce_integrity
BEFORE INSERT OR UPDATE ON public.workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_workout_session_integrity();

-- ---------------------------------------------------------------------------
-- exercise_set_logs — must reference revision exercise under the session day
-- ---------------------------------------------------------------------------

CREATE TABLE public.exercise_set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL REFERENCES public.workout_sessions (id) ON DELETE CASCADE,
  workout_revision_exercise_id uuid NOT NULL
    REFERENCES public.workout_revision_exercises (id) ON DELETE RESTRICT,
  set_number integer NOT NULL,
  prescribed_reps integer,
  prescribed_weight numeric(10, 2),
  actual_reps integer,
  actual_weight numeric(10, 2),
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT exercise_set_logs_set_number_positive CHECK (set_number >= 1),
  CONSTRAINT exercise_set_logs_prescribed_reps_non_negative CHECK (
    prescribed_reps IS NULL OR prescribed_reps >= 0
  ),
  CONSTRAINT exercise_set_logs_actual_reps_non_negative CHECK (
    actual_reps IS NULL OR actual_reps >= 0
  ),
  CONSTRAINT exercise_set_logs_prescribed_weight_non_negative CHECK (
    prescribed_weight IS NULL OR prescribed_weight >= 0
  ),
  CONSTRAINT exercise_set_logs_actual_weight_non_negative CHECK (
    actual_weight IS NULL OR actual_weight >= 0
  ),
  CONSTRAINT exercise_set_logs_session_exercise_set_unique
    UNIQUE NULLS NOT DISTINCT (workout_session_id, workout_revision_exercise_id, set_number)
);

CREATE INDEX exercise_set_logs_session_id_idx ON public.exercise_set_logs (workout_session_id);
CREATE INDEX exercise_set_logs_revision_exercise_id_idx
  ON public.exercise_set_logs (workout_revision_exercise_id);

CREATE OR REPLACE FUNCTION public.enforce_exercise_set_log_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_day uuid;
  exercise_day uuid;
  prescribed_w numeric(10, 2);
  prescribed_r text;
BEGIN
  SELECT workout_revision_day_id INTO session_day
  FROM public.workout_sessions
  WHERE id = NEW.workout_session_id;

  IF session_day IS NULL THEN
    RAISE EXCEPTION 'workout_session_id not found';
  END IF;

  SELECT revision_day_id, prescribed_weight, reps
  INTO exercise_day, prescribed_w, prescribed_r
  FROM public.workout_revision_exercises
  WHERE id = NEW.workout_revision_exercise_id;

  IF exercise_day IS NULL THEN
    RAISE EXCEPTION 'workout_revision_exercise_id not found';
  END IF;

  IF exercise_day <> session_day THEN
    RAISE EXCEPTION 'logged exercise must belong to the session workout day';
  END IF;

  -- Copy prescribed values from the immutable revision when not supplied.
  IF NEW.prescribed_weight IS NULL THEN
    NEW.prescribed_weight := prescribed_w;
  END IF;

  -- reps on revision is text (e.g. "8-12"); only set integer prescribed_reps
  -- when the caller supplies it. Do not overwrite actual performance fields.

  RETURN NEW;
END;
$$;

CREATE TRIGGER exercise_set_logs_enforce_integrity
BEFORE INSERT OR UPDATE ON public.exercise_set_logs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_exercise_set_log_integrity();

-- ---------------------------------------------------------------------------
-- meal_logs
-- ---------------------------------------------------------------------------

CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  diet_assignment_id uuid NOT NULL REFERENCES public.diet_assignments (id) ON DELETE RESTRICT,
  diet_revision_meal_id uuid NOT NULL REFERENCES public.diet_revision_meals (id) ON DELETE RESTRICT,
  logged_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  status public.meal_log_status NOT NULL DEFAULT 'pending',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX meal_logs_client_id_idx ON public.meal_logs (client_id);
CREATE INDEX meal_logs_assignment_id_idx ON public.meal_logs (diet_assignment_id);
CREATE INDEX meal_logs_revision_meal_id_idx ON public.meal_logs (diet_revision_meal_id);
CREATE INDEX meal_logs_client_logged_idx ON public.meal_logs (client_id, logged_at DESC);

CREATE TRIGGER meal_logs_set_updated_at
BEFORE UPDATE ON public.meal_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_meal_log_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_client uuid;
  assignment_status public.assignment_status;
  assignment_revision uuid;
  meal_revision uuid;
BEGIN
  SELECT client_id, status, diet_plan_revision_id
  INTO assignment_client, assignment_status, assignment_revision
  FROM public.diet_assignments
  WHERE id = NEW.diet_assignment_id;

  IF assignment_client IS NULL THEN
    RAISE EXCEPTION 'diet_assignment_id not found';
  END IF;

  IF assignment_client <> NEW.client_id THEN
    RAISE EXCEPTION 'meal log client must match assignment client';
  END IF;

  IF TG_OP = 'INSERT' AND assignment_status <> 'active' THEN
    RAISE EXCEPTION 'meal logs require an active diet assignment';
  END IF;

  SELECT revision_id INTO meal_revision
  FROM public.diet_revision_meals
  WHERE id = NEW.diet_revision_meal_id;

  IF meal_revision IS NULL THEN
    RAISE EXCEPTION 'diet_revision_meal_id not found';
  END IF;

  IF meal_revision <> assignment_revision THEN
    RAISE EXCEPTION 'meal must belong to the assigned diet plan revision';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER meal_logs_enforce_integrity
BEFORE INSERT OR UPDATE ON public.meal_logs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_meal_log_integrity();

-- ---------------------------------------------------------------------------
-- meal_log_items — actual intake linked to prescribed revision food items
-- ---------------------------------------------------------------------------

CREATE TABLE public.meal_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id uuid NOT NULL REFERENCES public.meal_logs (id) ON DELETE CASCADE,
  diet_revision_food_item_id uuid NOT NULL
    REFERENCES public.diet_revision_food_items (id) ON DELETE RESTRICT,
  food_id uuid NOT NULL REFERENCES public.foods (id) ON DELETE RESTRICT,
  actual_quantity numeric(10, 2) NOT NULL DEFAULT 0,
  actual_calories numeric(10, 2) NOT NULL DEFAULT 0,
  actual_protein numeric(10, 2) NOT NULL DEFAULT 0,
  actual_carbs numeric(10, 2) NOT NULL DEFAULT 0,
  actual_fat numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT meal_log_items_quantity_non_negative CHECK (actual_quantity >= 0),
  CONSTRAINT meal_log_items_calories_non_negative CHECK (actual_calories >= 0),
  CONSTRAINT meal_log_items_protein_non_negative CHECK (actual_protein >= 0),
  CONSTRAINT meal_log_items_carbs_non_negative CHECK (actual_carbs >= 0),
  CONSTRAINT meal_log_items_fat_non_negative CHECK (actual_fat >= 0),
  CONSTRAINT meal_log_items_log_prescribed_unique
    UNIQUE (meal_log_id, diet_revision_food_item_id)
);

CREATE INDEX meal_log_items_meal_log_id_idx ON public.meal_log_items (meal_log_id);
CREATE INDEX meal_log_items_revision_food_item_id_idx
  ON public.meal_log_items (diet_revision_food_item_id);
CREATE INDEX meal_log_items_food_id_idx ON public.meal_log_items (food_id);

CREATE OR REPLACE FUNCTION public.enforce_meal_log_item_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_meal uuid;
  item_meal uuid;
  item_food uuid;
BEGIN
  SELECT diet_revision_meal_id INTO log_meal
  FROM public.meal_logs
  WHERE id = NEW.meal_log_id;

  IF log_meal IS NULL THEN
    RAISE EXCEPTION 'meal_log_id not found';
  END IF;

  SELECT revision_meal_id, food_id
  INTO item_meal, item_food
  FROM public.diet_revision_food_items
  WHERE id = NEW.diet_revision_food_item_id;

  IF item_meal IS NULL THEN
    RAISE EXCEPTION 'diet_revision_food_item_id not found';
  END IF;

  IF item_meal <> log_meal THEN
    RAISE EXCEPTION 'food item must belong to the logged meal';
  END IF;

  -- Force food_id from the immutable prescribed item (ignore client spoofing).
  NEW.food_id := item_food;

  RETURN NEW;
END;
$$;

CREATE TRIGGER meal_log_items_enforce_integrity
BEFORE INSERT OR UPDATE ON public.meal_log_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_meal_log_item_integrity();

-- ---------------------------------------------------------------------------
-- progress_entries
-- ---------------------------------------------------------------------------

CREATE TABLE public.progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  body_weight numeric(8, 2),
  waist numeric(8, 2),
  chest numeric(8, 2),
  hips numeric(8, 2),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT progress_entries_body_weight_positive CHECK (
    body_weight IS NULL OR body_weight > 0
  ),
  CONSTRAINT progress_entries_waist_positive CHECK (waist IS NULL OR waist > 0),
  CONSTRAINT progress_entries_chest_positive CHECK (chest IS NULL OR chest > 0),
  CONSTRAINT progress_entries_hips_positive CHECK (hips IS NULL OR hips > 0),
  CONSTRAINT progress_entries_has_measurement CHECK (
    body_weight IS NOT NULL
    OR waist IS NOT NULL
    OR chest IS NOT NULL
    OR hips IS NOT NULL
    OR length(trim(notes)) > 0
  )
);

CREATE INDEX progress_entries_client_id_idx ON public.progress_entries (client_id);
CREATE INDEX progress_entries_client_recorded_idx
  ON public.progress_entries (client_id, recorded_at DESC);

CREATE TRIGGER progress_entries_set_updated_at
BEFORE UPDATE ON public.progress_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
