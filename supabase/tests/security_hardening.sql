-- FormFit security hardening tests (pgTAP)
--
-- Requires Docker + local Supabase:
--   npx supabase start
--   npx supabase db reset
--   npx supabase test db
--
-- Critical: tests SET ROLE authenticated|service_role so RLS applies.
-- Running as postgres/superuser without SET ROLE would falsely pass.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgtap;

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO postgres, authenticated, service_role;

SELECT plan(23);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION tests.uid(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION tests.as_user(p_uid uuid, p_role text DEFAULT 'authenticated')
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  PERFORM set_config('request.jwt.claim.sub', p_uid::text, true);
  PERFORM set_config('request.jwt.claim.role', p_role, true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', p_uid::text, 'role', p_role)::text,
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION tests.clear_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('request.jwt.claim.role', '', true);
  PERFORM set_config('request.jwt.claims', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION tests.seed_user(p_email text, p_meta jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  new_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('test-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    p_meta,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    new_id,
    new_id,
    jsonb_build_object('sub', new_id::text, 'email', p_email),
    'email',
    new_id::text,
    now(),
    now(),
    now()
  );

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION tests.uid(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION tests.as_user(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION tests.clear_auth() TO authenticated, service_role;

-- Capture foreign IDs as superuser so clients can attempt cross-tenant inserts
-- even when RLS hides those rows from SELECT subqueries.
CREATE TABLE tests.fixtures (
  key text PRIMARY KEY,
  id uuid NOT NULL
);
GRANT SELECT ON tests.fixtures TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

SELECT tests.clear_auth();

SELECT tests.seed_user('meta_coach@test.local', '{"role":"coach","full_name":"Meta Coach"}'::jsonb);
SELECT tests.seed_user('coach_a@test.local', '{"full_name":"Coach A"}'::jsonb);
SELECT tests.seed_user('coach_b@test.local', '{"full_name":"Coach B"}'::jsonb);
SELECT tests.seed_user('client_a@test.local', '{"full_name":"Client A"}'::jsonb);
SELECT tests.seed_user('client_b@test.local', '{"full_name":"Client B"}'::jsonb);

SELECT is(
  (SELECT role::text FROM public.profiles WHERE email = 'meta_coach@test.local'),
  'client',
  '1a: signup with metadata role=coach still creates client profile'
);

SELECT tests.as_user(tests.uid('coach_a@test.local'), 'service_role');
SELECT lives_ok(
  $$SELECT public.admin_set_user_role(tests.uid('coach_a@test.local'), 'coach')$$,
  'service_role can promote coach_a'
);
SELECT public.admin_set_user_role(tests.uid('coach_b@test.local'), 'coach');
SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Role escalation
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('client_a@test.local'), 'authenticated');

SELECT throws_ok(
  $$SELECT public.admin_set_user_role(tests.uid('client_a@test.local'), 'coach')$$,
  '42501',
  'permission denied for function admin_set_user_role',
  '1: client cannot register as coach via admin_set_user_role'
);

SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'coach' WHERE id = tests.uid('client_a@test.local')$$,
  'P0001',
  'profiles.role cannot be changed by clients or coaches',
  '2: client cannot modify own role'
);

SELECT throws_ok(
  $$SELECT public.admin_set_user_role(tests.uid('client_b@test.local'), 'coach')$$,
  '42501',
  'permission denied for function admin_set_user_role',
  '12: unauthorized user cannot execute admin_set_user_role'
);
SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Coach A data
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('coach_a@test.local'), 'authenticated');

INSERT INTO public.coach_clients (coach_id, client_id)
VALUES (tests.uid('coach_a@test.local'), tests.uid('client_a@test.local'));

INSERT INTO public.exercises (owner_coach_id, name)
VALUES (tests.uid('coach_a@test.local'), 'Squat');

INSERT INTO public.foods (owner_coach_id, name, calories, protein, carbohydrates, fat)
VALUES (tests.uid('coach_a@test.local'), 'Chicken', 165, 31, 0, 3.6);

INSERT INTO public.workout_plans (coach_id, name, description)
VALUES (tests.uid('coach_a@test.local'), 'Strength', 'v1');

INSERT INTO public.workout_days (workout_plan_id, day_name, day_order)
SELECT id, 'Day 1', 1 FROM public.workout_plans WHERE name = 'Strength' LIMIT 1;

INSERT INTO public.workout_exercises (workout_day_id, exercise_id, exercise_order, sets, reps, prescribed_weight)
SELECT d.id, e.id, 1, 3, '5', 100
FROM public.workout_days d
JOIN public.workout_plans p ON p.id = d.workout_plan_id
JOIN public.exercises e ON e.owner_coach_id = p.coach_id AND e.name = 'Squat'
WHERE p.name = 'Strength'
LIMIT 1;

SELECT public.publish_workout_plan((SELECT id FROM public.workout_plans WHERE name = 'Strength' LIMIT 1));

UPDATE public.workout_plans SET description = 'v2'
WHERE name = 'Strength' AND coach_id = tests.uid('coach_a@test.local');

SELECT public.publish_workout_plan((SELECT id FROM public.workout_plans WHERE name = 'Strength' LIMIT 1));

SELECT public.assign_latest_workout_plan(
  (SELECT id FROM public.workout_plans WHERE name = 'Strength' LIMIT 1),
  tests.uid('client_a@test.local')
);

SELECT is(
  (
    SELECT r.revision
    FROM public.workout_assignments wa
    JOIN public.workout_plan_revisions r ON r.id = wa.workout_plan_revision_id
    WHERE wa.client_id = tests.uid('client_a@test.local') AND wa.status = 'active'
    LIMIT 1
  ),
  2,
  '8: new assignment uses latest published revision'
);

UPDATE public.workout_plans SET description = 'v3'
WHERE name = 'Strength' AND coach_id = tests.uid('coach_a@test.local');
SELECT public.publish_workout_plan((SELECT id FROM public.workout_plans WHERE name = 'Strength' LIMIT 1));

SELECT is(
  (
    SELECT r.revision
    FROM public.workout_assignments wa
    JOIN public.workout_plan_revisions r ON r.id = wa.workout_plan_revision_id
    WHERE wa.client_id = tests.uid('client_a@test.local') AND wa.status = 'active'
    LIMIT 1
  ),
  2,
  '7: existing assignment retains original revision after republish'
);

SELECT throws_ok(
  $$UPDATE public.workout_plan_revisions SET name = 'hacked' WHERE revision = 2$$, 'P0001', 'published plan revisions are immutable', 'revisions: published workout revisions cannot be modified');

SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Coach B foreign plan
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('coach_b@test.local'), 'authenticated');

INSERT INTO public.coach_clients (coach_id, client_id)
VALUES (tests.uid('coach_b@test.local'), tests.uid('client_b@test.local'));

INSERT INTO public.exercises (owner_coach_id, name)
VALUES (tests.uid('coach_b@test.local'), 'Bench');

INSERT INTO public.workout_plans (coach_id, name)
VALUES (tests.uid('coach_b@test.local'), 'B Plan');

INSERT INTO public.workout_days (workout_plan_id, day_name, day_order)
SELECT id, 'B Day', 1 FROM public.workout_plans WHERE name = 'B Plan' LIMIT 1;

INSERT INTO public.workout_exercises (workout_day_id, exercise_id, exercise_order, sets, reps)
SELECT d.id, e.id, 1, 3, '8'
FROM public.workout_days d
JOIN public.workout_plans p ON p.id = d.workout_plan_id
JOIN public.exercises e ON e.name = 'Bench' AND e.owner_coach_id = p.coach_id
WHERE p.name = 'B Plan'
LIMIT 1;

SELECT public.publish_workout_plan((SELECT id FROM public.workout_plans WHERE name = 'B Plan' LIMIT 1));
SELECT tests.clear_auth();

INSERT INTO tests.fixtures (key, id)
SELECT 'foreign_day', d.id
FROM public.workout_revision_days d
JOIN public.workout_plan_revisions r ON r.id = d.revision_id
JOIN public.workout_plans p ON p.id = r.workout_plan_id
WHERE p.name = 'B Plan'
LIMIT 1;

INSERT INTO tests.fixtures (key, id)
SELECT 'foreign_exercise', e.id
FROM public.workout_revision_exercises e
JOIN public.workout_revision_days d ON d.id = e.revision_day_id
JOIN public.workout_plan_revisions r ON r.id = d.revision_id
JOIN public.workout_plans p ON p.id = r.workout_plan_id
WHERE p.name = 'B Plan'
LIMIT 1;

-- ---------------------------------------------------------------------------
-- Client A cross-tenant attempts
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('client_a@test.local'), 'authenticated');

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.workout_sessions (client_id, workout_assignment_id, workout_revision_day_id)
      VALUES (
        %L,
        (SELECT id FROM public.workout_assignments WHERE client_id = %L AND status = 'active' LIMIT 1),
        (SELECT id FROM tests.fixtures WHERE key = 'foreign_day')
      )
    $sql$,
    tests.uid('client_a@test.local'),
    tests.uid('client_a@test.local')
  ), 'P0001', 'workout day must belong to the assigned plan revision', '4: client cannot attach arbitrary workout day');

