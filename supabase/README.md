# FormFit Supabase schema

See [SECURITY_MODEL.md](./SECURITY_MODEL.md) for role provisioning, revisions, RLS, and inactive relationships.

## Migrations

Hardened in place (never previously pushed):

| File | Purpose |
|------|---------|
| `20261110120001_*` | Profiles, client-only signup, `admin_set_user_role`, coach_clients |
| `20261110120002_*` | Exercises, workout workspace + immutable revisions + assignments |
| `20261110120003_*` | Foods, diet workspace + immutable revisions + assignments |
| `20261110120004_*` | Validated sessions / set logs / meal logs / progress |
| `20261110120005_*` | RLS, definer grants, deactivate → cancel assignments |

## Tests

```bash
npm run supabase:reset
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security_hardening.sql
```
