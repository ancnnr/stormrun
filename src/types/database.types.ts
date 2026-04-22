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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement: string
          reward_title: string | null
          reward_xp: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement: string
          reward_title?: string | null
          reward_xp?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement?: string
          reward_title?: string | null
          reward_xp?: number
        }
        Relationships: []
      }
      encouragement_audio: {
        Row: {
          audio_url: string
          category: string
          created_at: string
          duration_s: number | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          category?: string
          created_at?: string
          duration_s?: number | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          category?: string
          created_at?: string
          duration_s?: number | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          description: string
          effects: Json
          icon: string
          id: string
          max_stack: number | null
          name: string
          rarity: string
          sort_order: number
          unlock_requirement: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          effects?: Json
          icon?: string
          id: string
          max_stack?: number | null
          name: string
          rarity?: string
          sort_order?: number
          unlock_requirement?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          effects?: Json
          icon?: string
          id?: string
          max_stack?: number | null
          name?: string
          rarity?: string
          sort_order?: number
          unlock_requirement?: string | null
        }
        Relationships: []
      }
      mission_audio_events: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          label: string | null
          mission_id: string
          random_max_pct: number | null
          sequence: number
          transcript: string | null
          trigger_type: string
          trigger_value: number | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          label?: string | null
          mission_id: string
          random_max_pct?: number | null
          sequence: number
          transcript?: string | null
          trigger_type: string
          trigger_value?: number | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          label?: string | null
          mission_id?: string
          random_max_pct?: number | null
          sequence?: number
          transcript?: string | null
          trigger_type?: string
          trigger_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_audio_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_routes: {
        Row: {
          created_at: string
          enclosed_region: Json | null
          id: string
          item_markers: Json | null
          mission_id: string
          mission_title: string | null
          route_coordinates: Json
          saved_at: string
          start_point_lat: number
          start_point_lng: number
          total_distance_m: number | null
          turn_triggers: Json | null
          user_id: string
          waypoints: Json
        }
        Insert: {
          created_at?: string
          enclosed_region?: Json | null
          id?: string
          item_markers?: Json | null
          mission_id: string
          mission_title?: string | null
          route_coordinates?: Json
          saved_at?: string
          start_point_lat: number
          start_point_lng: number
          total_distance_m?: number | null
          turn_triggers?: Json | null
          user_id: string
          waypoints?: Json
        }
        Update: {
          created_at?: string
          enclosed_region?: Json | null
          id?: string
          item_markers?: Json | null
          mission_id?: string
          mission_title?: string | null
          route_coordinates?: Json
          saved_at?: string
          start_point_lat?: number
          start_point_lng?: number
          total_distance_m?: number | null
          turn_triggers?: Json | null
          user_id?: string
          waypoints?: Json
        }
        Relationships: []
      }
      missions: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          estimated_distance: number
          estimated_time: string
          hazards: Json
          id: string
          is_priority: boolean
          locomotion_type: string | null
          narration: Json | null
          objectives: Json
          rewards: Json
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          estimated_distance: number
          estimated_time: string
          hazards?: Json
          id: string
          is_priority?: boolean
          locomotion_type?: string | null
          narration?: Json | null
          objectives?: Json
          rewards?: Json
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          estimated_distance?: number
          estimated_time?: string
          hazards?: Json
          id?: string
          is_priority?: boolean
          locomotion_type?: string | null
          narration?: Json | null
          objectives?: Json
          rewards?: Json
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          faction_influence: number
          gold: number
          health: number
          id: string
          level: number
          max_health: number
          max_stamina: number
          role: string
          shelter_latitude: number | null
          shelter_longitude: number | null
          shelter_name: string | null
          stamina: number
          territory_cell_count: number
          updated_at: string
          username: string
          vitals_age: number | null
          vitals_experience_level: string | null
          vitals_gender: string | null
          vitals_height: number | null
          vitals_height_unit: string | null
          vitals_weekly_goal: number | null
          vitals_weight: number | null
          vitals_weight_unit: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          faction_influence?: number
          gold?: number
          health?: number
          id: string
          level?: number
          max_health?: number
          max_stamina?: number
          role?: string
          shelter_latitude?: number | null
          shelter_longitude?: number | null
          shelter_name?: string | null
          stamina?: number
          territory_cell_count?: number
          updated_at?: string
          username: string
          vitals_age?: number | null
          vitals_experience_level?: string | null
          vitals_gender?: string | null
          vitals_height?: number | null
          vitals_height_unit?: string | null
          vitals_weekly_goal?: number | null
          vitals_weight?: number | null
          vitals_weight_unit?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          faction_influence?: number
          gold?: number
          health?: number
          id?: string
          level?: number
          max_health?: number
          max_stamina?: number
          role?: string
          shelter_latitude?: number | null
          shelter_longitude?: number | null
          shelter_name?: string | null
          stamina?: number
          territory_cell_count?: number
          updated_at?: string
          username?: string
          vitals_age?: number | null
          vitals_experience_level?: string | null
          vitals_gender?: string | null
          vitals_height?: number | null
          vitals_height_unit?: string | null
          vitals_weekly_goal?: number | null
          vitals_weight?: number | null
          vitals_weight_unit?: string | null
          xp?: number
        }
        Relationships: []
      }
      program_missions: {
        Row: {
          created_at: string
          day_in_week: number
          id: string
          intervals: Json | null
          is_rest_day: boolean
          mission_id: string
          program_id: string
          sort_order: number
          timeline_week_mapping: Json
          week_number: number
        }
        Insert: {
          created_at?: string
          day_in_week: number
          id?: string
          intervals?: Json | null
          is_rest_day?: boolean
          mission_id: string
          program_id: string
          sort_order?: number
          timeline_week_mapping?: Json
          week_number: number
        }
        Update: {
          created_at?: string
          day_in_week?: number
          id?: string
          intervals?: Json | null
          is_rest_day?: boolean
          mission_id?: string
          program_id?: string
          sort_order?: number
          timeline_week_mapping?: Json
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_missions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          default_sessions_per_week: number
          description: string | null
          difficulty: string
          expected_outcomes: Json | null
          icon: string | null
          id: string
          long_description: string | null
          slug: string
          sort_order: number
          status: string
          timeline_options: Json
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          default_sessions_per_week?: number
          description?: string | null
          difficulty: string
          expected_outcomes?: Json | null
          icon?: string | null
          id?: string
          long_description?: string | null
          slug: string
          sort_order?: number
          status?: string
          timeline_options: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          default_sessions_per_week?: number
          description?: string | null
          difficulty?: string
          expected_outcomes?: Json | null
          icon?: string | null
          id?: string
          long_description?: string | null
          slug?: string
          sort_order?: number
          status?: string
          timeline_options?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string
          version: string
        }
        Insert: {
          applied_at?: string
          version: string
        }
        Update: {
          applied_at?: string
          version?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          created_at: string
          id: string
          item_id: string
          quantity: number
          unlocked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          quantity?: number
          unlocked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          quantity?: number
          unlocked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_loadout: {
        Row: {
          consumable_ids: Json
          equipment_ids: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consumable_ids?: Json
          equipment_ids?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consumable_ids?: Json
          equipment_ids?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string
          distance_km: number | null
          id: string
          mission_id: string
          pace_min_per_km: number | null
          status: string
          time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          distance_km?: number | null
          id?: string
          mission_id: string
          pace_min_per_km?: number | null
          status?: string
          time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          distance_km?: number | null
          id?: string
          mission_id?: string
          pace_min_per_km?: number | null
          status?: string
          time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_week: number
          id: string
          program_id: string
          start_date: string
          status: string
          timeline_weeks: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          program_id: string
          start_date: string
          status?: string
          timeline_weeks: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          program_id?: string
          start_date?: string
          status?: string
          timeline_weeks?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          program_mission_id: string
          scheduled_date: string | null
          skipped: boolean
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          program_mission_id: string
          scheduled_date?: string | null
          skipped?: boolean
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          program_mission_id?: string
          scheduled_date?: string | null
          skipped?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_program_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_program_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_sessions_program_mission_id_fkey"
            columns: ["program_mission_id"]
            isOneToOne: false
            referencedRelation: "program_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          audio_cues: boolean
          contrast: string
          encouragement_level: number
          font_size: string
          id: string
          indoor_mode: boolean
          master_volume: number
          music_volume: number
          notify_achievements: boolean
          notify_faction: boolean
          notify_missions: boolean
          sfx_volume: number
          updated_at: string
          voice_volume: number
          wifi_only_mode: boolean
        }
        Insert: {
          audio_cues?: boolean
          contrast?: string
          encouragement_level?: number
          font_size?: string
          id: string
          indoor_mode?: boolean
          master_volume?: number
          music_volume?: number
          notify_achievements?: boolean
          notify_faction?: boolean
          notify_missions?: boolean
          sfx_volume?: number
          updated_at?: string
          voice_volume?: number
          wifi_only_mode?: boolean
        }
        Update: {
          audio_cues?: boolean
          contrast?: string
          encouragement_level?: number
          font_size?: string
          id?: string
          indoor_mode?: boolean
          master_volume?: number
          music_volume?: number
          notify_achievements?: boolean
          notify_faction?: boolean
          notify_missions?: boolean
          sfx_volume?: number
          updated_at?: string
          voice_volume?: number
          wifi_only_mode?: boolean
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          average_pace: number
          current_streak: number
          id: string
          last_run_date: string | null
          longest_streak: number
          mission_chain: number
          missions_complete: number
          top_distance: number
          total_distance: number
          total_runs: number
          total_time: number
          updated_at: string
          weekly_progress_current: number
          weekly_progress_target: number
        }
        Insert: {
          average_pace?: number
          current_streak?: number
          id: string
          last_run_date?: string | null
          longest_streak?: number
          mission_chain?: number
          missions_complete?: number
          top_distance?: number
          total_distance?: number
          total_runs?: number
          total_time?: number
          updated_at?: string
          weekly_progress_current?: number
          weekly_progress_target?: number
        }
        Update: {
          average_pace?: number
          current_streak?: number
          id?: string
          last_run_date?: string | null
          longest_streak?: number
          mission_chain?: number
          missions_complete?: number
          top_distance?: number
          total_distance?: number
          total_runs?: number
          total_time?: number
          updated_at?: string
          weekly_progress_current?: number
          weekly_progress_target?: number
        }
        Relationships: []
      }
      user_territory_cells: {
        Row: {
          cell_index: string
          claimed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          cell_index: string
          claimed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          cell_index?: string
          claimed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_user_xp: {
        Args: { user_id: string; xp_amount: number }
        Returns: {
          leveled_up: boolean
          levels_gained: number
          new_level: number
          new_xp: number
        }[]
      }
      level_from_xp: { Args: { total_xp: number }; Returns: number }
      xp_for_level: { Args: { lvl: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
