-- Durable auth rate-limit counters for multi-instance Next.js deployments.
-- NOT pushed automatically. Apply after review:
--   npx supabase db push --remote --dry-run
--   npx supabase db push --remote --yes   # after explicit confirmation

CREATE TABLE public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  subject_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT auth_rate_limits_bucket_not_blank CHECK (length(trim(bucket)) > 0),
  CONSTRAINT auth_rate_limits_subject_hash_not_blank CHECK (length(trim(subject_hash)) > 0)
);

CREATE INDEX auth_rate_limits_bucket_subject_created_idx
  ON public.auth_rate_limits (bucket, subject_hash, created_at DESC);

CREATE INDEX auth_rate_limits_created_at_idx
  ON public.auth_rate_limits (created_at);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only. No anon/authenticated access.
REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE public.auth_rate_limits FROM anon;
REVOKE ALL ON TABLE public.auth_rate_limits FROM authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;

-- Optional cleanup helper (callable by service_role / cron later).
CREATE OR REPLACE FUNCTION public.cleanup_auth_rate_limits(p_older_than interval DEFAULT interval '24 hours')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.is_service_role() THEN
    RAISE EXCEPTION 'cleanup_auth_rate_limits requires service_role';
  END IF;

  DELETE FROM public.auth_rate_limits
  WHERE created_at < timezone('utc', now()) - p_older_than;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_auth_rate_limits(interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_auth_rate_limits(interval) FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_auth_rate_limits(interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_auth_rate_limits(interval) TO service_role;
