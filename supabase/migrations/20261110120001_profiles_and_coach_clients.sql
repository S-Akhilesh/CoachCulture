-- FormFit migration 1: profiles, coach–client relationships, secure role provisioning
-- Migrations have never been applied remotely; this file is the hardened baseline.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('coach', 'client');
CREATE TYPE public.relationship_status AS ENUM ('active', 'inactive');

-- ---------------------------------------------------------------------------
-- Common helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- True when the call is made with the Supabase service_role JWT (server-only).
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO service_role;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'client',
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT profiles_email_not_blank CHECK (length(trim(email)) > 0),
  CONSTRAINT profiles_full_name_reasonable CHECK (char_length(full_name) <= 200),
  CONSTRAINT profiles_phone_reasonable CHECK (phone IS NULL OR char_length(phone) <= 40),
  CONSTRAINT profiles_avatar_url_reasonable CHECK (
    avatar_url IS NULL OR char_length(avatar_url) <= 2048
  )
);

CREATE UNIQUE INDEX profiles_email_unique_idx ON public.profiles (lower(email));
CREATE INDEX profiles_role_idx ON public.profiles (role);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Role/id are immutable except via service_role (trusted provisioning).
CREATE OR REPLACE FUNCTION public.protect_profile_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'profiles.id cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_service_role() THEN
    RAISE EXCEPTION 'profiles.role cannot be changed by clients or coaches';
  END IF;

  IF auth.uid() IS NOT NULL
     AND NOT public.is_service_role()
     AND NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'profiles.email must be updated via authentication';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_immutable_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_immutable_fields();

-- Signup always creates a client profile. Never trust user metadata for role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    'client',
    coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
    coalesce(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- Trigger owner (supabase_auth_admin / postgres) invokes this; no authenticated grant.

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trusted coach provisioning (service_role only — Edge Function / admin backend).
-- Never call from browser code; never embed the service-role key in Next.js apps.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id uuid,
  p_role public.user_role
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.profiles;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'admin_set_user_role requires service_role';
  END IF;

  UPDATE public.profiles
  SET role = p_role,
      updated_at = timezone('utc', now())
  WHERE id = p_user_id
  RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'profile % not found', p_user_id;
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, public.user_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.user_role) TO service_role;

-- ---------------------------------------------------------------------------
-- coach_clients
-- ---------------------------------------------------------------------------

CREATE TABLE public.coach_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.relationship_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT coach_clients_no_self_assignment CHECK (coach_id <> client_id),
  CONSTRAINT coach_clients_client_unique UNIQUE (client_id)
);

CREATE INDEX coach_clients_coach_id_idx ON public.coach_clients (coach_id);
CREATE INDEX coach_clients_coach_status_idx ON public.coach_clients (coach_id, status);
CREATE INDEX coach_clients_client_status_idx ON public.coach_clients (client_id, status);

CREATE TRIGGER coach_clients_set_updated_at
BEFORE UPDATE ON public.coach_clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- SECURITY DEFINER: must read both profiles before a relationship exists; RLS
-- would otherwise hide the client row from the inserting coach.
CREATE OR REPLACE FUNCTION public.enforce_coach_client_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_role public.user_role;
  client_role public.user_role;
BEGIN
  SELECT role INTO coach_role FROM public.profiles WHERE id = NEW.coach_id;
  SELECT role INTO client_role FROM public.profiles WHERE id = NEW.client_id;

  IF coach_role IS DISTINCT FROM 'coach' THEN
    RAISE EXCEPTION 'coach_id must reference a profile with role coach';
  END IF;

  IF client_role IS DISTINCT FROM 'client' THEN
    RAISE EXCEPTION 'client_id must reference a profile with role client';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_coach_client_roles() FROM PUBLIC;

CREATE TRIGGER coach_clients_enforce_roles
BEFORE INSERT OR UPDATE OF coach_id, client_id ON public.coach_clients
FOR EACH ROW
EXECUTE FUNCTION public.enforce_coach_client_roles();

-- Inactive-relationship assignment cancellation is defined in migration 005
-- (after workout_assignments / diet_assignments exist).
