-- FormFit migration 5: RLS helpers, grants, policies, inactive-relationship handling

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER + fixed search_path; no PUBLIC execute)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'client'
  );
$$;

-- Active relationship only (new work / plan access).
CREATE OR REPLACE FUNCTION public.coach_owns_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_clients
    WHERE coach_id = auth.uid()
      AND client_id = p_client_id
      AND status = 'active'
  );
$$;

-- Historical reporting: any past/present relationship OR assignment ownership.
CREATE OR REPLACE FUNCTION public.coach_can_view_client_history(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_clients
    WHERE coach_id = auth.uid()
      AND client_id = p_client_id
  )
  OR EXISTS (
    SELECT 1 FROM public.workout_assignments
    WHERE coach_id = auth.uid() AND client_id = p_client_id
  )
  OR EXISTS (
    SELECT 1 FROM public.diet_assignments
    WHERE coach_id = auth.uid() AND client_id = p_client_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_active_coach(p_coach_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_clients
    WHERE client_id = auth.uid()
      AND coach_id = p_coach_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_workout_plan(p_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_plans
    WHERE id = p_plan_id AND coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_diet_plan(p_plan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.diet_plans
    WHERE id = p_plan_id AND coach_id = auth.uid()
  );
$$;

-- Client may read a revision if they have any assignment to it (including cancelled),
-- so historical logs remain meaningful after deactivation. New sessions still require
-- an active assignment (enforced by tracking triggers).
CREATE OR REPLACE FUNCTION public.client_can_read_workout_revision(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_assignments wa
    WHERE wa.workout_plan_revision_id = p_revision_id
      AND wa.client_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.client_can_read_diet_revision(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.diet_assignments da
    WHERE da.diet_plan_revision_id = p_revision_id
      AND da.client_id = auth.uid()
  );
$$;

-- Current "assigned plan" for progressive training: active assignment + active relationship.
CREATE OR REPLACE FUNCTION public.client_has_active_workout_access(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_assignments wa
    JOIN public.coach_clients cc
      ON cc.coach_id = wa.coach_id
     AND cc.client_id = wa.client_id
    WHERE wa.workout_plan_revision_id = p_revision_id
      AND wa.client_id = auth.uid()
      AND wa.status = 'active'
      AND cc.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.client_has_active_diet_access(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.diet_assignments da
    JOIN public.coach_clients cc
      ON cc.coach_id = da.coach_id
     AND cc.client_id = da.client_id
    WHERE da.diet_plan_revision_id = p_revision_id
      AND da.client_id = auth.uid()
      AND da.status = 'active'
      AND cc.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.coach_owns_workout_revision(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_plan_revisions r
    JOIN public.workout_plans p ON p.id = r.workout_plan_id
    WHERE r.id = p_revision_id AND p.coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.coach_owns_diet_revision(p_revision_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.diet_plan_revisions r
    JOIN public.diet_plans p ON p.id = r.diet_plan_id
    WHERE r.id = p_revision_id AND p.coach_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.workout_day_plan_id(p_day_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workout_plan_id FROM public.workout_days WHERE id = p_day_id;
$$;

CREATE OR REPLACE FUNCTION public.diet_meal_plan_id(p_meal_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT diet_plan_id FROM public.diet_meals WHERE id = p_meal_id;
$$;

CREATE OR REPLACE FUNCTION public.workout_revision_day_revision_id(p_day_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT revision_id FROM public.workout_revision_days WHERE id = p_day_id;
$$;

CREATE OR REPLACE FUNCTION public.workout_revision_exercise_revision_id(p_exercise_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.revision_id
  FROM public.workout_revision_exercises e
  JOIN public.workout_revision_days d ON d.id = e.revision_day_id
  WHERE e.id = p_exercise_id;
$$;

CREATE OR REPLACE FUNCTION public.diet_revision_meal_revision_id(p_meal_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT revision_id FROM public.diet_revision_meals WHERE id = p_meal_id;
$$;

CREATE OR REPLACE FUNCTION public.diet_revision_food_item_revision_id(p_item_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.revision_id
  FROM public.diet_revision_food_items i
  JOIN public.diet_revision_meals m ON m.id = i.revision_meal_id
  WHERE i.id = p_item_id;
$$;

CREATE OR REPLACE FUNCTION public.owns_workout_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workout_sessions
    WHERE id = p_session_id AND client_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.coach_can_view_workout_session(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workout_sessions ws
    WHERE ws.id = p_session_id
      AND public.coach_can_view_client_history(ws.client_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_meal_log(p_meal_log_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.meal_logs
    WHERE id = p_meal_log_id AND client_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.coach_can_view_meal_log(p_meal_log_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meal_logs ml
    WHERE ml.id = p_meal_log_id
      AND public.coach_can_view_client_history(ml.client_id)
  );
$$;

-- Cancel active assignments when a relationship is deactivated.
CREATE OR REPLACE FUNCTION public.cancel_assignments_on_relationship_inactive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'inactive' AND OLD.status IS DISTINCT FROM 'inactive' THEN
    UPDATE public.workout_assignments
    SET status = 'cancelled',
        updated_at = timezone('utc', now())
    WHERE coach_id = NEW.coach_id
      AND client_id = NEW.client_id
      AND status = 'active';

    UPDATE public.diet_assignments
    SET status = 'cancelled',
        updated_at = timezone('utc', now())
    WHERE coach_id = NEW.coach_id
      AND client_id = NEW.client_id
      AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER coach_clients_cancel_assignments
AFTER UPDATE OF status ON public.coach_clients
FOR EACH ROW
EXECUTE FUNCTION public.cancel_assignments_on_relationship_inactive();

-- ---------------------------------------------------------------------------
-- Lock down function execution
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'current_user_role()',
    'is_coach()',
    'is_client()',
    'coach_owns_client(uuid)',
    'coach_can_view_client_history(uuid)',
    'is_my_active_coach(uuid)',
    'owns_workout_plan(uuid)',
    'owns_diet_plan(uuid)',
    'client_can_read_workout_revision(uuid)',
    'client_can_read_diet_revision(uuid)',
    'client_has_active_workout_access(uuid)',
    'client_has_active_diet_access(uuid)',
    'coach_owns_workout_revision(uuid)',
    'coach_owns_diet_revision(uuid)',
    'workout_day_plan_id(uuid)',
    'diet_meal_plan_id(uuid)',
    'workout_revision_day_revision_id(uuid)',
    'workout_revision_exercise_revision_id(uuid)',
    'diet_revision_meal_revision_id(uuid)',
    'diet_revision_food_item_revision_id(uuid)',
    'owns_workout_session(uuid)',
    'coach_can_view_workout_session(uuid)',
    'owns_meal_log(uuid)',
    'coach_can_view_meal_log(uuid)',
    'cancel_assignments_on_relationship_inactive()',
    'prevent_revision_mutation()',
    'enforce_revision_insert_privilege()',
    'enforce_workout_assignment_integrity()',
    'enforce_diet_assignment_integrity()',
    'enforce_workout_session_integrity()',
    'enforce_exercise_set_log_integrity()',
    'enforce_meal_log_integrity()',
    'enforce_meal_log_item_integrity()',
    'enforce_coach_client_roles()',
    'enforce_exercise_owner_is_coach()',
    'enforce_food_owner_is_coach()',
    'enforce_workout_plan_coach_role()',
    'enforce_diet_plan_coach_role()',
    'protect_profile_immutable_fields()',
    'set_updated_at()',
    'handle_new_user()',
    'is_service_role()'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'skip revoke, missing function: %', fn;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_owns_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_can_view_client_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_active_coach(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_workout_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_diet_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_can_read_workout_revision(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_can_read_diet_revision(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_has_active_workout_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_has_active_diet_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_owns_workout_revision(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_owns_diet_revision(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_workout_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_can_view_workout_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_meal_log(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_can_view_meal_log(uuid) TO authenticated;

-- Internal helpers: no authenticated execute (used only inside policies via same-owner SQL,
-- or keep grants for policy evaluation — Postgres policies need EXECUTE for the invoker).
GRANT EXECUTE ON FUNCTION public.workout_day_plan_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.diet_meal_plan_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workout_revision_day_revision_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workout_revision_exercise_revision_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.diet_revision_meal_revision_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.diet_revision_food_item_revision_id(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_service_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO service_role;

-- Supabase default privileges grant EXECUTE to anon/authenticated; revoke explicitly.
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_workout_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_diet_plan(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_latest_workout_plan(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_latest_diet_plan(uuid, uuid, date, date) TO authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_revision_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_revision_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_revision_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_revision_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.coach_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workout_plan_revisions TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workout_revision_days TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.workout_revision_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workout_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_set_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.foods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_food_items TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.diet_plan_revisions TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.diet_revision_meals TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.diet_revision_food_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.diet_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_log_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_entries TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select_own_or_related
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.coach_can_view_client_history(id)
  OR public.is_my_active_coach(id)
);

CREATE POLICY profiles_update_own
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- coach_clients
-- ---------------------------------------------------------------------------

CREATE POLICY coach_clients_select
ON public.coach_clients FOR SELECT TO authenticated
USING (
  (public.is_coach() AND coach_id = auth.uid())
  OR (public.is_client() AND client_id = auth.uid())
);

CREATE POLICY coach_clients_insert_coach
ON public.coach_clients FOR INSERT TO authenticated
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY coach_clients_update_coach
ON public.coach_clients FOR UPDATE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

-- ---------------------------------------------------------------------------
-- exercises / foods
-- ---------------------------------------------------------------------------

CREATE POLICY exercises_select ON public.exercises FOR SELECT TO authenticated
USING (
  owner_coach_id IS NULL
  OR owner_coach_id = auth.uid()
  OR public.is_my_active_coach(owner_coach_id)
);

CREATE POLICY exercises_insert_coach ON public.exercises FOR INSERT TO authenticated
WITH CHECK (public.is_coach() AND owner_coach_id = auth.uid());

CREATE POLICY exercises_update_coach ON public.exercises FOR UPDATE TO authenticated
USING (public.is_coach() AND owner_coach_id = auth.uid())
WITH CHECK (public.is_coach() AND owner_coach_id = auth.uid());

CREATE POLICY exercises_delete_coach ON public.exercises FOR DELETE TO authenticated
USING (public.is_coach() AND owner_coach_id = auth.uid());

CREATE POLICY foods_select ON public.foods FOR SELECT TO authenticated
USING (
  owner_coach_id IS NULL
  OR owner_coach_id = auth.uid()
  OR public.is_my_active_coach(owner_coach_id)
);

CREATE POLICY foods_insert_coach ON public.foods FOR INSERT TO authenticated
WITH CHECK (public.is_coach() AND owner_coach_id = auth.uid());

CREATE POLICY foods_update_coach ON public.foods FOR UPDATE TO authenticated
USING (public.is_coach() AND owner_coach_id = auth.uid())
WITH CHECK (public.is_coach() AND owner_coach_id = auth.uid());

CREATE POLICY foods_delete_coach ON public.foods FOR DELETE TO authenticated
USING (public.is_coach() AND owner_coach_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Live workout workspace — coaches only (clients use revisions)
-- ---------------------------------------------------------------------------

CREATE POLICY workout_plans_select_coach ON public.workout_plans FOR SELECT TO authenticated
USING (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY workout_plans_insert_coach ON public.workout_plans FOR INSERT TO authenticated
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY workout_plans_update_coach ON public.workout_plans FOR UPDATE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY workout_plans_delete_coach ON public.workout_plans FOR DELETE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY workout_days_select_coach ON public.workout_days FOR SELECT TO authenticated
USING (public.owns_workout_plan(workout_plan_id));

CREATE POLICY workout_days_insert_coach ON public.workout_days FOR INSERT TO authenticated
WITH CHECK (public.owns_workout_plan(workout_plan_id));

CREATE POLICY workout_days_update_coach ON public.workout_days FOR UPDATE TO authenticated
USING (public.owns_workout_plan(workout_plan_id))
WITH CHECK (public.owns_workout_plan(workout_plan_id));

CREATE POLICY workout_days_delete_coach ON public.workout_days FOR DELETE TO authenticated
USING (public.owns_workout_plan(workout_plan_id));

CREATE POLICY workout_exercises_select_coach ON public.workout_exercises FOR SELECT TO authenticated
USING (public.owns_workout_plan(public.workout_day_plan_id(workout_day_id)));

CREATE POLICY workout_exercises_insert_coach ON public.workout_exercises FOR INSERT TO authenticated
WITH CHECK (public.owns_workout_plan(public.workout_day_plan_id(workout_day_id)));

CREATE POLICY workout_exercises_update_coach ON public.workout_exercises FOR UPDATE TO authenticated
USING (public.owns_workout_plan(public.workout_day_plan_id(workout_day_id)))
WITH CHECK (public.owns_workout_plan(public.workout_day_plan_id(workout_day_id)));

CREATE POLICY workout_exercises_delete_coach ON public.workout_exercises FOR DELETE TO authenticated
USING (public.owns_workout_plan(public.workout_day_plan_id(workout_day_id)));

-- ---------------------------------------------------------------------------
-- Immutable workout revisions — coach owner OR assigned client (active)
-- ---------------------------------------------------------------------------

CREATE POLICY workout_plan_revisions_select ON public.workout_plan_revisions FOR SELECT TO authenticated
USING (
  public.coach_owns_workout_revision(id)
  OR public.client_can_read_workout_revision(id)
);

-- Allow owners to target rows for UPDATE/DELETE so immutability triggers fire
-- (without these policies, UPDATEs match 0 rows and appear to succeed).
CREATE POLICY workout_plan_revisions_update_owner ON public.workout_plan_revisions
FOR UPDATE TO authenticated
USING (public.coach_owns_workout_revision(id))
WITH CHECK (public.coach_owns_workout_revision(id));

CREATE POLICY workout_plan_revisions_delete_owner ON public.workout_plan_revisions
FOR DELETE TO authenticated
USING (public.coach_owns_workout_revision(id));

CREATE POLICY workout_revision_days_select ON public.workout_revision_days FOR SELECT TO authenticated
USING (
  public.coach_owns_workout_revision(revision_id)
  OR public.client_can_read_workout_revision(revision_id)
);

CREATE POLICY workout_revision_days_update_owner ON public.workout_revision_days
FOR UPDATE TO authenticated
USING (public.coach_owns_workout_revision(revision_id))
WITH CHECK (public.coach_owns_workout_revision(revision_id));

CREATE POLICY workout_revision_days_delete_owner ON public.workout_revision_days
FOR DELETE TO authenticated
USING (public.coach_owns_workout_revision(revision_id));

CREATE POLICY workout_revision_exercises_select ON public.workout_revision_exercises FOR SELECT TO authenticated
USING (
  public.coach_owns_workout_revision(public.workout_revision_day_revision_id(revision_day_id))
  OR public.client_can_read_workout_revision(public.workout_revision_day_revision_id(revision_day_id))
);

CREATE POLICY workout_revision_exercises_update_owner ON public.workout_revision_exercises
FOR UPDATE TO authenticated
USING (
  public.coach_owns_workout_revision(public.workout_revision_day_revision_id(revision_day_id))
)
WITH CHECK (
  public.coach_owns_workout_revision(public.workout_revision_day_revision_id(revision_day_id))
);

CREATE POLICY workout_revision_exercises_delete_owner ON public.workout_revision_exercises
FOR DELETE TO authenticated
USING (
  public.coach_owns_workout_revision(public.workout_revision_day_revision_id(revision_day_id))
);

-- ---------------------------------------------------------------------------
-- workout_assignments
-- ---------------------------------------------------------------------------

CREATE POLICY workout_assignments_select ON public.workout_assignments FOR SELECT TO authenticated
USING (
  (public.is_coach() AND coach_id = auth.uid())
  OR (public.is_client() AND client_id = auth.uid())
);

CREATE POLICY workout_assignments_insert_coach ON public.workout_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_coach()
  AND public.owns_workout_plan(workout_plan_id)
  AND public.coach_owns_client(client_id)
);

CREATE POLICY workout_assignments_update_coach ON public.workout_assignments FOR UPDATE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (
  public.is_coach()
  AND public.owns_workout_plan(workout_plan_id)
  AND (
    status <> 'active'
    OR public.coach_owns_client(client_id)
  )
);

-- ---------------------------------------------------------------------------
-- workout sessions / set logs
-- ---------------------------------------------------------------------------

CREATE POLICY workout_sessions_select ON public.workout_sessions FOR SELECT TO authenticated
USING (
  client_id = auth.uid()
  OR public.coach_can_view_client_history(client_id)
);

CREATE POLICY workout_sessions_insert_client ON public.workout_sessions FOR INSERT TO authenticated
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY workout_sessions_update_client ON public.workout_sessions FOR UPDATE TO authenticated
USING (public.is_client() AND client_id = auth.uid())
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY workout_sessions_delete_client ON public.workout_sessions FOR DELETE TO authenticated
USING (public.is_client() AND client_id = auth.uid());

CREATE POLICY exercise_set_logs_select ON public.exercise_set_logs FOR SELECT TO authenticated
USING (
  public.owns_workout_session(workout_session_id)
  OR public.coach_can_view_workout_session(workout_session_id)
);

CREATE POLICY exercise_set_logs_insert_client ON public.exercise_set_logs FOR INSERT TO authenticated
WITH CHECK (public.owns_workout_session(workout_session_id));

CREATE POLICY exercise_set_logs_update_client ON public.exercise_set_logs FOR UPDATE TO authenticated
USING (public.owns_workout_session(workout_session_id))
WITH CHECK (public.owns_workout_session(workout_session_id));

CREATE POLICY exercise_set_logs_delete_client ON public.exercise_set_logs FOR DELETE TO authenticated
USING (public.owns_workout_session(workout_session_id));

-- ---------------------------------------------------------------------------
-- Live diet workspace — coaches only
-- ---------------------------------------------------------------------------

CREATE POLICY diet_plans_select_coach ON public.diet_plans FOR SELECT TO authenticated
USING (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY diet_plans_insert_coach ON public.diet_plans FOR INSERT TO authenticated
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY diet_plans_update_coach ON public.diet_plans FOR UPDATE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY diet_plans_delete_coach ON public.diet_plans FOR DELETE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY diet_meals_select_coach ON public.diet_meals FOR SELECT TO authenticated
USING (public.owns_diet_plan(diet_plan_id));

CREATE POLICY diet_meals_insert_coach ON public.diet_meals FOR INSERT TO authenticated
WITH CHECK (public.owns_diet_plan(diet_plan_id));

CREATE POLICY diet_meals_update_coach ON public.diet_meals FOR UPDATE TO authenticated
USING (public.owns_diet_plan(diet_plan_id))
WITH CHECK (public.owns_diet_plan(diet_plan_id));

CREATE POLICY diet_meals_delete_coach ON public.diet_meals FOR DELETE TO authenticated
USING (public.owns_diet_plan(diet_plan_id));

CREATE POLICY diet_food_items_select_coach ON public.diet_food_items FOR SELECT TO authenticated
USING (public.owns_diet_plan(public.diet_meal_plan_id(diet_meal_id)));

CREATE POLICY diet_food_items_insert_coach ON public.diet_food_items FOR INSERT TO authenticated
WITH CHECK (public.owns_diet_plan(public.diet_meal_plan_id(diet_meal_id)));

CREATE POLICY diet_food_items_update_coach ON public.diet_food_items FOR UPDATE TO authenticated
USING (public.owns_diet_plan(public.diet_meal_plan_id(diet_meal_id)))
WITH CHECK (public.owns_diet_plan(public.diet_meal_plan_id(diet_meal_id)));

CREATE POLICY diet_food_items_delete_coach ON public.diet_food_items FOR DELETE TO authenticated
USING (public.owns_diet_plan(public.diet_meal_plan_id(diet_meal_id)));

-- ---------------------------------------------------------------------------
-- Immutable diet revisions
-- ---------------------------------------------------------------------------

CREATE POLICY diet_plan_revisions_select ON public.diet_plan_revisions FOR SELECT TO authenticated
USING (
  public.coach_owns_diet_revision(id)
  OR public.client_can_read_diet_revision(id)
);

CREATE POLICY diet_plan_revisions_update_owner ON public.diet_plan_revisions
FOR UPDATE TO authenticated
USING (public.coach_owns_diet_revision(id))
WITH CHECK (public.coach_owns_diet_revision(id));

CREATE POLICY diet_plan_revisions_delete_owner ON public.diet_plan_revisions
FOR DELETE TO authenticated
USING (public.coach_owns_diet_revision(id));

CREATE POLICY diet_revision_meals_select ON public.diet_revision_meals FOR SELECT TO authenticated
USING (
  public.coach_owns_diet_revision(revision_id)
  OR public.client_can_read_diet_revision(revision_id)
);

CREATE POLICY diet_revision_meals_update_owner ON public.diet_revision_meals
FOR UPDATE TO authenticated
USING (public.coach_owns_diet_revision(revision_id))
WITH CHECK (public.coach_owns_diet_revision(revision_id));

CREATE POLICY diet_revision_meals_delete_owner ON public.diet_revision_meals
FOR DELETE TO authenticated
USING (public.coach_owns_diet_revision(revision_id));

CREATE POLICY diet_revision_food_items_select ON public.diet_revision_food_items FOR SELECT TO authenticated
USING (
  public.coach_owns_diet_revision(public.diet_revision_meal_revision_id(revision_meal_id))
  OR public.client_can_read_diet_revision(public.diet_revision_meal_revision_id(revision_meal_id))
);

CREATE POLICY diet_revision_food_items_update_owner ON public.diet_revision_food_items
FOR UPDATE TO authenticated
USING (
  public.coach_owns_diet_revision(public.diet_revision_meal_revision_id(revision_meal_id))
)
WITH CHECK (
  public.coach_owns_diet_revision(public.diet_revision_meal_revision_id(revision_meal_id))
);

CREATE POLICY diet_revision_food_items_delete_owner ON public.diet_revision_food_items
FOR DELETE TO authenticated
USING (
  public.coach_owns_diet_revision(public.diet_revision_meal_revision_id(revision_meal_id))
);

-- ---------------------------------------------------------------------------
-- diet_assignments
-- ---------------------------------------------------------------------------

CREATE POLICY diet_assignments_select ON public.diet_assignments FOR SELECT TO authenticated
USING (
  (public.is_coach() AND coach_id = auth.uid())
  OR (public.is_client() AND client_id = auth.uid())
);

CREATE POLICY diet_assignments_insert_coach ON public.diet_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_coach()
  AND public.owns_diet_plan(diet_plan_id)
  AND public.coach_owns_client(client_id)
);

CREATE POLICY diet_assignments_update_coach ON public.diet_assignments FOR UPDATE TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (
  public.is_coach()
  AND public.owns_diet_plan(diet_plan_id)
  AND (
    status <> 'active'
    OR public.coach_owns_client(client_id)
  )
);

-- ---------------------------------------------------------------------------
-- meal logs / items / progress
-- ---------------------------------------------------------------------------

CREATE POLICY meal_logs_select ON public.meal_logs FOR SELECT TO authenticated
USING (
  client_id = auth.uid()
  OR public.coach_can_view_client_history(client_id)
);

CREATE POLICY meal_logs_insert_client ON public.meal_logs FOR INSERT TO authenticated
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY meal_logs_update_client ON public.meal_logs FOR UPDATE TO authenticated
USING (public.is_client() AND client_id = auth.uid())
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY meal_logs_delete_client ON public.meal_logs FOR DELETE TO authenticated
USING (public.is_client() AND client_id = auth.uid());

CREATE POLICY meal_log_items_select ON public.meal_log_items FOR SELECT TO authenticated
USING (
  public.owns_meal_log(meal_log_id)
  OR public.coach_can_view_meal_log(meal_log_id)
);

CREATE POLICY meal_log_items_insert_client ON public.meal_log_items FOR INSERT TO authenticated
WITH CHECK (public.owns_meal_log(meal_log_id));

CREATE POLICY meal_log_items_update_client ON public.meal_log_items FOR UPDATE TO authenticated
USING (public.owns_meal_log(meal_log_id))
WITH CHECK (public.owns_meal_log(meal_log_id));

CREATE POLICY meal_log_items_delete_client ON public.meal_log_items FOR DELETE TO authenticated
USING (public.owns_meal_log(meal_log_id));

CREATE POLICY progress_entries_select ON public.progress_entries FOR SELECT TO authenticated
USING (
  client_id = auth.uid()
  OR public.coach_can_view_client_history(client_id)
);

CREATE POLICY progress_entries_insert_client ON public.progress_entries FOR INSERT TO authenticated
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY progress_entries_update_client ON public.progress_entries FOR UPDATE TO authenticated
USING (public.is_client() AND client_id = auth.uid())
WITH CHECK (public.is_client() AND client_id = auth.uid());

CREATE POLICY progress_entries_delete_client ON public.progress_entries FOR DELETE TO authenticated
USING (public.is_client() AND client_id = auth.uid());
