CREATE TABLE IF NOT EXISTS public.football_api_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.football_api_cache ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.football_api_cache FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.football_api_cache TO service_role;
