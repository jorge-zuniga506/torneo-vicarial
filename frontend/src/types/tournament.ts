// Alias de dominio sobre los tipos generados (database.ts), para no repetir
// Database['public']['Tables'][...]['Row'] en todo el código.
import type { Database } from './database'

type Tables = Database['public']['Tables']
type Views = Database['public']['Views']
type Functions = Database['public']['Functions']

export type Tournament = Tables['tournaments']['Row']
export type TournamentSettings = Tables['tournament_settings']['Row']
export type Group = Tables['groups']['Row']
export type Team = Tables['teams']['Row']
export type Player = Tables['players']['Row']
export type Match = Tables['matches']['Row']
export type MatchEvent = Tables['match_events']['Row']
export type Standing = Tables['standings']['Row']
export type RouletteDraw = Tables['roulette_draws']['Row']
export type PlayerStats = Views['player_stats']['Row']

export type MatchStatus = Database['public']['Enums']['match_status']
export type MatchPeriod = Database['public']['Enums']['match_period']
export type MatchStage = Database['public']['Enums']['match_stage']
export type MatchCategory = Database['public']['Enums']['match_category']
export type EventType = Database['public']['Enums']['event_type']
export type UserRole = Database['public']['Enums']['user_role']

export type RecordGoalArgs = Functions['record_goal']['Args']
export type RecordCardArgs = Functions['record_card']['Args']
export type SetMatchScoreArgs = Functions['set_match_score']['Args']

// Combinaciones útiles para la UI (join manual vía dos queries o `select`
// anidado de supabase-js con foreign tables).
export interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
}

export interface StandingWithTeam extends Standing {
  team: Team
}

export interface TeamWithPlayers extends Team {
  players: Player[]
}
