import { supabase } from '@/services/supabase';
import { newsApi } from '@/services/newsApi';
import type { MatchFixture, MatchEvent, MatchStatistic, Lineup, StandingResponse, TopScorer, TeamDetails, PlayerDetails, League, Team } from '@/types/football';

const FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL || ''}/functions/v1/football-api`;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
const DEFAULT_TTL = 60_000;
const LONG_TTL = 300_000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.timestamp > entry.ttl) {
    if (entry) cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown, ttl = DEFAULT_TTL) {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type RawLeague = { league?: { id?: number; name?: string; logo?: string; type?: string }; country?: { name?: string; code?: string; flag?: string }; seasons?: Array<{ year?: number; current?: boolean }> } & Partial<League>;

export function normalizeLeague(raw: RawLeague): League {
  const nested = raw.league || {};
  const seasons = raw.seasons || [];
  const current = seasons.find((season) => season.current) || seasons.slice().sort((a, b) => (b.year || 0) - (a.year || 0))[0];
  return {
    id: Number(nested.id ?? raw.id ?? 0),
    name: nested.name ?? raw.name ?? '',
    logo: nested.logo ?? raw.logo ?? '',
    country: raw.country?.name ?? raw.country,
    flag: raw.country?.flag ?? raw.flag,
    countryFlag: raw.country?.flag ?? raw.countryFlag ?? '',
    type: nested.type ?? raw.type,
    season: raw.season ?? current?.year,
    currentSeason: current?.year ?? raw.currentSeason ?? raw.season,
    round: raw.round,
  };
}

function normalizeLeagues(data: unknown): League[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeLeague(item as RawLeague)).filter((league) => league.id > 0 && league.name);
}

async function fetchFromApi<T>(endpoint: string, params?: Record<string, string | number | undefined>, options?: { cacheTtl?: number; noCache?: boolean }): Promise<T> {
  const url = new URL(`${FUNCTION_URL}${endpoint}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  const cacheKey = url.toString();
  if (!options?.noCache) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) return cached;
  }
  let accessToken = SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token || SUPABASE_ANON_KEY;
  } catch {
    accessToken = SUPABASE_ANON_KEY;
  }
  let response: Response;
  try {
    response = await fetch(url.toString(), { headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` } });
  } catch {
    throw new ApiError(0, 'connectionError');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({} as { error?: string }));
    const key = response.status === 401 ? 'error401' : response.status === 403 ? 'error403' : response.status === 404 ? 'error404' : response.status === 429 ? 'error429' : response.status >= 500 ? 'error500' : 'somethingWrong';
    throw new ApiError(response.status, body.error || key);
  }
  const payload = await response.json();
  const result = payload.response ?? payload;
  if (!options?.noCache) setCached(cacheKey, result, options?.cacheTtl ?? DEFAULT_TTL);
  return result as T;
}

export const footballApi = {
  getLiveMatches: () => fetchFromApi<MatchFixture[]>('/fixtures', { live: 'all' }, { noCache: true }),
  getMatchesByDate: (date: string) => fetchFromApi<MatchFixture[]>('/fixtures', { date }, { cacheTtl: DEFAULT_TTL }),
  getMatchesByLeague: (leagueId: number, season: number) => fetchFromApi<MatchFixture[]>('/fixtures', { league: leagueId, season }, { cacheTtl: LONG_TTL }),
  getMatchesByTeam: (teamId: number, season?: number) => fetchFromApi<MatchFixture[]>('/fixtures', { team: teamId, season, last: 20 }, { cacheTtl: LONG_TTL }),
  getFixtureDetails: (fixtureId: number) => fetchFromApi<MatchFixture[]>('/fixtures', { id: fixtureId }, { cacheTtl: LONG_TTL }),
  getMatchEvents: (fixtureId: number) => fetchFromApi<MatchEvent[]>('/fixtures/events', { fixture: fixtureId }, { noCache: true }),
  getMatchStatistics: (fixtureId: number) => fetchFromApi<MatchStatistic[]>('/fixtures/statistics', { fixture: fixtureId }, { cacheTtl: LONG_TTL }),
  getLineups: (fixtureId: number) => fetchFromApi<Lineup[]>('/fixtures/lineups', { fixture: fixtureId }, { cacheTtl: LONG_TTL }),
  getLeagues: async (search?: string) => normalizeLeagues(await fetchFromApi<RawLeague[]>('/leagues', { search }, { cacheTtl: LONG_TTL })),
  getLeagueById: async (id: number) => normalizeLeagues(await fetchFromApi<RawLeague[]>('/leagues', { id }, { cacheTtl: LONG_TTL })),
  getLeaguesByTeam: async (teamId: number, season?: number) => normalizeLeagues(await fetchFromApi<RawLeague[]>('/leagues', { team: teamId, season }, { cacheTtl: LONG_TTL })),
  searchTeams: (search: string) => fetchFromApi<any[]>('/teams', { search }, { cacheTtl: LONG_TTL }),
  searchPlayers: (search: string) => fetchFromApi<any[]>('/players', { search, page: 1 }, { cacheTtl: LONG_TTL }),
  searchAll: async (search: string, language: 'ar' | 'en' = 'ar') => {
    const [leagues, teams, players] = await Promise.all([footballApi.getLeagues(search), footballApi.searchTeams(search), footballApi.searchPlayers(search)]);
    const teamResults = (teams || []).map((item: any) => item.team || item).filter((item: any) => item?.id);
    const matches = (await Promise.all(teamResults.slice(0, 3).map((team: any) => footballApi.getMatchesByTeam(Number(team.id))))).flat().slice(0, 10);
    const news = await newsApi.search(search, language).then((page) => page.articles).catch(() => []);
    return { leagues, teams: teamResults, players: players || [], matches, news };
  },
  getCurrentSeason: async (leagueId?: number) => {
    const leagues = leagueId ? await footballApi.getLeagueById(leagueId) : await footballApi.getLeagues();
    return leagues.find((league) => league.currentSeason)?.currentSeason || new Date().getFullYear();
  },
  getStandings: (leagueId: number, season: number) => fetchFromApi<StandingResponse[]>('/standings', { league: leagueId, season }, { cacheTtl: LONG_TTL }),
  getTeams: (leagueId: number, season: number) => fetchFromApi<Team[]>('/teams', { league: leagueId, season }, { cacheTtl: LONG_TTL }),
  getTeamDetails: (teamId: number) => fetchFromApi<TeamDetails[]>('/teams', { id: teamId }, { cacheTtl: LONG_TTL }),
  getPlayers: (teamId: number, season: number) => fetchFromApi<any[]>('/players/squads', { team: teamId, season }, { cacheTtl: LONG_TTL }),
  getPlayerDetails: (playerId: number, season: number) => fetchFromApi<PlayerDetails[]>('/players', { id: playerId, season }, { cacheTtl: LONG_TTL }),
  getTopScorers: (leagueId: number, season: number) => fetchFromApi<TopScorer[]>('/players/topscorers', { league: leagueId, season }, { cacheTtl: LONG_TTL }),
  getHeadToHead: (team1: number, team2: number) => fetchFromApi<MatchFixture[]>('/fixtures/headtohead', { h2h: `${team1}-${team2}` }, { cacheTtl: LONG_TTL }),
  clearCache: () => cache.clear(),
};
