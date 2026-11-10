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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      client_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          coach_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          coach_id: string
          created_at?: string
          email: string
          expires_at: string
          full_name?: string
          id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          coach_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invitations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_clients: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["relationship_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["relationship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_assignments: {
        Row: {
          assigned_at: string
          client_id: string
          coach_id: string
          created_at: string
          diet_plan_id: string
          diet_plan_revision_id: string
          end_date: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          coach_id: string
          created_at?: string
          diet_plan_id: string
          diet_plan_revision_id: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          diet_plan_id?: string
          diet_plan_revision_id?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_assignments_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_assignments_diet_plan_revision_id_fkey"
            columns: ["diet_plan_revision_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_food_items: {
        Row: {
          coach_notes: string
          created_at: string
          diet_meal_id: string
          food_id: string
          id: string
          quantity: number
          serving_multiplier: number
          updated_at: string
        }
        Insert: {
          coach_notes?: string
          created_at?: string
          diet_meal_id: string
          food_id: string
          id?: string
          quantity?: number
          serving_multiplier?: number
          updated_at?: string
        }
        Update: {
          coach_notes?: string
          created_at?: string
          diet_meal_id?: string
          food_id?: string
          id?: string
          quantity?: number
          serving_multiplier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_food_items_diet_meal_id_fkey"
            columns: ["diet_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_food_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_meals: {
        Row: {
          created_at: string
          diet_plan_id: string
          id: string
          meal_order: number
          meal_time: string | null
          name: string
          notes: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_plan_id: string
          id?: string
          meal_order?: number
          meal_time?: string | null
          name: string
          notes?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_plan_id?: string
          id?: string
          meal_order?: number
          meal_time?: string | null
          name?: string
          notes?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_meals_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plan_revisions: {
        Row: {
          carbs_target: number | null
          daily_calories: number | null
          description: string
          diet_plan_id: string
          fat_target: number | null
          goal: string
          id: string
          name: string
          protein_target: number | null
          published_at: string
          published_by: string
          revision: number
        }
        Insert: {
          carbs_target?: number | null
          daily_calories?: number | null
          description?: string
          diet_plan_id: string
          fat_target?: number | null
          goal?: string
          id?: string
          name: string
          protein_target?: number | null
          published_at?: string
          published_by: string
          revision: number
        }
        Update: {
          carbs_target?: number | null
          daily_calories?: number | null
          description?: string
          diet_plan_id?: string
          fat_target?: number | null
          goal?: string
          id?: string
          name?: string
          protein_target?: number | null
          published_at?: string
          published_by?: string
          revision?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_plan_revisions_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plan_revisions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          carbs_target: number | null
          coach_id: string
          created_at: string
          current_revision: number
          daily_calories: number | null
          description: string
          fat_target: number | null
          goal: string
          id: string
          name: string
          protein_target: number | null
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          carbs_target?: number | null
          coach_id: string
          created_at?: string
          current_revision?: number
          daily_calories?: number | null
          description?: string
          fat_target?: number | null
          goal?: string
          id?: string
          name: string
          protein_target?: number | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          carbs_target?: number | null
          coach_id?: string
          created_at?: string
          current_revision?: number
          daily_calories?: number | null
          description?: string
          fat_target?: number | null
          goal?: string
          id?: string
          name?: string
          protein_target?: number | null
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_revision_food_items: {
        Row: {
          coach_notes: string
          food_id: string
          id: string
          quantity: number
          revision_meal_id: string
          serving_multiplier: number
        }
        Insert: {
          coach_notes?: string
          food_id: string
          id?: string
          quantity: number
          revision_meal_id: string
          serving_multiplier: number
        }
        Update: {
          coach_notes?: string
          food_id?: string
          id?: string
          quantity?: number
          revision_meal_id?: string
          serving_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "diet_revision_food_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_revision_food_items_revision_meal_id_fkey"
            columns: ["revision_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_revision_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_revision_meals: {
        Row: {
          id: string
          meal_order: number
          meal_time: string | null
          name: string
          notes: string
          revision_id: string
        }
        Insert: {
          id?: string
          meal_order: number
          meal_time?: string | null
          name: string
          notes?: string
          revision_id: string
        }
        Update: {
          id?: string
          meal_order?: number
          meal_time?: string | null
          name?: string
          notes?: string
          revision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_revision_meals_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "diet_plan_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_set_logs: {
        Row: {
          actual_reps: number | null
          actual_weight: number | null
          created_at: string
          id: string
          is_completed: boolean
          prescribed_reps: number | null
          prescribed_weight: number | null
          set_number: number
          workout_revision_exercise_id: string
          workout_session_id: string
        }
        Insert: {
          actual_reps?: number | null
          actual_weight?: number | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prescribed_reps?: number | null
          prescribed_weight?: number | null
          set_number: number
          workout_revision_exercise_id: string
          workout_session_id: string
        }
        Update: {
          actual_reps?: number | null
          actual_weight?: number | null
          created_at?: string
          id?: string
          is_completed?: boolean
          prescribed_reps?: number | null
          prescribed_weight?: number | null
          set_number?: number
          workout_revision_exercise_id?: string
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_set_logs_workout_revision_exercise_id_fkey"
            columns: ["workout_revision_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_revision_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_set_logs_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string
          equipment: string
          id: string
          instructions: string
          muscle_group: string
          name: string
          owner_coach_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          equipment?: string
          id?: string
          instructions?: string
          muscle_group?: string
          name: string
          owner_coach_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          equipment?: string
          id?: string
          instructions?: string
          muscle_group?: string
          name?: string
          owner_coach_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          calories: number
          carbohydrates: number
          created_at: string
          fat: number
          id: string
          name: string
          owner_coach_id: string | null
          protein: number
          serving_size: number
          serving_unit: string
          updated_at: string
        }
        Insert: {
          calories?: number
          carbohydrates?: number
          created_at?: string
          fat?: number
          id?: string
          name: string
          owner_coach_id?: string | null
          protein?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
        }
        Update: {
          calories?: number
          carbohydrates?: number
          created_at?: string
          fat?: number
          id?: string
          name?: string
          owner_coach_id?: string | null
          protein?: number
          serving_size?: number
          serving_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foods_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_log_items: {
        Row: {
          actual_calories: number
          actual_carbs: number
          actual_fat: number
          actual_protein: number
          actual_quantity: number
          created_at: string
          diet_revision_food_item_id: string
          food_id: string
          id: string
          meal_log_id: string
        }
        Insert: {
          actual_calories?: number
          actual_carbs?: number
          actual_fat?: number
          actual_protein?: number
          actual_quantity?: number
          created_at?: string
          diet_revision_food_item_id: string
          food_id: string
          id?: string
          meal_log_id: string
        }
        Update: {
          actual_calories?: number
          actual_carbs?: number
          actual_fat?: number
          actual_protein?: number
          actual_quantity?: number
          created_at?: string
          diet_revision_food_item_id?: string
          food_id?: string
          id?: string
          meal_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_diet_revision_food_item_id_fkey"
            columns: ["diet_revision_food_item_id"]
            isOneToOne: false
            referencedRelation: "diet_revision_food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          client_id: string
          created_at: string
          diet_assignment_id: string
          diet_revision_meal_id: string
          id: string
          logged_at: string
          notes: string
          status: Database["public"]["Enums"]["meal_log_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          diet_assignment_id: string
          diet_revision_meal_id: string
          id?: string
          logged_at?: string
          notes?: string
          status?: Database["public"]["Enums"]["meal_log_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          diet_assignment_id?: string
          diet_revision_meal_id?: string
          id?: string
          logged_at?: string
          notes?: string
          status?: Database["public"]["Enums"]["meal_log_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_diet_assignment_id_fkey"
            columns: ["diet_assignment_id"]
            isOneToOne: false
            referencedRelation: "diet_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_logs_diet_revision_meal_id_fkey"
            columns: ["diet_revision_meal_id"]
            isOneToOne: false
            referencedRelation: "diet_revision_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      progress_entries: {
        Row: {
          body_weight: number | null
          chest: number | null
          client_id: string
          created_at: string
          hips: number | null
          id: string
          notes: string
          recorded_at: string
          updated_at: string
          waist: number | null
        }
        Insert: {
          body_weight?: number | null
          chest?: number | null
          client_id: string
          created_at?: string
          hips?: number | null
          id?: string
          notes?: string
          recorded_at?: string
          updated_at?: string
          waist?: number | null
        }
        Update: {
          body_weight?: number | null
          chest?: number | null
          client_id?: string
          created_at?: string
          hips?: number | null
          id?: string
          notes?: string
          recorded_at?: string
          updated_at?: string
          waist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_assignments: {
        Row: {
          assigned_at: string
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          workout_plan_id: string
          workout_plan_revision_id: string
        }
        Insert: {
          assigned_at?: string
          client_id: string
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          workout_plan_id: string
          workout_plan_revision_id: string
        }
        Update: {
          assigned_at?: string
          client_id?: string
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          workout_plan_id?: string
          workout_plan_revision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_assignments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_assignments_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_assignments_workout_plan_revision_id_fkey"
            columns: ["workout_plan_revision_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_days: {
        Row: {
          created_at: string
          day_name: string
          day_order: number
          id: string
          is_rest_day: boolean
          updated_at: string
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          day_name: string
          day_order?: number
          id?: string
          is_rest_day?: boolean
          updated_at?: string
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          day_name?: string
          day_order?: number
          id?: string
          is_rest_day?: boolean
          updated_at?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_days_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          coach_notes: string
          created_at: string
          exercise_id: string
          exercise_order: number
          id: string
          prescribed_weight: number | null
          reps: string
          rest_seconds: number | null
          sets: number
          updated_at: string
          workout_day_id: string
        }
        Insert: {
          coach_notes?: string
          created_at?: string
          exercise_id: string
          exercise_order?: number
          id?: string
          prescribed_weight?: number | null
          reps?: string
          rest_seconds?: number | null
          sets?: number
          updated_at?: string
          workout_day_id: string
        }
        Update: {
          coach_notes?: string
          created_at?: string
          exercise_id?: string
          exercise_order?: number
          id?: string
          prescribed_weight?: number | null
          reps?: string
          rest_seconds?: number | null
          sets?: number
          updated_at?: string
          workout_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_day_id_fkey"
            columns: ["workout_day_id"]
            isOneToOne: false
            referencedRelation: "workout_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plan_revisions: {
        Row: {
          description: string
          goal: string
          id: string
          name: string
          published_at: string
          published_by: string
          revision: number
          workout_plan_id: string
        }
        Insert: {
          description?: string
          goal?: string
          id?: string
          name: string
          published_at?: string
          published_by: string
          revision: number
          workout_plan_id: string
        }
        Update: {
          description?: string
          goal?: string
          id?: string
          name?: string
          published_at?: string
          published_by?: string
          revision?: number
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_revisions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plan_revisions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          coach_id: string
          created_at: string
          current_revision: number
          description: string
          goal: string
          id: string
          name: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          current_revision?: number
          description?: string
          goal?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          current_revision?: number
          description?: string
          goal?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_revision_days: {
        Row: {
          day_name: string
          day_order: number
          id: string
          is_rest_day: boolean
          revision_id: string
        }
        Insert: {
          day_name: string
          day_order: number
          id?: string
          is_rest_day?: boolean
          revision_id: string
        }
        Update: {
          day_name?: string
          day_order?: number
          id?: string
          is_rest_day?: boolean
          revision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_revision_days_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "workout_plan_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_revision_exercises: {
        Row: {
          coach_notes: string
          exercise_id: string
          exercise_order: number
          id: string
          prescribed_weight: number | null
          reps: string
          rest_seconds: number | null
          revision_day_id: string
          sets: number
        }
        Insert: {
          coach_notes?: string
          exercise_id: string
          exercise_order: number
          id?: string
          prescribed_weight?: number | null
          reps?: string
          rest_seconds?: number | null
          revision_day_id: string
          sets: number
        }
        Update: {
          coach_notes?: string
          exercise_id?: string
          exercise_order?: number
          id?: string
          prescribed_weight?: number | null
          reps?: string
          rest_seconds?: number | null
          revision_day_id?: string
          sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_revision_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_revision_exercises_revision_day_id_fkey"
            columns: ["revision_day_id"]
            isOneToOne: false
            referencedRelation: "workout_revision_days"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string
          started_at: string
          status: Database["public"]["Enums"]["workout_session_status"]
          updated_at: string
          workout_assignment_id: string
          workout_revision_day_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          updated_at?: string
          workout_assignment_id: string
          workout_revision_day_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_session_status"]
          updated_at?: string
          workout_assignment_id?: string
          workout_revision_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_assignment_id_fkey"
            columns: ["workout_assignment_id"]
            isOneToOne: false
            referencedRelation: "workout_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_revision_day_id_fkey"
            columns: ["workout_revision_day_id"]
            isOneToOne: false
            referencedRelation: "workout_revision_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_latest_diet_plan: {
        Args: {
          p_client_id: string
          p_end_date?: string
          p_plan_id: string
          p_start_date?: string
        }
        Returns: {
          assigned_at: string
          client_id: string
          coach_id: string
          created_at: string
          diet_plan_id: string
          diet_plan_revision_id: string
          end_date: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "diet_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_latest_workout_plan: {
        Args: {
          p_client_id: string
          p_end_date?: string
          p_plan_id: string
          p_start_date?: string
        }
        Returns: {
          assigned_at: string
          client_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          workout_plan_id: string
          workout_plan_revision_id: string
        }
        SetofOptions: {
          from: "*"
          to: "workout_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      client_can_read_diet_revision: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      client_can_read_workout_revision: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      client_has_active_diet_access: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      client_has_active_workout_access: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      coach_can_view_client_history: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      coach_can_view_meal_log: {
        Args: { p_meal_log_id: string }
        Returns: boolean
      }
      coach_can_view_workout_session: {
        Args: { p_session_id: string }
        Returns: boolean
      }
      coach_owns_client: { Args: { p_client_id: string }; Returns: boolean }
      coach_owns_diet_revision: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      coach_owns_workout_revision: {
        Args: { p_revision_id: string }
        Returns: boolean
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      diet_meal_plan_id: { Args: { p_meal_id: string }; Returns: string }
      diet_revision_food_item_revision_id: {
        Args: { p_item_id: string }
        Returns: string
      }
      diet_revision_meal_revision_id: {
        Args: { p_meal_id: string }
        Returns: string
      }
      is_client: { Args: never; Returns: boolean }
      is_coach: { Args: never; Returns: boolean }
      is_my_active_coach: { Args: { p_coach_id: string }; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      owns_diet_plan: { Args: { p_plan_id: string }; Returns: boolean }
      owns_meal_log: { Args: { p_meal_log_id: string }; Returns: boolean }
      owns_workout_plan: { Args: { p_plan_id: string }; Returns: boolean }
      owns_workout_session: { Args: { p_session_id: string }; Returns: boolean }
      publish_diet_plan: {
        Args: { p_plan_id: string }
        Returns: {
          carbs_target: number | null
          daily_calories: number | null
          description: string
          diet_plan_id: string
          fat_target: number | null
          goal: string
          id: string
          name: string
          protein_target: number | null
          published_at: string
          published_by: string
          revision: number
        }
        SetofOptions: {
          from: "*"
          to: "diet_plan_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      publish_workout_plan: {
        Args: { p_plan_id: string }
        Returns: {
          description: string
          goal: string
          id: string
          name: string
          published_at: string
          published_by: string
          revision: number
          workout_plan_id: string
        }
        SetofOptions: {
          from: "*"
          to: "workout_plan_revisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      workout_day_plan_id: { Args: { p_day_id: string }; Returns: string }
      workout_revision_day_revision_id: {
        Args: { p_day_id: string }
        Returns: string
      }
      workout_revision_exercise_revision_id: {
        Args: { p_exercise_id: string }
        Returns: string
      }
    }
    Enums: {
      assignment_status: "active" | "completed" | "cancelled"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      meal_log_status: "pending" | "completed" | "skipped"
      plan_status: "draft" | "active"
      relationship_status: "active" | "inactive"
      user_role: "coach" | "client"
      workout_session_status: "in_progress" | "completed" | "abandoned"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      assignment_status: ["active", "completed", "cancelled"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      meal_log_status: ["pending", "completed", "skipped"],
      plan_status: ["draft", "active"],
      relationship_status: ["active", "inactive"],
      user_role: ["coach", "client"],
      workout_session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
