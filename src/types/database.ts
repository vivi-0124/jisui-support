export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          quantity: number
          unit: string
          expiry_date: string | null
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          quantity: number
          unit: string
          expiry_date?: string | null
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          quantity?: number
          unit?: string
          expiry_date?: string | null
          location?: string | null
          created_at?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          quantity: number
          unit: string
          is_purchased: boolean
          notes: string | null
          added_date: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          quantity: number
          unit: string
          is_purchased?: boolean
          notes?: string | null
          added_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          quantity?: number
          unit?: string
          is_purchased?: boolean
          notes?: string | null
          added_date?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          playlist_id: string
          title: string
          url: string
          thumbnail: string
          duration: string | null
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          title: string
          url: string
          thumbnail: string
          duration?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          title?: string
          url?: string
          thumbnail?: string
          duration?: string | null
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          }
        ]
      }
      extracted_recipes: {
        Row: {
          id: string
          user_id: string
          video_id: string
          title: string
          ingredients: string[] | null
          steps: string[] | null
          servings: string | null
          cooking_time: string | null
          description: string | null
          extraction_method: string
          video_url: string
          video_title: string
          video_thumbnail: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          title: string
          ingredients?: string[] | null
          steps?: string[] | null
          servings?: string | null
          cooking_time?: string | null
          description?: string | null
          extraction_method: string
          video_url: string
          video_title: string
          video_thumbnail: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          title?: string
          ingredients?: string[] | null
          steps?: string[] | null
          servings?: string | null
          cooking_time?: string | null
          description?: string | null
          extraction_method?: string
          video_url?: string
          video_title?: string
          video_thumbnail?: string
          created_at?: string
        }
        Relationships: []
      }
      cooking_sessions: {
        Row: {
          id: string
          user_id: string
          dish_name: string
          servings: number
          used_ingredients: Json | null
          cooking_time: number
          notes: string | null
          recipe_video_url: string | null
          video_id: string | null
          status: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          dish_name: string
          servings: number
          used_ingredients?: Json | null
          cooking_time: number
          notes?: string | null
          recipe_video_url?: string | null
          video_id?: string | null
          status?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          dish_name?: string
          servings?: number
          used_ingredients?: Json | null
          cooking_time?: number
          notes?: string | null
          recipe_video_url?: string | null
          video_id?: string | null
          status?: string | null
          created_at?: string
          completed_at?: string | null
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