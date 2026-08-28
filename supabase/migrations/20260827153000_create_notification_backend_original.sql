-- Notification backend using only the original Asateer Al Kora tables.
-- Safe on a fresh database and on the currently deployed database.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  email text DEFAULT '',
  avatar_url text DEFAULT '',
  language text DEFAULT 'ar',
  theme text DEFAULT 'dark',
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'ar';
DO $profile$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'preferred_language') THEN
    UPDATE public.profiles SET language = CASE WHEN preferred_language = 'en' THEN 'en' ELSE 'ar' END WHERE language IS NULL OR language NOT IN ('ar', 'en');
  END IF;
END
$profile$;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS preferred_language;

CREATE TABLE IF NOT EXISTS public.favorite_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id integer NOT NULL, team_name text NOT NULL, team_logo text DEFAULT '', created_at timestamptz DEFAULT now(), UNIQUE(user_id, team_id)
);
CREATE TABLE IF NOT EXISTS public.favorite_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id integer NOT NULL, player_name text NOT NULL, player_photo text DEFAULT '', created_at timestamptz DEFAULT now(), UNIQUE(user_id, player_id)
);
CREATE TABLE IF NOT EXISTS public.favorite_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id integer NOT NULL, created_at timestamptz DEFAULT now(), UNIQUE(user_id, match_id)
);
CREATE TABLE IF NOT EXISTS public.favorite_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  league_id integer NOT NULL, league_name text NOT NULL, league_logo text DEFAULT '', created_at timestamptz DEFAULT now(), UNIQUE(user_id, league_id)
);
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_start boolean NOT NULL DEFAULT true, goals boolean NOT NULL DEFAULT true, half_time boolean NOT NULL DEFAULT true,
  match_end boolean NOT NULL DEFAULT true, red_cards boolean NOT NULL DEFAULT true, team_news boolean NOT NULL DEFAULT true,
  player_news boolean NOT NULL DEFAULT false, transfers boolean NOT NULL DEFAULT true, breaking_news boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(), UNIQUE(user_id)
);
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS half_time boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL, platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')), device_name text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS device_id text;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_key text NOT NULL, fixture_id integer, event_type text NOT NULL,
  team_id integer, player_id integer, minute integer, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS fixture_id integer;
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS team_id integer;
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS player_id integer;
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS minute integer;
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS notification_events_event_key_uidx ON public.notification_events (event_key);
CREATE INDEX IF NOT EXISTS notification_events_fixture_idx ON public.notification_events (fixture_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid NOT NULL REFERENCES public.notification_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, push_token_id uuid, status text NOT NULL DEFAULT 'queued',
  expo_ticket_id text, sent_at timestamptz, error text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_deliveries ADD COLUMN IF NOT EXISTS push_token_id uuid;
ALTER TABLE public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_device_token_id_fkey;
ALTER TABLE public.notification_deliveries DROP CONSTRAINT IF EXISTS notification_deliveries_push_token_id_fkey;
ALTER TABLE public.notification_deliveries DROP COLUMN IF EXISTS device_token_id;
ALTER TABLE public.notification_deliveries ADD CONSTRAINT notification_deliveries_push_token_id_fkey FOREIGN KEY (push_token_id) REFERENCES public.push_tokens(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_event_user_token_uidx ON public.notification_deliveries (event_id, user_id, push_token_id);
CREATE INDEX IF NOT EXISTS notification_deliveries_user_idx ON public.notification_deliveries (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.notification_events(id) ON DELETE SET NULL, title text NOT NULL, body text NOT NULL,
  type text NOT NULL, read boolean NOT NULL DEFAULT false, target_id text, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.notification_events(id) ON DELETE SET NULL;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS target_id text;
ALTER TABLE public.user_notifications ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS user_notifications_user_created_idx ON public.user_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_unread_idx ON public.user_notifications (user_id, read) WHERE read = false;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_user_notifications" ON public.user_notifications;
CREATE POLICY "select_own_user_notifications" ON public.user_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_notifications" ON public.user_notifications;
CREATE POLICY "update_own_user_notifications" ON public.user_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_notifications" ON public.user_notifications;
CREATE POLICY "delete_own_user_notifications" ON public.user_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.notification_events FROM anon, authenticated;
REVOKE ALL ON public.notification_deliveries FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO service_role;
