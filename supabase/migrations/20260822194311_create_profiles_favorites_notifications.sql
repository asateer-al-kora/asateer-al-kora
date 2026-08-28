/*
# Create app database schema for Asateer Al Kora

1. New Tables
- `profiles` — user profile data linked to auth.users (id, name, email, avatar_url, language, theme, created_at)
- `favorite_teams` — user favorite teams (user_id, team_id, team_name, team_logo, created_at)
- `favorite_players` — user favorite players (user_id, player_id, player_name, player_photo, created_at)
- `favorite_matches` — user favorite matches (user_id, match_id, created_at)
- `favorite_leagues` — user favorite leagues (user_id, league_id, league_name, league_logo, created_at)
- `notification_preferences` — per-user notification settings (user_id, match_start, goals, match_end, red_cards, team_news, player_news, transfers, breaking_news, created_at)
2. Security
- RLS enabled on all tables.
- Owner-scoped CRUD policies (TO authenticated) using auth.uid() ownership checks.
- user_id columns default to auth.uid() so inserts succeed even when client omits user_id.
3. Important Notes
- Profiles table uses auth.uid() as primary key, matching auth.users.
- All favorite tables are scoped by user_id with ON DELETE CASCADE.
- Notification preferences use a unique constraint on user_id (one row per user).
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT '',
  email text DEFAULT '',
  avatar_url text DEFAULT '',
  language text DEFAULT 'ar',
  theme text DEFAULT 'dark',
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Favorite teams
CREATE TABLE IF NOT EXISTS favorite_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id integer NOT NULL,
  team_name text NOT NULL,
  team_logo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, team_id)
);

ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fav_teams" ON favorite_teams;
CREATE POLICY "select_own_fav_teams" ON favorite_teams FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fav_teams" ON favorite_teams;
CREATE POLICY "insert_own_fav_teams" ON favorite_teams FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_fav_teams" ON favorite_teams;
CREATE POLICY "update_own_fav_teams" ON favorite_teams FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fav_teams" ON favorite_teams;
CREATE POLICY "delete_own_fav_teams" ON favorite_teams FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Favorite players
CREATE TABLE IF NOT EXISTS favorite_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id integer NOT NULL,
  player_name text NOT NULL,
  player_photo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
);

ALTER TABLE favorite_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fav_players" ON favorite_players;
CREATE POLICY "select_own_fav_players" ON favorite_players FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fav_players" ON favorite_players;
CREATE POLICY "insert_own_fav_players" ON favorite_players FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_fav_players" ON favorite_players;
CREATE POLICY "update_own_fav_players" ON favorite_players FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fav_players" ON favorite_players;
CREATE POLICY "delete_own_fav_players" ON favorite_players FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Favorite matches
CREATE TABLE IF NOT EXISTS favorite_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE favorite_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fav_matches" ON favorite_matches;
CREATE POLICY "select_own_fav_matches" ON favorite_matches FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fav_matches" ON favorite_matches;
CREATE POLICY "insert_own_fav_matches" ON favorite_matches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fav_matches" ON favorite_matches;
CREATE POLICY "delete_own_fav_matches" ON favorite_matches FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Favorite leagues
CREATE TABLE IF NOT EXISTS favorite_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  league_id integer NOT NULL,
  league_name text NOT NULL,
  league_logo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, league_id)
);

ALTER TABLE favorite_leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_fav_leagues" ON favorite_leagues;
CREATE POLICY "select_own_fav_leagues" ON favorite_leagues FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_fav_leagues" ON favorite_leagues;
CREATE POLICY "insert_own_fav_leagues" ON favorite_leagues FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_fav_leagues" ON favorite_leagues;
CREATE POLICY "update_own_fav_leagues" ON favorite_leagues FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_fav_leagues" ON favorite_leagues;
CREATE POLICY "delete_own_fav_leagues" ON favorite_leagues FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  match_start boolean DEFAULT true,
  goals boolean DEFAULT true,
  match_end boolean DEFAULT true,
  red_cards boolean DEFAULT true,
  team_news boolean DEFAULT true,
  player_news boolean DEFAULT false,
  transfers boolean DEFAULT true,
  breaking_news boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notif_prefs" ON notification_preferences;
CREATE POLICY "select_own_notif_prefs" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notif_prefs" ON notification_preferences;
CREATE POLICY "insert_own_notif_prefs" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notif_prefs" ON notification_preferences;
CREATE POLICY "update_own_notif_prefs" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
