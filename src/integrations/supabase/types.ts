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
      birthday_reminders: {
        Row: {
          birthday_id: string
          channels: string[]
          created_at: string
          days_before: number[]
          device_id: string
          enabled: boolean
          id: string
          last_sent_at: string | null
          last_sent_days_before: number | null
          last_sent_for_year: number | null
          recipient_id: string
          updated_at: string
        }
        Insert: {
          birthday_id: string
          channels?: string[]
          created_at?: string
          days_before?: number[]
          device_id: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          last_sent_days_before?: number | null
          last_sent_for_year?: number | null
          recipient_id: string
          updated_at?: string
        }
        Update: {
          birthday_id?: string
          channels?: string[]
          created_at?: string
          days_before?: number[]
          device_id?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          last_sent_days_before?: number | null
          last_sent_for_year?: number | null
          recipient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "birthday_reminders_birthday_id_fkey"
            columns: ["birthday_id"]
            isOneToOne: false
            referencedRelation: "birthdays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_reminders_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "family_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      custom_animations: {
        Row: {
          animation_type: string
          animation_url: string
          created_at: string
          device_id: string
          duration_ms: number | null
          event_type: string
          id: string
          is_active: boolean
          name: string
          thumbnail_url: string | null
        }
        Insert: {
          animation_type?: string
          animation_url: string
          created_at?: string
          device_id: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
          thumbnail_url?: string | null
        }
        Update: {
          animation_type?: string
          animation_url?: string
          created_at?: string
          device_id?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          is_active?: boolean
          name?: string
          thumbnail_url?: string | null
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
      families: {
        Row: {
          admin_device_id: string
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          admin_device_id: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          admin_device_id?: string
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_collages: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          background: string | null
          background_image: string | null
          category: string | null
          cols: number
          cover_url: string | null
          created_at: string
          description: string | null
          device_id: string
          emoji: string | null
          event_tag: string | null
          family_tag: string | null
          gap: number
          id: string
          is_folder: boolean
          layout_type: string
          location_tag: string | null
          name: string
          parent_id: string | null
          purge_after: string | null
          share_code: string
          sort_order: number | null
          tags: string[]
          updated_at: string
          year_tag: number | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          background?: string | null
          background_image?: string | null
          category?: string | null
          cols?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          device_id: string
          emoji?: string | null
          event_tag?: string | null
          family_tag?: string | null
          gap?: number
          id?: string
          is_folder?: boolean
          layout_type?: string
          location_tag?: string | null
          name?: string
          parent_id?: string | null
          purge_after?: string | null
          share_code?: string
          sort_order?: number | null
          tags?: string[]
          updated_at?: string
          year_tag?: number | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          background?: string | null
          background_image?: string | null
          category?: string | null
          cols?: number
          cover_url?: string | null
          created_at?: string
          description?: string | null
          device_id?: string
          emoji?: string | null
          event_tag?: string | null
          family_tag?: string | null
          gap?: number
          id?: string
          is_folder?: boolean
          layout_type?: string
          location_tag?: string | null
          name?: string
          parent_id?: string | null
          purge_after?: string | null
          share_code?: string
          sort_order?: number | null
          tags?: string[]
          updated_at?: string
          year_tag?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_collages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "family_collages"
            referencedColumns: ["id"]
          },
        ]
      }
      family_events: {
        Row: {
          color: string | null
          created_at: string
          device_id: string
          emoji: string | null
          event_date: string
          event_type: string
          id: string
          name: string
          notes: string | null
          recurring: boolean
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          device_id: string
          emoji?: string | null
          event_date: string
          event_type?: string
          id?: string
          name: string
          notes?: string | null
          recurring?: boolean
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          device_id?: string
          emoji?: string | null
          event_date?: string
          event_type?: string
          id?: string
          name?: string
          notes?: string | null
          recurring?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          device_id: string
          family_id: string
          id: string
          joined_at: string
          nickname: string | null
        }
        Insert: {
          device_id: string
          family_id: string
          id?: string
          joined_at?: string
          nickname?: string | null
        }
        Update: {
          device_id?: string
          family_id?: string
          id?: string
          joined_at?: string
          nickname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_photos: {
        Row: {
          caption: string | null
          collage_id: string
          created_at: string
          device_id: string
          duration_ms: number | null
          filter_style: string | null
          frame_style: string | null
          height: number | null
          id: string
          image_url: string
          media_type: string
          photo_date: string | null
          pos_x: number | null
          pos_y: number | null
          rotation: number | null
          sort_order: number | null
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          caption?: string | null
          collage_id: string
          created_at?: string
          device_id: string
          duration_ms?: number | null
          filter_style?: string | null
          frame_style?: string | null
          height?: number | null
          id?: string
          image_url: string
          media_type?: string
          photo_date?: string | null
          pos_x?: number | null
          pos_y?: number | null
          rotation?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          caption?: string | null
          collage_id?: string
          created_at?: string
          device_id?: string
          duration_ms?: number | null
          filter_style?: string | null
          frame_style?: string | null
          height?: number | null
          id?: string
          image_url?: string
          media_type?: string
          photo_date?: string | null
          pos_x?: number | null
          pos_y?: number | null
          rotation?: number | null
          sort_order?: number | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_photos_collage_id_fkey"
            columns: ["collage_id"]
            isOneToOne: false
            referencedRelation: "family_collages"
            referencedColumns: ["id"]
          },
        ]
      }
      family_recipients: {
        Row: {
          created_at: string
          device_id: string
          email: string | null
          emoji: string | null
          id: string
          is_active: boolean
          name: string
          phone_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          email?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          email?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_zip_import_jobs: {
        Row: {
          collage_id: string
          completed_at: string | null
          created_at: string
          device_id: string
          error_message: string | null
          extracted_count: number
          id: string
          progress: number
          source_file_name: string
          source_storage_path: string
          started_at: string | null
          status: string
          updated_at: string
          uploaded_count: number
        }
        Insert: {
          collage_id: string
          completed_at?: string | null
          created_at?: string
          device_id: string
          error_message?: string | null
          extracted_count?: number
          id?: string
          progress?: number
          source_file_name: string
          source_storage_path: string
          started_at?: string | null
          status?: string
          updated_at?: string
          uploaded_count?: number
        }
        Update: {
          collage_id?: string
          completed_at?: string | null
          created_at?: string
          device_id?: string
          error_message?: string | null
          extracted_count?: number
          id?: string
          progress?: number
          source_file_name?: string
          source_storage_path?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          uploaded_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "family_zip_import_jobs_collage_id_fkey"
            columns: ["collage_id"]
            isOneToOne: false
            referencedRelation: "family_collages"
            referencedColumns: ["id"]
          },
        ]
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
          card_positions: Json | null
          card_shape: string
          created_at: string
          custom_music: string | null
          custom_music_name: string | null
          custom_voice_enabled: boolean | null
          device_id: string
          elevenlabs_effects_enabled: boolean
          elevenlabs_voice_id: string | null
          emoji_scale: number
          flip_duration: number
          grid_size: number | null
          id: string
          layout_mode: string | null
          layout_preset: string | null
          music_type: string
          pair_count: number
          sfx_mode: string
          snap_to_grid: boolean | null
          sound_enabled: boolean
          speech_enabled: boolean | null
          speech_lang: string
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
          card_positions?: Json | null
          card_shape?: string
          created_at?: string
          custom_music?: string | null
          custom_music_name?: string | null
          custom_voice_enabled?: boolean | null
          device_id: string
          elevenlabs_effects_enabled?: boolean
          elevenlabs_voice_id?: string | null
          emoji_scale?: number
          flip_duration?: number
          grid_size?: number | null
          id?: string
          layout_mode?: string | null
          layout_preset?: string | null
          music_type?: string
          pair_count?: number
          sfx_mode?: string
          snap_to_grid?: boolean | null
          sound_enabled?: boolean
          speech_enabled?: boolean | null
          speech_lang?: string
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
          card_positions?: Json | null
          card_shape?: string
          created_at?: string
          custom_music?: string | null
          custom_music_name?: string | null
          custom_voice_enabled?: boolean | null
          device_id?: string
          elevenlabs_effects_enabled?: boolean
          elevenlabs_voice_id?: string | null
          emoji_scale?: number
          flip_duration?: number
          grid_size?: number | null
          id?: string
          layout_mode?: string | null
          layout_preset?: string | null
          music_type?: string
          pair_count?: number
          sfx_mode?: string
          snap_to_grid?: boolean | null
          sound_enabled?: boolean
          speech_enabled?: boolean | null
          speech_lang?: string
          speech_rate?: number | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      layout_presets: {
        Row: {
          align: string
          cols: number
          created_at: string
          device_id: string
          gap: number
          id: string
          is_custom: boolean
          name: string
          pattern: string
          updated_at: string
        }
        Insert: {
          align?: string
          cols?: number
          created_at?: string
          device_id: string
          gap?: number
          id?: string
          is_custom?: boolean
          name?: string
          pattern?: string
          updated_at?: string
        }
        Update: {
          align?: string
          cols?: number
          created_at?: string
          device_id?: string
          gap?: number
          id?: string
          is_custom?: boolean
          name?: string
          pattern?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          custom_message_template: string | null
          device_id: string
          enabled: boolean
          id: string
          message_style: string
          send_hour_local: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_message_template?: string | null
          device_id: string
          enabled?: boolean
          id?: string
          message_style?: string
          send_hour_local?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_message_template?: string | null
          device_id?: string
          enabled?: boolean
          id?: string
          message_style?: string
          send_hour_local?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          slideshow_config: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          slideshow_config?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          slideshow_config?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purge_expired_family_collages: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
