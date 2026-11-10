-- Client invitations for coach → client onboarding.
-- NOT pushed automatically; apply after review:
--   npx supabase db push --remote --dry-run
--   npm run supabase:push   # after explicit confirmation

CREATE TYPE public.invitation_status AS ENUM (
  'pending',
  'accepted',
  'expired',
  'revoked'
);

CREATE TABLE public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  token_hash text NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT client_invitations_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT client_invitations_token_hash_not_blank CHECK (length(trim(token_hash)) > 0),
  CONSTRAINT client_invitations_expires_after_create CHECK (expires_at > created_at),
  CONSTRAINT client_invitations_accepted_consistency CHECK (
    (status = 'accepted' AND accepted_at IS NOT NULL AND accepted_by IS NOT NULL)
    OR (status <> 'accepted' AND accepted_at IS NULL)
  )
);

CREATE UNIQUE INDEX client_invitations_token_hash_uidx
  ON public.client_invitations (token_hash);

CREATE UNIQUE INDEX client_invitations_one_pending_per_coach_email_uidx
  ON public.client_invitations (coach_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX client_invitations_coach_id_idx ON public.client_invitations (coach_id);
CREATE INDEX client_invitations_email_idx ON public.client_invitations (lower(email));
CREATE INDEX client_invitations_status_expires_idx
  ON public.client_invitations (status, expires_at);

CREATE TRIGGER client_invitations_set_updated_at
BEFORE UPDATE ON public.client_invitations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_invitation_coach_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_role public.user_role;
BEGIN
  SELECT role INTO coach_role FROM public.profiles WHERE id = NEW.coach_id;

  IF coach_role IS DISTINCT FROM 'coach' THEN
    RAISE EXCEPTION 'client_invitations.coach_id must reference a coach profile';
  END IF;

  NEW.email := lower(trim(NEW.email));

  RETURN NEW;
END;
$$;

CREATE TRIGGER client_invitations_enforce_coach_role
BEFORE INSERT OR UPDATE OF coach_id, email ON public.client_invitations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_invitation_coach_role();

REVOKE ALL ON FUNCTION public.enforce_invitation_coach_role() FROM PUBLIC;

ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.client_invitations TO authenticated;

-- Coaches manage their own invitations. Clients never read invite rows via RLS
-- (acceptance uses service-role server code after token verification).
CREATE POLICY client_invitations_select_coach
ON public.client_invitations
FOR SELECT
TO authenticated
USING (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY client_invitations_insert_coach
ON public.client_invitations
FOR INSERT
TO authenticated
WITH CHECK (public.is_coach() AND coach_id = auth.uid());

CREATE POLICY client_invitations_update_coach
ON public.client_invitations
FOR UPDATE
TO authenticated
USING (public.is_coach() AND coach_id = auth.uid())
WITH CHECK (public.is_coach() AND coach_id = auth.uid());
