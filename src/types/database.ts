/**
 * Database types for supabase-js.
 *
 * Written to match supabase/migrations by hand for now, in the same format the
 * Supabase CLI generates. Once your project is linked, regenerate with:
 *
 *   npm run db:types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3";
  };
  public: {
    Tables: {
      entries: {
        Row: {
          created_at: string;
          id: string;
          is_private: boolean;
          media_item_id: string;
          profile_id: string;
          progress: string | null;
          rank: number;
          rating: number | null;
          section_id: string;
          status: Database["public"]["Enums"]["entry_status"];
          updated_at: string;
          why_i_love_it: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_private?: boolean;
          media_item_id: string;
          profile_id: string;
          progress?: string | null;
          rank: number;
          rating?: number | null;
          section_id: string;
          status?: Database["public"]["Enums"]["entry_status"];
          updated_at?: string;
          why_i_love_it?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_private?: boolean;
          media_item_id?: string;
          profile_id?: string;
          progress?: string | null;
          rank?: number;
          rating?: number | null;
          section_id?: string;
          status?: Database["public"]["Enums"]["entry_status"];
          updated_at?: string;
          why_i_love_it?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entries_media_item_id_fkey";
            columns: ["media_item_id"];
            isOneToOne: false;
            referencedRelation: "media_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entries_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entries_section_same_profile_fk";
            columns: ["section_id", "profile_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id", "profile_id"];
          },
        ];
      };
      integrations: {
        Row: {
          created_at: string;
          external_username: string;
          profile_id: string;
          provider: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          external_username: string;
          profile_id: string;
          provider: string;
          settings?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          external_username?: string;
          profile_id?: string;
          provider?: string;
          settings?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integrations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media_items: {
        Row: {
          backdrop_url: string | null;
          created_at: string;
          external_id: string;
          fetched_at: string;
          id: string;
          image_url: string | null;
          kind: Database["public"]["Enums"]["media_kind"];
          metadata: Json;
          source: Database["public"]["Enums"]["media_source"];
          subtitle: string | null;
          title: string;
          year: number | null;
        };
        Insert: {
          backdrop_url?: string | null;
          created_at?: string;
          external_id: string;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          kind: Database["public"]["Enums"]["media_kind"];
          metadata?: Json;
          source: Database["public"]["Enums"]["media_source"];
          subtitle?: string | null;
          title: string;
          year?: number | null;
        };
        Update: {
          backdrop_url?: string | null;
          created_at?: string;
          external_id?: string;
          fetched_at?: string;
          id?: string;
          image_url?: string | null;
          kind?: Database["public"]["Enums"]["media_kind"];
          metadata?: Json;
          source?: Database["public"]["Enums"]["media_source"];
          subtitle?: string | null;
          title?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          accent: string;
          avatar_path: string | null;
          bio: string | null;
          cover_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_hidden: boolean;
          location: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          accent?: string;
          avatar_path?: string | null;
          bio?: string | null;
          cover_path?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          is_hidden?: boolean;
          location?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          accent?: string;
          avatar_path?: string | null;
          bio?: string | null;
          cover_path?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_hidden?: boolean;
          location?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          profile_id: string;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          profile_id: string;
          reason: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["section_kind"];
          position: number;
          profile_id: string;
          visible: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["section_kind"];
          position: number;
          profile_id: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["section_kind"];
          position?: number;
          profile_id?: string;
          visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "sections_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      social_links: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          position: number;
          profile_id: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          position: number;
          profile_id: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          position?: number;
          profile_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_links_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      publish_shelf: {
        Args: {
          p_avatar_path?: string;
          p_bio: string;
          p_display_name: string;
          p_items: Json;
          p_section_kind: Database["public"]["Enums"]["section_kind"];
          p_username: string;
        };
        Returns: string;
      };
    };
    Enums: {
      entry_status:
        | "favorite"
        | "watching"
        | "reading"
        | "listening"
        | "playing"
        | "completed"
        | "dropped"
        | "want";
      media_kind: "film" | "show" | "book" | "album" | "track" | "artist";
      media_source: "tmdb" | "openlibrary" | "lastfm";
      section_kind: "films" | "shows" | "books" | "music" | "currently";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
