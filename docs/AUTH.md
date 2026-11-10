# FormFit authentication & onboarding

Auth-only implementation. Mock/localStorage business data is unchanged.

## Architecture

Both apps share one Supabase Auth project via `@formfit/shared/supabase/*`.

| Portal | Port | Role gate |
|--------|------|-----------|
| Coach (`apps/coach`) | 3000 | `profiles.role = coach` |
| Client (`apps/client`) | 3001 | `profiles.role = client` + active `coach_clients` row |

Sessions use `@supabase/ssr` cookies. `proxy.ts` refreshes sessions; layouts enforce roles server-side.

**Never** set roles from browser metadata. Signup trigger always creates `client`. Coach promotion uses `admin_set_user_role` with the **service_role** key on the server only (`SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_`).

## Environment variables

Copy each app’s `.env.example` into `.env.local`.

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | both | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | both | Browser/server anon key |
| `NEXT_PUBLIC_COACH_APP_URL` | both | Coach origin (redirects, emails) |
| `NEXT_PUBLIC_CLIENT_APP_URL` | both | Client origin (invites, emails) |
| `SUPABASE_SERVICE_ROLE_KEY` | both (server) | Trusted provisioning + invitations + rate limits |
| `COACH_ONBOARDING_SECRET` | coach only | Authorizes coach self-registration |
| `AUTH_REQUIRE_EMAIL_CONFIRMATION` | both (optional) | `true`/`false` override. Default: required in production, optional in development |

Never prefix secrets with `NEXT_PUBLIC_`. Never commit real secret values.

## Supabase dashboard — redirect allowlist

Inspected callback routes:

- Coach: `apps/coach/src/app/auth/callback/route.ts`
- Client: `apps/client/src/app/auth/callback/route.ts`

`next` query values are allowlisted server-side (no open redirects):

- Coach: `/`, `/auth/update-password`
- Client: `/login`, `/auth/update-password`

### Local development — add exactly these Redirect URLs

**Site URL:** `http://localhost:3000`

**Additional Redirect URLs:**

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
http://localhost:3001/auth/callback
http://localhost:3001/auth/update-password
```

Do **not** use broad wildcards like `http://localhost:3001/invite/**` for Auth redirects. Invitation acceptance is an app route that does not rely on Supabase Auth redirect allowlisting for the invite token path.

When deploying, replace localhost origins with your production coach/client HTTPS origins (same four path suffixes).

### Auth email settings

1. Email + password provider enabled.
2. **Production:** enable “Confirm email”.
3. Optional custom SMTP for reliable delivery.

## Email confirmation policy

| Environment | Default | Behavior |
|-------------|---------|----------|
| Development | Confirmation **not** required | Coach signup may auto-confirm for inbox-free testing |
| Production | Confirmation **required** | Unconfirmed users cannot sign in; clear error shown |
| Override | `AUTH_REQUIRE_EMAIL_CONFIRMATION=true\|false` | Forces either mode |

**Client invitations:** new users created via a verified hashed invite are email-confirmed (coach-vouched address). Existing unconfirmed users must confirm before accept/login when the policy requires it.

Public coach self-registration never silently bypasses confirmation in production.

## Demo / mock portal isolation

| Route | Development (`NODE_ENV !== production`) | Production |
|-------|----------------------------------------|------------|
| `/demo` | Allowed (localStorage mock picker) | Redirects to `/login` |
| `/c1`, `/c2`, … mock IDs | Allowed without auth | Redirects to `/login` |
| Authenticated client | Always forced to `/{auth.uid}` — never mock IDs | Same |

Demo mode cannot satisfy RLS or create coach–client ownership. It only serves prototype localStorage UI.

## Migration: `client_invitations`

File: `supabase/migrations/20261110140000_client_invitations.sql`

**Status (CoachConnect `tnbwxcguzhibqtegkiqa`):** applied. Do not recreate or push again.

## Migration: `auth_rate_limits` (pending apply)

File: `supabase/migrations/20261110150000_auth_rate_limits.sql`

Durable counters for multi-instance rate limiting (login, signup, reset, invite create/accept). Service-role only; no anon/authenticated grants.

**Not auto-pushed.** After review:

```bash
npx supabase db push --remote --dry-run
# After explicit confirmation:
npx supabase db push --remote --yes
npm run supabase:types
```

Until applied: development allows requests with a warning; production fails closed on auth actions that need the table.

## Coach onboarding secret

**Read only in:** `apps/coach/src/lib/auth-actions.ts` (`signUpCoach`) via `process.env.COACH_ONBOARDING_SECRET`.

Server-only. Missing → self-registration disabled. Invalid → `"Invalid onboarding secret."` Never log the value.

### Rotation procedure

1. Generate a new secret: `openssl rand -base64 32`
2. Update the deployment/env store for the coach app only (not client).
3. Redeploy / restart the coach app so the new value is loaded.
4. Communicate the new secret out-of-band to authorized operators.
5. Invalidate the previous secret by overwriting it (no dual-key window unless you intentionally keep the old value until restart completes).
6. Prefer removing the secret after bootstrap and using manual `admin_set_user_role` for additional coaches.

## Client invitation flow

1. Authenticated coach: **Clients → Invite Client**.
2. Server verifies coach session; `coach_id` from session only.
3. Insert `client_invitations` (hashed token, 7-day expiry).
4. Coach shares `{CLIENT_APP}/invite/{token}`.
5. Client accepts; server verifies hash; creates/links user; inserts `coach_clients`; marks accepted.
6. Replay / expiry rejected; one client → one coach (`UNIQUE client_id`).

## Routes

### Coach

- `/login`, `/signup`, `/forgot-password`
- `/auth/callback`, `/auth/update-password`
- `(app)/*` requires coach role

### Client

- `/login`, `/forgot-password`
- `/invite/[token]`
- `/auth/callback`, `/auth/update-password`
- `/[clientId]` requires matching client + active coach (or demo mock ID in development only)
- `/demo` — development only

## Rate limits

| Bucket | Default |
|--------|---------|
| `login` | 20 / 15 min |
| `coach_signup` | 5 / hour |
| `password_reset` | 5 / hour |
| `invite_create` | 30 / hour |
| `invite_accept` | 20 / hour |

Subjects are hashed (email + IP or user id). No secrets logged.

Also rely on Supabase Auth’s built-in abuse protections.

## Testing checklist

1. Coach signup with valid secret → coach role → dashboard (or verify-email message in production mode)
2. Coach signup with bad/missing secret → rejected
3. Email verification / callback
4. Coach login success; client account rejected on coach portal
5. Invite create → accept → client dashboard
6. Reuse invite → rejected
7. Expired invite → rejected
8. Second coach inviting linked email → rejected
9. Client login; coach rejected on client portal
10. Unauthenticated `/` or `/clients` → login
11. Password reset → update → login with new password
12. Logout → direct URL → login
13. Cross-portal wrong role → rejected
14. Production build: `/demo` and `/c1` → login

## Remaining security concerns

- Apply `auth_rate_limits` before production traffic.
- Rotate/remove `COACH_ONBOARDING_SECRET` after bootstrap.
- Invite URLs are bearer tokens — HTTPS only in production.
- Configure Auth redirect allowlist for every deployed origin.
- End-to-end email delivery must be verified with a real inbox before claiming production readiness.