INSERT INTO public.workout_sessions (client_id, workout_assignment_id, workout_revision_day_id)
SELECT
  tests.uid('client_a@test.local'),
  wa.id,
  d.id
FROM public.workout_assignments wa
JOIN public.workout_revision_days d ON d.revision_id = wa.workout_plan_revision_id
WHERE wa.client_id = tests.uid('client_a@test.local') AND wa.status = 'active'
LIMIT 1;

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.exercise_set_logs (workout_session_id, workout_revision_exercise_id, set_number, actual_reps)
      VALUES (
        (SELECT id FROM public.workout_sessions WHERE client_id = %L LIMIT 1),
        (SELECT id FROM tests.fixtures WHERE key = 'foreign_exercise'),
        1,
        5
      )
    $sql$,
    tests.uid('client_a@test.local')
  ), 'P0001', 'logged exercise must belong to the session workout day', '3: client cannot log exercise from another coach plan');

INSERT INTO public.exercise_set_logs (workout_session_id, workout_revision_exercise_id, set_number, actual_reps)
SELECT s.id, e.id, 1, 5
FROM public.workout_sessions s
JOIN public.workout_revision_exercises e ON e.revision_day_id = s.workout_revision_day_id
WHERE s.client_id = tests.uid('client_a@test.local')
LIMIT 1;

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.exercise_set_logs (workout_session_id, workout_revision_exercise_id, set_number, actual_reps)
      SELECT s.id, e.id, 1, 5
      FROM public.workout_sessions s
      JOIN public.workout_revision_exercises e ON e.revision_day_id = s.workout_revision_day_id
      WHERE s.client_id = %L
      LIMIT 1
    $sql$,
    tests.uid('client_a@test.local')
  ), '23505', NULL, '10: duplicate exercise set logs are rejected');

SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Diet
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('coach_a@test.local'), 'authenticated');

INSERT INTO public.diet_plans (coach_id, name)
VALUES (tests.uid('coach_a@test.local'), 'Cut');

INSERT INTO public.diet_meals (diet_plan_id, name, meal_order)
SELECT id, 'Lunch', 1 FROM public.diet_plans WHERE name = 'Cut' LIMIT 1;

INSERT INTO public.diet_food_items (diet_meal_id, food_id, quantity, serving_multiplier)
SELECT m.id, f.id, 1, 1
FROM public.diet_meals m
JOIN public.diet_plans p ON p.id = m.diet_plan_id
JOIN public.foods f ON f.owner_coach_id = p.coach_id AND f.name = 'Chicken'
WHERE p.name = 'Cut'
LIMIT 1;

SELECT public.publish_diet_plan((SELECT id FROM public.diet_plans WHERE name = 'Cut' LIMIT 1));
SELECT public.assign_latest_diet_plan(
  (SELECT id FROM public.diet_plans WHERE name = 'Cut' LIMIT 1),
  tests.uid('client_a@test.local')
);
SELECT tests.clear_auth();

SELECT tests.as_user(tests.uid('coach_b@test.local'), 'authenticated');
INSERT INTO public.foods (owner_coach_id, name)
VALUES (tests.uid('coach_b@test.local'), 'Rice');
INSERT INTO public.diet_plans (coach_id, name)
VALUES (tests.uid('coach_b@test.local'), 'B Diet');
INSERT INTO public.diet_meals (diet_plan_id, name, meal_order)
SELECT id, 'Dinner', 1 FROM public.diet_plans WHERE name = 'B Diet' LIMIT 1;
INSERT INTO public.diet_food_items (diet_meal_id, food_id, quantity, serving_multiplier)
SELECT m.id, f.id, 1, 1
FROM public.diet_meals m
JOIN public.diet_plans p ON p.id = m.diet_plan_id
JOIN public.foods f ON f.name = 'Rice' AND f.owner_coach_id = p.coach_id
WHERE p.name = 'B Diet'
LIMIT 1;
SELECT public.publish_diet_plan((SELECT id FROM public.diet_plans WHERE name = 'B Diet' LIMIT 1));
SELECT tests.clear_auth();

