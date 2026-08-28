export interface Team {
  id: number;
  name: string;
  logo: string;
  winner?: boolean | null;
}

export interface League {
  id: number;
  name: string;
  logo: string;
  country?: string;
  flag?: string;
  countryFlag?: string;
  type?: 'League' | 'Cup' | string;
  season?: number;
  currentSeason?: number;
  round?: string;
}

export interface MatchFixture {
  fixture: { id: number; referee?: string; timezone?: string; date: string; timestamp: number; venue?: { id?: number; name?: string; city?: string }; status: { long?: string; short: MatchStatus; elapsed?: number | null } };
  league: League;
  teams: { home: Team; away: Team };
  goals: { home: number | null; away: number | null };
  score?: { halftime?: { home: number | null; away: number | null }; fulltime?: { home: number | null; away: number | null }; extratime?: { home: number | null; away: number | null }; penalty?: { home: number | null; away: number | null } };
}

export interface MatchEvent { time: { elapsed: number; extra?: number | null }; team: { id: number; name: string; logo: string }; player: { id: number; name: string }; assist?: { id: number; name: string } | null; type: string; detail: string; comments?: string | null }
export interface MatchStatistic { team: { id: number; name: string; logo: string }; statistics: { type: string; value: string | number | null }[] }
export interface LineupPlayer { player: { id: number; name: string; number: number | null; pos: string; grid?: string } }
export interface Lineup { team: { id: number; name: string; logo: string; colors?: any }; formation: string; startXI: LineupPlayer[]; substitutes: LineupPlayer[]; coach: { id: number; name: string; photo?: string } }
export interface StandingRow { rank: number; team: Team; points: number; group?: string; all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; home?: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; away?: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }; goalsDiff: number; form?: string; status?: string; description?: string }
export interface StandingResponse { league: { id: number; name: string; logo: string; season: number; standings: StandingRow[][] } }
export interface TopScorer { player: { id: number; name: string; photo?: string }; statistics: { team: Team; league: League; appearances?: { total: number; lineups: number }; goals: { total: number | null }; assists?: { total: number | null }; cards?: { yellow: number; red: number } }[] }
export interface TeamDetails { team: { id: number; name: string; logo: string; founded?: number; country?: string; venue?: { name: string; city: string } }; venue?: { id: number; name: string; address: string; city: string; capacity: number; image?: string } }
export interface PlayerDetails { player: { id: number; name: string; photo?: string; nationality?: string; age?: number; birth?: { date?: string } }; statistics: { team: Team; league: League; games: { appearances: number; lineups: number; minutes: number; number: number | null; position: string }; goals: { total: number | null; assists?: number | null }; cards: { yellow: number; red: number } }[] }
export interface Transfer { player: { id: number; name: string; photo?: string }; from: { id: number; name: string; logo: string }; to: { id: number; name: string; logo: string }; date: string; type: string; fee?: string }
export interface NewsItem { id: string; title: string; summary?: string; description?: string; image?: string; source?: string; sourceName?: string; sourceUrl?: string; publishedAt: string; category: string; language?: string; url: string; content?: string }
export interface NewsPage { articles: NewsItem[]; page: number; pageSize: number; total: number; hasMore: boolean }
export type MatchStatus = 'TBD' | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT' | 'AET' | 'PEN' | 'PST' | 'CANC' | 'ABD' | 'SUSP' | 'INT' | 'LIVE' | string;
