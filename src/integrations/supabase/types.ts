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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      birthdays: {
        Row: {
          birth_date: string
          color: string | null
          created_at: string
          device_id: string
          emoji: string | null
          id: string
          name: string
          notes: string | null
          relation: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          color?: string | null
          created_at?: string
          device_id: string
          emoji?: string | null
          id?: string
          name: string
          notes?: string | null
          relation?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          color?: string | null
          created_at?: string
          device_id?: string
          emoji?: string | null
          id?: string
          name?: string
          notes?: string | null
          relation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_bg_themes: {
        Row: {
          config: Json
          created_at: string
          device_id: string
          emoji: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          device_id: string
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          device_id?: string
          emoji?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_card_items: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          image_url: string | null
          label: string | null
          set_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          label?: string | null
          set_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          label?: string | null
          set_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_card_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "custom_card_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_card_sets: {
        Row: {
          color: string | null
          created_at: string
          device_id: string
          emoji: string | null
          id: string
          name: string
          settings_json: Json | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          device_id: string
          emoji?: string | null
          id?: string
          name: string
          settings_json?: Json | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          device_id?: string
          emoji?: string | null
          id?: string
          name?: string
          settings_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      game_settings: {
        Row: {
          animations_enabled: boolean | null
          bg_theme: string | null
          builtin_melody_id: string | null
          card_back_color: string
          card_back_color_2: string | null
          card_back_icon: string
          card_border_color: string
          card_border_radius: number
          card_border_width: number
          card_max_w: number
          card_shape: string
          created_at: string
          custom_music: string | null
          custom_music_name: string | null
          custom_voice_enabled: boolean | null
          device_id: string
          emoji_scale: number
          flip_duration: number
          id: string
          music_type: string
          pair_count: number
          sound_enabled: boolean
          speech_enabled: boolean | null
          speech_rate: number | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          animations_enabled?: boolean | null
          bg_theme?: string | null
          builtin_melody_id?: string | null
          card_back_color?: string
          card_back_color_2?: string | null
          card_back_icon?: string
          card_border_color?: string
          card_border_radius?: number
          card_border_width?: number
          card_max_w?: number
          card_shape?: string
          created_at?: string
          custom_music?: string | null
          custom_music_name?: string | null
          custom_voice_enabled?: boolean | null
          device_id: string
          emoji_scale?: number
          flip_duration?: number
          id?: string
          music_type?: string
          pair_count?: number
          sound_enabled?: boolean
          speech_enabled?: boolean | null
          speech_rate?: number | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          animations_enabled?: boolean | null
          bg_theme?: string | null
          builtin_melody_id?: string | null
          card_back_color?: string
          card_back_color_2?: string | null
          card_back_icon?: string
          card_border_color?: string
          card_border_radius?: number
          card_border_width?: number
          card_max_w?: number
          card_shape?: string
          created_at?: string
          custom_music?: string | null
          custom_music_name?: string | null
          custom_voice_enabled?: boolean | null
          device_id?: string
          emoji_scale?: number
          flip_duration?: number
          id?: string
          music_type?: string
          pair_count?: number
          sound_enabled?: boolean
          speech_enabled?: boolean | null
          speech_rate?: number | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      voice_recordings: {
        Row: {
          audio_url: string
          created_at: string
          device_id: string
          event_type: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          device_id: string
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          device_id?: string
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