INSERT INTO tests.fixtures (key, id)
SELECT 'foreign_meal', m.id
FROM public.diet_revision_meals m
JOIN public.diet_plan_revisions r ON r.id = m.revision_id
JOIN public.diet_plans p ON p.id = r.diet_plan_id
WHERE p.name = 'B Diet'
LIMIT 1;

INSERT INTO tests.fixtures (key, id)
SELECT 'foreign_food_item', i.id
FROM public.diet_revision_food_items i
JOIN public.diet_revision_meals m ON m.id = i.revision_meal_id
JOIN public.diet_plan_revisions r ON r.id = m.revision_id
JOIN public.diet_plans p ON p.id = r.diet_plan_id
WHERE p.name = 'B Diet'
LIMIT 1;

SELECT tests.as_user(tests.uid('client_a@test.local'), 'authenticated');

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.meal_logs (client_id, diet_assignment_id, diet_revision_meal_id)
      VALUES (
        %L,
        (SELECT id FROM public.diet_assignments WHERE client_id = %L AND status = 'active' LIMIT 1),
        (SELECT id FROM tests.fixtures WHERE key = 'foreign_meal')
      )
    $sql$,
    tests.uid('client_a@test.local'),
    tests.uid('client_a@test.local')
  ), 'P0001', 'meal must belong to the assigned diet plan revision', '5: client cannot attach arbitrary diet meal');

INSERT INTO public.meal_logs (client_id, diet_assignment_id, diet_revision_meal_id)
SELECT
  tests.uid('client_a@test.local'),
  da.id,
  m.id
FROM public.diet_assignments da
JOIN public.diet_revision_meals m ON m.revision_id = da.diet_plan_revision_id
WHERE da.client_id = tests.uid('client_a@test.local') AND da.status = 'active'
LIMIT 1;

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.meal_log_items (meal_log_id, diet_revision_food_item_id, food_id, actual_quantity)
      VALUES (
        (SELECT id FROM public.meal_logs WHERE client_id = %L LIMIT 1),
        (SELECT id FROM tests.fixtures WHERE key = 'foreign_food_item'),
        '00000000-0000-0000-0000-000000000001'::uuid,
        1
      )
    $sql$,
    tests.uid('client_a@test.local')
  ), 'P0001', 'food item must belong to the logged meal', '5b: client cannot attach arbitrary diet food item');

SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Cross-coach access
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('coach_b@test.local'), 'authenticated');

