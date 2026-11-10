# FormFit Landing (`@formfit/landing`)

Public marketing site for FormFit. Port **3002**.

## Develop

From the monorepo root:

```bash
npm install
npm run dev:landing
```

Env: copy `.env.example` → `.env.local` (`NEXT_PUBLIC_COACH_APP_URL`, `NEXT_PUBLIC_CLIENT_APP_URL`).

## Vercel

- **Root Directory:** `apps/landing`
- Install from the repository root (npm workspaces) so `@formfit/ui` resolves.
- Set the same public portal URL env vars used locally.
