# FormFit

Monorepo for the FormFit fitness coaching platform.

## Apps

| App | Package | Port | Description |
|-----|---------|------|-------------|
| Coach | `@formfit/coach` | 3000 | Coach dashboard — clients, workouts, diet plans |
| Client | `@formfit/client` | 3001 | Client portal — workouts, meals, progress |
| Landing | `@formfit/landing` | 3002 | Public marketing site |

## Packages

| Package | Description |
|---------|-------------|
| `@formfit/ui` | Shared UI primitives and design tokens |
| `@formfit/shared` | Shared domain models, mock data, and localStorage helpers |

## Develop

```bash
npm install
npm run dev:coach      # http://localhost:3000
npm run dev:client     # http://localhost:3001
npm run dev:landing    # http://localhost:3002
# or all three:
npm run dev
```

From the coach app, open a client and click **View as Client** to launch the client portal for that person.

## Supabase

Shared client helpers live in `@formfit/shared/supabase/*`.

Each app needs credentials in `.env.local` (see each app’s `.env.example`). Auth setup: [`docs/AUTH.md`](docs/AUTH.md).

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only
COACH_ONBOARDING_SECRET=     # coach app only; optional
```

Verify client initialization (no table queries):

```bash
node scripts/check-supabase.mjs
```

### Database schema

Versioned SQL migrations live in `supabase/migrations/`.

Security model: [`supabase/SECURITY_MODEL.md`](supabase/SECURITY_MODEL.md)  
Auth & onboarding: [`docs/AUTH.md`](docs/AUTH.md)  
SQL tests: [`supabase/tests/security_hardening.sql`](supabase/tests/security_hardening.sql)

1. Profiles + secure role provisioning + coach–client relationships  
2. Exercises + editable workout plans + **immutable revisions** + assignments  
3. Foods + editable diet plans + immutable revisions + assignments  
4. Validated workout/meal tracking + progress  
5. RLS + SECURITY DEFINER lockdown + inactive-relationship cancellation  
6. `client_invitations` (pending apply — see AUTH.md; **not** auto-pushed)

Coach roles are created only via `admin_set_user_role` with the **service_role** key on the server. Signups always get `client`.

Apply locally with Docker (recommended before remote push):

```bash
npm run supabase:start
npm run supabase:reset
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_hardening.sql
```

Remote (only after tests pass and explicit confirmation):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --remote --dry-run
npm run supabase:push
```

Generate TypeScript types after migrations apply:

```bash
npm run supabase:types
```

Authentication UI is implemented. Business data still uses mock/localStorage until a separate migration task.

## Prototype notes

- Coach auth: `/login`, `/signup`. Client auth: `/login`, `/invite/[token]`.
- Mock client picker (development only): `http://localhost:3001/demo` (disabled in production builds).
- Coach **View as Client** opens the client app in a new tab (`NEXT_PUBLIC_CLIENT_APP_URL`).
- Demo client **Back to Coach** returns to the coach app (`NEXT_PUBLIC_COACH_APP_URL`).
- Each app has its own origin (`localhost:3000` vs `localhost:3001`), so localStorage is **not** shared between them.