SELECT is(
  (SELECT count(*)::integer FROM public.profiles WHERE id = tests.uid('client_a@test.local')),
  0,
  '6: coach B cannot access coach A client profile'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.workout_sessions
    WHERE client_id = tests.uid('client_a@test.local')
  ),
  0,
  'cross-coach: coach B cannot read coach A client sessions'
);

SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Inactive relationship
-- ---------------------------------------------------------------------------

SELECT tests.as_user(tests.uid('coach_a@test.local'), 'authenticated');

UPDATE public.coach_clients
SET status = 'inactive'
WHERE coach_id = tests.uid('coach_a@test.local')
  AND client_id = tests.uid('client_a@test.local');

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.workout_assignments
    WHERE client_id = tests.uid('client_a@test.local') AND status = 'active'
  ),
  0,
  '9a: inactive relationship cancels active workout assignments'
);

SELECT is(
  (
    SELECT count(*)::integer
    FROM public.diet_assignments
    WHERE client_id = tests.uid('client_a@test.local') AND status = 'active'
  ),
  0,
  '9b: inactive relationship cancels active diet assignments'
);

SELECT tests.clear_auth();
SELECT tests.as_user(tests.uid('client_a@test.local'), 'authenticated');

SELECT throws_ok(
  format(
    $sql$
      INSERT INTO public.workout_sessions (client_id, workout_assignment_id, workout_revision_day_id)
      SELECT
        %L,
        wa.id,
        d.id
      FROM public.workout_assignments wa
      JOIN public.workout_revision_days d ON d.revision_id = wa.workout_plan_revision_id
      WHERE wa.client_id = %L
      ORDER BY wa.assigned_at DESC
      LIMIT 1
    $sql$,
    tests.uid('client_a@test.local'),
    tests.uid('client_a@test.local')
  ), 'P0001', 'workout sessions require an active assignment', '9c: inactive relationship blocks new sessions');

SELECT ok(
  (
    SELECT count(*) > 0
    FROM public.exercise_set_logs es
    JOIN public.workout_sessions ws ON ws.id = es.workout_session_id
    WHERE ws.client_id = tests.uid('client_a@test.local')
  ),
  '11a: historical set logs remain readable to client'
);

SELECT tests.clear_auth();
SELECT tests.as_user(tests.uid('coach_a@test.local'), 'authenticated');

SELECT ok(
  (
    SELECT count(*) > 0
    FROM public.workout_sessions
    WHERE client_id = tests.uid('client_a@test.local')
  ),
  '11b: historical sessions remain readable to authorized coach'
);

SELECT tests.clear_auth();

-- ---------------------------------------------------------------------------
-- Static checks
-- ---------------------------------------------------------------------------

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'admin_set_user_role',
        'handle_new_user',
        'publish_workout_plan',
        'publish_diet_plan',
        'assign_latest_workout_plan',
        'assign_latest_diet_plan',
        'coach_owns_client',
        'cancel_assignments_on_relationship_inactive'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  ),
  'SECURITY DEFINER functions declare search_path'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.admin_set_user_role(uuid, public.user_role)', 'execute')
  AND NOT has_function_privilege('authenticated', 'public.admin_set_user_role(uuid, public.user_role)', 'execute')
  AND has_function_privilege('service_role', 'public.admin_set_user_role(uuid, public.user_role)', 'execute'),
  'admin_set_user_role EXECUTE not granted to PUBLIC/anon/authenticated'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname IN (
        'profiles', 'coach_clients', 'exercises', 'workout_plans', 'workout_days',
        'workout_exercises', 'workout_plan_revisions', 'workout_revision_days',
        'workout_revision_exercises', 'workout_assignments', 'workout_sessions',
        'exercise_set_logs', 'foods', 'diet_plans', 'diet_meals', 'diet_food_items',
        'diet_plan_revisions', 'diet_revision_meals', 'diet_revision_food_items',
        'diet_assignments', 'meal_logs', 'meal_log_items', 'progress_entries'
      )
      AND NOT c.relrowsecurity
  ),
  'RLS enabled on all FormFit application tables'
);

SELECT finish();

ROLLBACK;
