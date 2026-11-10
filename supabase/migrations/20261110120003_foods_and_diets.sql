-- FormFit migration 3: food library, editable diet plans, immutable revisions

-- ---------------------------------------------------------------------------
-- foods
-- ---------------------------------------------------------------------------

CREATE TABLE public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_coach_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  serving_size numeric(10, 2) NOT NULL DEFAULT 1,
  serving_unit text NOT NULL DEFAULT 'serving',
  calories numeric(10, 2) NOT NULL DEFAULT 0,
  protein numeric(10, 2) NOT NULL DEFAULT 0,
  carbohydrates numeric(10, 2) NOT NULL DEFAULT 0,
  fat numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT foods_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT foods_serving_size_positive CHECK (serving_size > 0),
  CONSTRAINT foods_serving_unit_not_blank CHECK (length(trim(serving_unit)) > 0),
  CONSTRAINT foods_calories_non_negative CHECK (calories >= 0),
  CONSTRAINT foods_protein_non_negative CHECK (protein >= 0),
  CONSTRAINT foods_carbs_non_negative CHECK (carbohydrates >= 0),
  CONSTRAINT foods_fat_non_negative CHECK (fat >= 0)
);

CREATE INDEX foods_owner_coach_id_idx ON public.foods (owner_coach_id);
CREATE INDEX foods_name_idx ON public.foods (lower(name));

CREATE TRIGGER foods_set_updated_at
BEFORE UPDATE ON public.foods
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_food_owner_is_coach()
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
    RAISE EXCEPTION 'foods.owner_coach_id must reference a coach profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER foods_enforce_owner_role
BEFORE INSERT OR UPDATE OF owner_coach_id ON public.foods
FOR EACH ROW
EXECUTE FUNCTION public.enforce_food_owner_is_coach();

-- ---------------------------------------------------------------------------
-- diet_plans (editable workspace)
-- ---------------------------------------------------------------------------

CREATE TABLE public.diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  daily_calories numeric(10, 2),
  protein_target numeric(10, 2),
  carbs_target numeric(10, 2),
  fat_target numeric(10, 2),
  status public.plan_status NOT NULL DEFAULT 'draft',
  current_revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT diet_plans_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT diet_plans_revision_non_negative CHECK (current_revision >= 0),
  CONSTRAINT diet_plans_calories_non_negative CHECK (
    daily_calories IS NULL OR daily_calories >= 0
  ),
  CONSTRAINT diet_plans_protein_non_negative CHECK (
    protein_target IS NULL OR protein_target >= 0
  ),
  CONSTRAINT diet_plans_carbs_non_negative CHECK (
    carbs_target IS NULL OR carbs_target >= 0
  ),
  CONSTRAINT diet_plans_fat_non_negative CHECK (
    fat_target IS NULL OR fat_target >= 0
  )
);

CREATE INDEX diet_plans_coach_id_idx ON public.diet_plans (coach_id);
CREATE INDEX diet_plans_coach_status_idx ON public.diet_plans (coach_id, status);

CREATE TRIGGER diet_plans_set_updated_at
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_diet_plan_coach_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  coach_role public.user_role;
BEGIN
  SELECT role INTO coach_role FROM public.profiles WHERE id = NEW.coach_id;

  IF coach_role IS DISTINCT FROM 'coach' THEN
    RAISE EXCEPTION 'diet_plans.coach_id must reference a coach profile';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER diet_plans_enforce_coach_role
BEFORE INSERT OR UPDATE OF coach_id ON public.diet_plans
FOR EACH ROW
EXECUTE FUNCTION public.enforce_diet_plan_coach_role();

CREATE TABLE public.diet_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id uuid NOT NULL REFERENCES public.diet_plans (id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_order integer NOT NULL DEFAULT 1,
  meal_time time,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT diet_meals_name_not_blank CHECK (length(trim(name)) > 0),
  CONSTRAINT diet_meals_order_positive CHECK (meal_order >= 1),
  CONSTRAINT diet_meals_plan_order_unique UNIQUE (diet_plan_id, meal_order)
);

CREATE INDEX diet_meals_plan_id_idx ON public.diet_meals (diet_plan_id);

CREATE TRIGGER diet_meals_set_updated_at
BEFORE UPDATE ON public.diet_meals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.diet_food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_meal_id uuid NOT NULL REFERENCES public.diet_meals (id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES public.foods (id) ON DELETE RESTRICT,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  serving_multiplier numeric(10, 4) NOT NULL DEFAULT 1,
  coach_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT diet_food_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT diet_food_items_multiplier_positive CHECK (serving_multiplier > 0)
);

