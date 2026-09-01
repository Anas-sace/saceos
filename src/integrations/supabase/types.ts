export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          value: Json;
        };
        Insert: {
          key: string;
          value: Json;
        };
        Update: {
          key?: string;
          value?: Json;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          created_at: string;
          date: string;
          hours: number;
          id: string;
          punch_in: string | null;
          punch_out: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          hours?: number;
          id?: string;
          punch_in?: string | null;
          punch_out?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          hours?: number;
          id?: string;
          punch_in?: string | null;
          punch_out?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          detail: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          detail?: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          detail?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      awards: {
        Row: {
          created_at: string;
          featured: boolean;
          id: string;
          nominated_by_id: string;
          period: string;
          quote: string | null;
          reason: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          featured?: boolean;
          id?: string;
          nominated_by_id: string;
          period: string;
          quote?: string | null;
          reason?: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          featured?: boolean;
          id?: string;
          nominated_by_id?: string;
          period?: string;
          quote?: string | null;
          reason?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "awards_nominated_by_id_fkey";
            columns: ["nominated_by_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "awards_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          name?: string;
        };
        Relationships: [];
      };
      lead_datasets: {
        Row: {
          description: string;
          id: string;
          locked: boolean;
          name: string;
          records: number;
          source: string;
          tags: string[];
          uploaded_at: string;
          uploaded_by_id: string;
          visibility: string;
        };
        Insert: {
          description?: string;
          id?: string;
          locked?: boolean;
          name: string;
          records?: number;
          source?: string;
          tags?: string[];
          uploaded_at?: string;
          uploaded_by_id: string;
          visibility?: string;
        };
        Update: {
          description?: string;
          id?: string;
          locked?: boolean;
          name?: string;
          records?: number;
          source?: string;
          tags?: string[];
          uploaded_at?: string;
          uploaded_by_id?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_datasets_uploaded_by_id_fkey";
            columns: ["uploaded_by_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          admin_comment: string;
          created_at: string;
          emergency_contact: string | null;
          end_date: string;
          half_day: boolean;
          id: string;
          reason: string;
          start_date: string;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_comment?: string;
          created_at?: string;
          emergency_contact?: string | null;
          end_date: string;
          half_day?: boolean;
          id?: string;
          reason?: string;
          start_date: string;
          status?: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_comment?: string;
          created_at?: string;
          emergency_contact?: string | null;
          end_date?: string;
          half_day?: boolean;
          id?: string;
          reason?: string;
          start_date?: string;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          read_by: string[];
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          read_by?: string[];
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          read_by?: string[];
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          href: string | null;
          id: string;
          read: boolean;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          href?: string | null;
          id?: string;
          read?: boolean;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          href?: string | null;
          id?: string;
          read?: boolean;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          active: boolean;
          avatar_color: string;
          avatar_url: string | null;
          casual_balance: number;
          created_at: string;
          daily_vision: string | null;
          department: string;
          designation: string;
          email: string;
          full_name: string;
          id: string;
          reporting_admin_id: string | null;
          sick_balance: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          active?: boolean;
          avatar_color?: string;
          avatar_url?: string | null;
          casual_balance?: number;
          created_at?: string;
          daily_vision?: string | null;
          department?: string;
          designation?: string;
          email: string;
          full_name: string;
          id: string;
          reporting_admin_id?: string | null;
          sick_balance?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          active?: boolean;
          avatar_color?: string;
          avatar_url?: string | null;
          casual_balance?: number;
          created_at?: string;
          daily_vision?: string | null;
          department?: string;
          designation?: string;
          email?: string;
          full_name?: string;
          id?: string;
          reporting_admin_id?: string | null;
          sick_balance?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_reporting_admin_id_fkey";
            columns: ["reporting_admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          task_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          task_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_comments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_proofs: {
        Row: {
          id: string;
          note: string;
          submitted_at: string;
          task_id: string;
          type: string;
          value: string;
        };
        Insert: {
          id?: string;
          note?: string;
          submitted_at?: string;
          task_id: string;
          type?: string;
          value: string;
        };
        Update: {
          id?: string;
          note?: string;
          submitted_at?: string;
          task_id?: string;
          type?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_proofs_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assigned_by_id: string;
          assignee_id: string;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          priority: string;
          required_proof: string;
          start_date: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assigned_by_id: string;
          assignee_id: string;
          created_at?: string;
          description?: string;
          due_date: string;
          id?: string;
          priority?: string;
          required_proof?: string;
          start_date?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assigned_by_id?: string;
          assignee_id?: string;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          priority?: string;
          required_proof?: string;
          start_date?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_id_fkey";
            columns: ["assigned_by_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey";
            columns: ["assignee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          internal: boolean;
          ticket_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          internal?: boolean;
          ticket_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          internal?: boolean;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      tickets: {
        Row: {
          category: string;
          code: string | null;
          created_at: string;
          created_by_id: string;
          description: string;
          id: string;
          owner_id: string | null;
          priority: string;
          status: string;
          subject: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          code?: string | null;
          created_at?: string;
          created_by_id: string;
          description?: string;
          id?: string;
          owner_id?: string | null;
          priority?: string;
          status?: string;
          subject: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          code?: string | null;
          created_at?: string;
          created_by_id?: string;
          description?: string;
          id?: string;
          owner_id?: string | null;
          priority?: string;
          status?: string;
          subject?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_created_by_id_fkey";
            columns: ["created_by_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_email_for_username: { Args: { _identifier: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "super_admin" | "admin" | "member";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "member"],
    },
  },
} as const;
