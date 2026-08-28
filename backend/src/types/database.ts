// Generado automáticamente desde el schema real de Supabase
// (mcp__supabase__generate_typescript_types). No editar a mano: si el
// schema cambia, regenerar este archivo en vez de parchearlo.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      groups: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assist_player_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          match_id: string
          minute: number | null
          occurred_at: string
          period: Database["public"]["Enums"]["match_period"] | null
          player_id: string | null
          team_id: string | null
        }
        Insert: {
          assist_player_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          match_id: string
          minute?: number | null
          occurred_at?: string
          period?: Database["public"]["Enums"]["match_period"] | null
          player_id?: string | null
          team_id?: string | null
        }
        Update: {
          assist_player_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          match_id?: string
          minute?: number | null
          occurred_at?: string
          period?: Database["public"]["Enums"]["match_period"] | null
          player_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number
          away_source_match_id: string | null
          away_team_id: string | null
          bracket_slot: string | null
          created_at: string
          current_period: Database["public"]["Enums"]["match_period"]
          elapsed_seconds: number
          group_id: string | null
          home_score: number
          home_source_match_id: string | null
          home_team_id: string | null
          id: string
          matchday: number | null
          paused_at: string | null
          scheduled_at: string
          stage: Database["public"]["Enums"]["match_stage"]
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          venue: string
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number
          away_source_match_id?: string | null
          away_team_id?: string | null
          bracket_slot?: string | null
          created_at?: string
          current_period?: Database["public"]["Enums"]["match_period"]
          elapsed_seconds?: number
          group_id?: string | null
          home_score?: number
          home_source_match_id?: string | null
          home_team_id?: string | null
          id?: string
          matchday?: number | null
          paused_at?: string | null
          scheduled_at: string
          stage?: Database["public"]["Enums"]["match_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          venue?: string
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number
          away_source_match_id?: string | null
          away_team_id?: string | null
          bracket_slot?: string | null
          created_at?: string
          current_period?: Database["public"]["Enums"]["match_period"]
          elapsed_seconds?: number
          group_id?: string | null
          home_score?: number
          home_source_match_id?: string | null
          home_team_id?: string | null
          id?: string
          matchday?: number | null
          paused_at?: string | null
          scheduled_at?: string
          stage?: Database["public"]["Enums"]["match_stage"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          venue?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_source_match_id_fkey"
            columns: ["away_source_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_source_match_id_fkey"
            columns: ["home_source_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          jersey_number: number | null
          name: string
          photo_url: string | null
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          name: string
          photo_url?: string | null
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jersey_number?: number | null
          name?: string
          photo_url?: string | null
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      roulette_draws: {
        Row: {
          created_at: string
          created_by: string | null
          draw_type: string
          eliminated_ids: string[]
          group_id: string | null
          id: string
          result_player_id: string | null
          result_team_id: string | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          draw_type: string
          eliminated_ids?: string[]
          group_id?: string | null
          id?: string
          result_player_id?: string | null
          result_team_id?: string | null
          tournament_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          draw_type?: string
          eliminated_ids?: string[]
          group_id?: string | null
          id?: string
          result_player_id?: string | null
          result_team_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roulette_draws_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_draws_result_player_id_fkey"
            columns: ["result_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "roulette_draws_result_player_id_fkey"
            columns: ["result_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_draws_result_team_id_fkey"
            columns: ["result_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roulette_draws_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          drawn: number
          goal_diff: number
          goals_against: number
          goals_for: number
          group_id: string
          id: string
          lost: number
          played: number
          points: number
          position: number | null
          team_id: string
          tournament_id: string
          updated_at: string
          won: number
        }
        Insert: {
          drawn?: number
          goal_diff?: number
          goals_against?: number
          goals_for?: number
          group_id: string
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number | null
          team_id: string
          tournament_id: string
          updated_at?: string
          won?: number
        }
        Update: {
          drawn?: number
          goal_diff?: number
          goals_against?: number
          goals_for?: number
          group_id?: string
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number | null
          team_id?: string
          tournament_id?: string
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          captain_player_id: string | null
          color: string | null
          created_at: string
          fair_play_points: number
          group_id: string | null
          id: string
          logo_url: string | null
          name: string
          short_name: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_player_id?: string | null
          color?: string | null
          created_at?: string
          fair_play_points?: number
          group_id?: string | null
          id?: string
          logo_url?: string | null
          name: string
          short_name: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_player_id?: string | null
          color?: string | null
          created_at?: string
          fair_play_points?: number
          group_id?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_player_id_fkey"
            columns: ["captain_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "teams_captain_player_id_fkey"
            columns: ["captain_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_settings: {
        Row: {
          best_third_places: number
          break_end_time: string | null
          break_start_time: string | null
          elimination_format: string
          first_half_minutes: number
          group_count: number
          halftime_minutes: number
          matches_per_team_group_stage: number
          qualifiers_per_group: number
          second_half_minutes: number
          slot_minutes: number
          team_count: number
          teams_per_group: number
          tiebreaker_order: Json
          tournament_end_time: string
          tournament_id: string
          tournament_start_time: string
          updated_at: string
        }
        Insert: {
          best_third_places?: number
          break_end_time?: string | null
          break_start_time?: string | null
          elimination_format?: string
          first_half_minutes?: number
          group_count?: number
          halftime_minutes?: number
          matches_per_team_group_stage?: number
          qualifiers_per_group?: number
          second_half_minutes?: number
          slot_minutes?: number
          team_count?: number
          teams_per_group?: number
          tiebreaker_order?: Json
          tournament_end_time?: string
          tournament_id: string
          tournament_start_time?: string
          updated_at?: string
        }
        Update: {
          best_third_places?: number
          break_end_time?: string | null
          break_start_time?: string | null
          elimination_format?: string
          first_half_minutes?: number
          group_count?: number
          halftime_minutes?: number
          matches_per_team_group_stage?: number
          qualifiers_per_group?: number
          second_half_minutes?: number
          slot_minutes?: number
          team_count?: number
          teams_per_group?: number
          tiebreaker_order?: Json
          tournament_end_time?: string
          tournament_id?: string
          tournament_start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          champion_team_id: string | null
          created_at: string
          ends_at: string | null
          id: string
          name: string
          runner_up_team_id: string | null
          slug: string
          starts_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          champion_team_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          runner_up_team_id?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          champion_team_id?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          runner_up_team_id?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      player_stats: {
        Row: {
          assists: number | null
          goals: number | null
          player_id: string | null
          red_cards: number | null
          team_id: string | null
          yellow_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      finish_match: { Args: { p_match_id: string }; Returns: undefined }
      pause_match: { Args: { p_match_id: string }; Returns: undefined }
      recalculate_standings: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      record_card: {
        Args: {
          p_card_type: Database["public"]["Enums"]["event_type"]
          p_match_id: string
          p_minute?: number
          p_player_id: string
          p_team_id: string
        }
        Returns: undefined
      }
      record_goal: {
        Args: {
          p_assist_player_id?: string
          p_match_id: string
          p_minute?: number
          p_player_id: string
          p_team_id: string
        }
        Returns: undefined
      }
      reset_match: { Args: { p_match_id: string }; Returns: undefined }
      resume_match: { Args: { p_match_id: string }; Returns: undefined }
      set_match_score: {
        Args: { p_away_score: number; p_home_score: number; p_match_id: string }
        Returns: undefined
      }
      start_halftime: { Args: { p_match_id: string }; Returns: undefined }
      start_match: { Args: { p_match_id: string }; Returns: undefined }
      start_second_half: { Args: { p_match_id: string }; Returns: undefined }
      undo_goal: {
        Args: { p_event_id: string; p_match_id: string; p_team_id: string }
        Returns: undefined
      }
    }
    Enums: {
      event_type:
        | "GOAL"
        | "YELLOW_CARD"
        | "RED_CARD"
        | "SUBSTITUTION"
        | "START"
        | "HALFTIME"
        | "RESUME"
        | "END"
      match_period: "PRE" | "FIRST_HALF" | "HALFTIME" | "SECOND_HALF" | "ENDED"
      match_stage:
        | "GROUP"
        | "QUARTERFINAL"
        | "SEMIFINAL"
        | "FINAL"
        | "THIRD_PLACE"
      match_status:
        | "PROGRAMADO"
        | "CALENTAMIENTO"
        | "EN_JUEGO"
        | "DESCANSO"
        | "FINALIZADO"
        | "SUSPENDIDO"
        | "CANCELADO"
      user_role: "ADMIN" | "VIEWER"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: [
        "GOAL",
        "YELLOW_CARD",
        "RED_CARD",
        "SUBSTITUTION",
        "START",
        "HALFTIME",
        "RESUME",
        "END",
      ],
      match_period: ["PRE", "FIRST_HALF", "HALFTIME", "SECOND_HALF", "ENDED"],
      match_stage: [
        "GROUP",
        "QUARTERFINAL",
        "SEMIFINAL",
        "FINAL",
        "THIRD_PLACE",
      ],
      match_status: [
        "PROGRAMADO",
        "CALENTAMIENTO",
        "EN_JUEGO",
        "DESCANSO",
        "FINALIZADO",
        "SUSPENDIDO",
        "CANCELADO",
      ],
      user_role: ["ADMIN", "VIEWER"],
    },
  },
} as const
