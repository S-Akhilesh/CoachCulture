# FormFit database security model

This document describes the hardened schema in `supabase/migrations/`. Migrations have **not** been pushed to a remote project from this repo state.

## 1. Coach registration (Blocker 1)

**Rule:** Never trust `raw_user_meta_data.role` (or any client-editable auth metadata) for privileges.

| Step | Who | How |
|------|-----|-----|
| Signup | Anyone | `handle_new_user` always inserts `profiles.role = 'client'` |
| Become a coach | Admin / backend only | Call `admin_set_user_role(user_id, 'coach')` with the **service_role** key |
| Self-promote | Blocked | Trigger rejects role changes unless `auth.jwt()->>'role' = 'service_role'` |

**Where service_role runs:** Next.js **server** actions/routes (env `SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_`), a trusted Edge Function, CI job, or admin script. Browser bundles must never import `@formfit/shared/supabase/admin`.

**Coach bootstrap:** Prefer promoting the first coach manually via `admin_set_user_role`. Controlled self-registration uses server-validated `COACH_ONBOARDING_SECRET` (see `docs/AUTH.md`). Leaving the secret unset disables `/signup` promotion.

**Client invitation:**

1. Coach creates a `client_invitations` row (hashed token, expiry, single-use) via server action; `coach_id` comes from the session.
2. Client accepts at `/invite/[token]`; server verifies the token hash, creates/links the Auth user as `client`, inserts `coach_clients`.
3. Coach publishes plans, then `assign_latest_workout_plan` / `assign_latest_diet_plan`.

Details: [`docs/AUTH.md`](../docs/AUTH.md). Migration `20261110140000_client_invitations.sql` is **not** auto-pushed.

## 2. Assignment & log validation (Blocker 2)

Browser-supplied IDs are not trusted. Triggers rewrite / reject:

- **Sessions** require `workout_assignment_id` + `workout_revision_day_id`; client must match assignment; day must belong to assignment revision; **insert** requires assignment `status = active`.
- **Set logs** require `workout_revision_exercise_id` on that session’s revision day; prescribed weight copied from revision when omitted.
- **Meal logs** require active diet assignment + revision meal on that assignment’s revision.
- **Meal log items** require `diet_revision_food_item_id` on that meal; `food_id` is forced from the prescribed item. Actual macros stay on the log item only.

## 3. Immutable plan revisions (Blocker 3)

**Chosen approach:** normalized revision tables (not empty JSONB snapshots).

```text
workout_plans / days / exercises     → coach editable workspace
publish_workout_plan()               → copies into
workout_plan_revisions
  └── workout_revision_days
        └── workout_revision_exercises   → immutable

assignments pin workout_plan_revision_id
sessions / set logs reference revision day / exercise rows
```

Same pattern for diet (`publish_diet_plan`, `diet_plan_revisions`, …).

- Publishing increments `current_revision` and freezes a full copy.
- Existing assignments keep their revision; clients do **not** silently get workspace edits.
- New assignments use `assign_latest_*` → latest published revision.
- Direct INSERT/UPDATE/DELETE on revision tables is blocked except via `formfit.publishing` (set inside publish) or service_role.
- Later: coach can explicitly re-assign a client to a newer revision (separate action using `assign_latest_*` or a dedicated upgrade function).

## 4. SECURITY DEFINER permissions (Issue 4)

- All definer functions use `SET search_path = public`.
- `REVOKE ALL … FROM PUBLIC` on privileged/trigger helpers.
- `admin_set_user_role` → **service_role only**.
- `publish_*` / `assign_latest_*` → `authenticated`, with internal `auth.uid()` ownership checks.
- Policy helpers (`coach_owns_client`, `client_can_read_*`, …) → `authenticated` execute only as needed for RLS.

## 5. Inactive coach–client relationships (Issue 5)

When `coach_clients.status` → `inactive`:

1. Trigger cancels all **active** workout/diet assignments for that pair.
2. New sessions/meal logs fail (require active assignment).
3. New assignments fail (require active relationship).
4. Historical sessions, set logs, meal logs, progress remain; coaches use `coach_can_view_client_history`; clients keep own rows and can still **read** revisions they were once assigned (not as a live plan).

## 6. Duplicate set prevention (Issue 6)

`exercise_set_logs` uses:

```sql
UNIQUE NULLS NOT DISTINCT (workout_session_id, workout_revision_exercise_id, set_number)
```

`workout_revision_exercise_id` is **NOT NULL**, so every set is tied to a real prescribed exercise in the assigned revision.

## 7. Applying & testing

**Prerequisite:** Docker Desktop (or another Docker engine) must be installed and running. Local Supabase cannot start without it.

```bash
# Local only — do not push until tests pass
# If analytics containers fail health checks:
npx supabase start --exclude logflare,vector --ignore-health-check
npx supabase db reset
npx supabase test db
# or: npm run supabase:test
```

Tests live in `supabase/tests/security_hardening.sql` (pgTAP). They `SET ROLE authenticated|service_role` so RLS is actually enforced.

```bash
# Remote — only after local tests pass
npx supabase link --project-ref <ref>
npm run supabase:push
```
