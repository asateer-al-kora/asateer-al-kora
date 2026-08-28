import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useFavorites() {
  const { user, isGuest } = useAuth();
  const [favorites, setFavorites] = useState<{
    teams: number[];
    players: number[];
    matches: number[];
    leagues: number[];
  }>({ teams: [], players: [], matches: [], leagues: [] });
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user || isGuest) return;
    setLoading(true);
    const [teams, players, matches, leagues] = await Promise.all([
      supabase.from('favorite_teams').select('team_id').eq('user_id', user.id),
      supabase.from('favorite_players').select('player_id').eq('user_id', user.id),
      supabase.from('favorite_matches').select('match_id').eq('user_id', user.id),
      supabase.from('favorite_leagues').select('league_id').eq('user_id', user.id),
    ]);
    setFavorites({
      teams: teams.data?.map(r => r.team_id) || [],
      players: players.data?.map(r => r.player_id) || [],
      matches: matches.data?.map(r => r.match_id) || [],
      leagues: leagues.data?.map(r => r.league_id) || [],
    });
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = async (
    type: 'teams' | 'players' | 'matches' | 'leagues',
    id: number,
    extra?: Record<string, any>
  ) => {
    if (!user || isGuest) return { needLogin: true };
    const tableMap = {
      teams: 'favorite_teams',
      players: 'favorite_players',
      matches: 'favorite_matches',
      leagues: 'favorite_leagues',
    };
    const idMap = {
      teams: 'team_id',
      players: 'player_id',
      matches: 'match_id',
      leagues: 'league_id',
    };
    const table = tableMap[type];
    const idCol = idMap[type];

    if (favorites[type].includes(id)) {
      await supabase.from(table).delete().eq('user_id', user.id).eq(idCol, id);
      setFavorites(prev => ({ ...prev, [type]: prev[type].filter(x => x !== id) }));
    } else {
      await supabase.from(table).insert({ user_id: user.id, [idCol]: id, ...extra });
      setFavorites(prev => ({ ...prev, [type]: [...prev[type], id] }));
    }
    return { needLogin: false };
  };

  const isFavorite = (type: keyof typeof favorites, id: number) => favorites[type].includes(id);

  return { favorites, loading, toggleFavorite, isFavorite, reload: loadFavorites };
}