CREATE INDEX diet_food_items_meal_id_idx ON public.diet_food_items (diet_meal_id);
CREATE INDEX diet_food_items_food_id_idx ON public.diet_food_items (food_id);

CREATE TRIGGER diet_food_items_set_updated_at
BEFORE UPDATE ON public.diet_food_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable diet revisions
-- ---------------------------------------------------------------------------

CREATE TABLE public.diet_plan_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id uuid NOT NULL REFERENCES public.diet_plans (id) ON DELETE CASCADE,
  revision integer NOT NULL,
  name text NOT NULL,
  goal text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  daily_calories numeric(10, 2),
  protein_target numeric(10, 2),
  carbs_target numeric(10, 2),
  fat_target numeric(10, 2),
  published_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  published_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  CONSTRAINT diet_plan_revisions_revision_positive CHECK (revision >= 1),
  CONSTRAINT diet_plan_revisions_plan_revision_unique UNIQUE (diet_plan_id, revision)
);

CREATE INDEX diet_plan_revisions_plan_id_idx ON public.diet_plan_revisions (diet_plan_id);

CREATE TABLE public.diet_revision_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid NOT NULL REFERENCES public.diet_plan_revisions (id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_order integer NOT NULL,
  meal_time time,
  notes text NOT NULL DEFAULT '',
  CONSTRAINT diet_revision_meals_order_positive CHECK (meal_order >= 1),
  CONSTRAINT diet_revision_meals_revision_order_unique UNIQUE (revision_id, meal_order)
);

CREATE INDEX diet_revision_meals_revision_id_idx ON public.diet_revision_meals (revision_id);

CREATE TABLE public.diet_revision_food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_meal_id uuid NOT NULL REFERENCES public.diet_revision_meals (id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES public.foods (id) ON DELETE RESTRICT,
  quantity numeric(10, 2) NOT NULL,
  serving_multiplier numeric(10, 4) NOT NULL,
  coach_notes text NOT NULL DEFAULT '',
  CONSTRAINT diet_revision_food_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT diet_revision_food_items_multiplier_positive CHECK (serving_multiplier > 0)
);

CREATE INDEX diet_revision_food_items_meal_id_idx
  ON public.diet_revision_food_items (revision_meal_id);
CREATE INDEX diet_revision_food_items_food_id_idx
  ON public.diet_revision_food_items (food_id);

CREATE TRIGGER diet_plan_revisions_immutable
BEFORE UPDATE OR DELETE ON public.diet_plan_revisions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

CREATE TRIGGER diet_revision_meals_immutable
BEFORE UPDATE OR DELETE ON public.diet_revision_meals
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

CREATE TRIGGER diet_revision_food_items_immutable
BEFORE UPDATE OR DELETE ON public.diet_revision_food_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_revision_mutation();

CREATE TRIGGER diet_plan_revisions_insert_guard
BEFORE INSERT ON public.diet_plan_revisions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

CREATE TRIGGER diet_revision_meals_insert_guard
BEFORE INSERT ON public.diet_revision_meals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

CREATE TRIGGER diet_revision_food_items_insert_guard
BEFORE INSERT ON public.diet_revision_food_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_revision_insert_privilege();

CREATE OR REPLACE FUNCTION public.publish_diet_plan(p_plan_id uuid)
RETURNS public.diet_plan_revisions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_row public.diet_plans;
  new_revision integer;
  rev public.diet_plan_revisions;
  meal_row public.diet_meals;
  new_meal_id uuid;
  item_row public.diet_food_items;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO plan_row
  FROM public.diet_plans
  WHERE id = p_plan_id
  FOR UPDATE;

  IF plan_row.id IS NULL THEN
    RAISE EXCEPTION 'diet plan not found';
  END IF;

  IF plan_row.coach_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the owning coach can publish this plan';
  END IF;

  PERFORM set_config('formfit.publishing', '1', true);

  new_revision := plan_row.current_revision + 1;

  INSERT INTO public.diet_plan_revisions (
    diet_plan_id, revision, name, goal, description,
    daily_calories, protein_target, carbs_target, fat_target, published_by
  )
  VALUES (
    plan_row.id, new_revision, plan_row.name, plan_row.goal, plan_row.description,
    plan_row.daily_calories, plan_row.protein_target, plan_row.carbs_target,
    plan_row.fat_target, auth.uid()
  )
  RETURNING * INTO rev;

  FOR meal_row IN
    SELECT * FROM public.diet_meals
    WHERE diet_plan_id = plan_row.id
    ORDER BY meal_order
  LOOP
    INSERT INTO public.diet_revision_meals (
      revision_id, name, meal_order, meal_time, notes
    )
    VALUES (
      rev.id, meal_row.name, meal_row.meal_order, meal_row.meal_time, meal_row.notes
    )
    RETURNING id INTO new_meal_id;

    FOR item_row IN
      SELECT * FROM public.diet_food_items
      WHERE diet_meal_id = meal_row.id
    LOOP
      INSERT INTO public.diet_revision_food_items (
        revision_meal_id, food_id, quantity, serving_multiplier, coach_notes
      )
      VALUES (
        new_meal_id, item_row.food_id, item_row.quantity,
        item_row.serving_multiplier, item_row.coach_notes
      );
    END LOOP;
  END LOOP;

  UPDATE public.diet_plans
  SET current_revision = new_revision,
      status = 'active',
      updated_at = timezone('utc', now())
  WHERE id = plan_row.id;

  RETURN rev;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_diet_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_diet_plan(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.publish_workout_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_workout_plan(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- diet_assignments
-- ---------------------------------------------------------------------------

CREATE TABLE public.diet_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id uuid NOT NULL REFERENCES public.diet_plans (id) ON DELETE RESTRICT,
  diet_plan_revision_id uuid NOT NULL REFERENCES public.diet_plan_revisions (id) ON DELETE RESTRICT,
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  start_date date,
  end_date date,
  status public.assignment_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT diet_assignments_date_range CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

CREATE INDEX diet_assignments_plan_id_idx ON public.diet_assignments (diet_plan_id);
CREATE INDEX diet_assignments_revision_id_idx ON public.diet_assignments (diet_plan_revision_id);
CREATE INDEX diet_assignments_coach_id_idx ON public.diet_assignments (coach_id);
CREATE INDEX diet_assignments_client_id_idx ON public.diet_assignments (client_id);
CREATE INDEX diet_assignments_client_status_idx
  ON public.diet_assignments (client_id, status);

CREATE UNIQUE INDEX diet_assignments_one_active_per_client_idx
  ON public.diet_assignments (client_id)
  WHERE status = 'active';

CREATE TRIGGER diet_assignments_set_updated_at
BEFORE UPDATE ON public.diet_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_diet_assignment_integrity()
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
  FROM public.diet_plans
  WHERE id = NEW.diet_plan_id;

  IF plan_coach IS NULL THEN
    RAISE EXCEPTION 'diet_plan_id not found';
  END IF;

  NEW.coach_id := plan_coach;

  SELECT diet_plan_id INTO rev_plan
  FROM public.diet_plan_revisions
  WHERE id = NEW.diet_plan_revision_id;

  IF rev_plan IS NULL THEN
    RAISE EXCEPTION 'diet_plan_revision_id not found';
  END IF;

  IF rev_plan <> NEW.diet_plan_id THEN
    RAISE EXCEPTION 'revision does not belong to the assignment plan';
  END IF;

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

  RETURN NEW;
END;
$$;

CREATE TRIGGER diet_assignments_enforce_integrity
BEFORE INSERT OR UPDATE ON public.diet_assignments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_diet_assignment_integrity();

CREATE OR REPLACE FUNCTION public.assign_latest_diet_plan(
  p_plan_id uuid,
  p_client_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS public.diet_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_row public.diet_plans;
  rev_id uuid;
  created public.diet_assignments;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT * INTO plan_row FROM public.diet_plans WHERE id = p_plan_id;

  IF plan_row.id IS NULL OR plan_row.coach_id <> auth.uid() THEN
    RAISE EXCEPTION 'plan not found or not owned by caller';
  END IF;

  IF plan_row.current_revision < 1 THEN
    RAISE EXCEPTION 'publish the plan before assigning';
  END IF;

  SELECT id INTO rev_id
  FROM public.diet_plan_revisions
  WHERE diet_plan_id = p_plan_id
    AND revision = plan_row.current_revision;

  UPDATE public.diet_assignments
  SET status = 'cancelled',
      updated_at = timezone('utc', now())
  WHERE client_id = p_client_id
    AND coach_id = auth.uid()
    AND status = 'active';

  INSERT INTO public.diet_assignments (
    diet_plan_id, diet_plan_revision_id, coach_id, client_id,
    start_date, end_date, status
  )
  VALUES (
    p_plan_id, rev_id, auth.uid(), p_client_id, p_start_date, p_end_date, 'active'
  )
  RETURNING * INTO created;

  RETURN created;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_latest_diet_plan(uuid, uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_latest_diet_plan(uuid, uuid, date, date) TO authenticated;
