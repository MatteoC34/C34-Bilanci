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
      advisor_notes: {
        Row: {
          ai_generated: boolean
          autore: string
          client_id: string
          created_at: string
          id: string
          testo: string
        }
        Insert: {
          ai_generated?: boolean
          autore?: string
          client_id: string
          created_at?: string
          id?: string
          testo: string
        }
        Update: {
          ai_generated?: boolean
          autore?: string
          client_id?: string
          created_at?: string
          id?: string
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_kpi_config: {
        Row: {
          client_id: string
          id: string
          kpi_key: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          client_id: string
          id?: string
          kpi_key: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          client_id?: string
          id?: string
          kpi_key?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_kpi_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ateco: string | null
          created_at: string
          email: string | null
          id: string
          invited_at: string | null
          name: string
          piva: string | null
          tipo: Database["public"]["Enums"]["client_tipo"]
        }
        Insert: {
          ateco?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          name: string
          piva?: string | null
          tipo?: Database["public"]["Enums"]["client_tipo"]
        }
        Update: {
          ateco?: string | null
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          name?: string
          piva?: string | null
          tipo?: Database["public"]["Enums"]["client_tipo"]
        }
        Relationships: []
      }
      drive_connections: {
        Row: {
          client_id: string
          file_type: string | null
          folder_name: string | null
          folder_path: string | null
          id: string
          last_checked: string | null
        }
        Insert: {
          client_id: string
          file_type?: string | null
          folder_name?: string | null
          folder_path?: string | null
          id?: string
          last_checked?: string | null
        }
        Update: {
          client_id?: string
          file_type?: string | null
          folder_name?: string | null
          folder_path?: string | null
          id?: string
          last_checked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drive_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          calcolato_at: string
          client_id: string
          delta_pct: number | null
          id: string
          kpi_key: string
          periodo: string
          valore: number | null
        }
        Insert: {
          calcolato_at?: string
          client_id: string
          delta_pct?: number | null
          id?: string
          kpi_key: string
          periodo: string
          valore?: number | null
        }
        Update: {
          calcolato_at?: string
          client_id?: string
          delta_pct?: number | null
          id?: string
          kpi_key?: string
          periodo?: string
          valore?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          avere: number
          client_id: string
          codice_conto: string | null
          dare: number
          data_registrazione: string | null
          descrizione: string | null
          descrizione_conto: string | null
          file_id: string | null
          id: string
          n_documento: string | null
          n_registrazione: string | null
          saldo_progressivo: number
          sottoconto_desc: string | null
          sottoconto_id: string | null
        }
        Insert: {
          avere?: number
          client_id: string
          codice_conto?: string | null
          dare?: number
          data_registrazione?: string | null
          descrizione?: string | null
          descrizione_conto?: string | null
          file_id?: string | null
          id?: string
          n_documento?: string | null
          n_registrazione?: string | null
          saldo_progressivo?: number
          sottoconto_desc?: string | null
          sottoconto_id?: string | null
        }
        Update: {
          avere?: number
          client_id?: string
          codice_conto?: string | null
          dare?: number
          data_registrazione?: string | null
          descrizione?: string | null
          descrizione_conto?: string | null
          file_id?: string | null
          id?: string
          n_documento?: string | null
          n_registrazione?: string | null
          saldo_progressivo?: number
          sottoconto_desc?: string | null
          sottoconto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_balance: {
        Row: {
          avere: number
          client_id: string
          codice_conto: string | null
          created_at: string
          dare: number
          descrizione: string | null
          file_id: string | null
          id: string
          periodo: string
          saldo: number
          sezione: string | null
        }
        Insert: {
          avere?: number
          client_id: string
          codice_conto?: string | null
          created_at?: string
          dare?: number
          descrizione?: string | null
          file_id?: string | null
          id?: string
          periodo: string
          saldo?: number
          sezione?: string | null
        }
        Update: {
          avere?: number
          client_id?: string
          codice_conto?: string | null
          created_at?: string
          dare?: number
          descrizione?: string | null
          file_id?: string | null
          id?: string
          periodo?: string
          saldo?: number
          sezione?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_balance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_balance_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_files: {
        Row: {
          client_id: string
          file_name: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          periodo: string | null
          size_bytes: number | null
          source: string
          status: Database["public"]["Enums"]["file_status"]
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          client_id: string
          file_name: string
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          periodo?: string | null
          size_bytes?: number | null
          source?: string
          status?: Database["public"]["Enums"]["file_status"]
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          client_id?: string
          file_name?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          periodo?: string | null
          size_bytes?: number | null
          source?: string
          status?: Database["public"]["Enums"]["file_status"]
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
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
      user_owns_client: { Args: { _client_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client"
      client_tipo:
        | "pmi"
        | "startup_pre"
        | "startup_scale"
        | "holding"
        | "immobiliare"
      file_status: "pending" | "processing" | "done" | "error"
      file_type: "bilancio_verifica" | "mastrini" | "nota_integrativa"
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
      app_role: ["admin", "client"],
      client_tipo: [
        "pmi",
        "startup_pre",
        "startup_scale",
        "holding",
        "immobiliare",
      ],
      file_status: ["pending", "processing", "done", "error"],
      file_type: ["bilancio_verifica", "mastrini", "nota_integrativa"],
    },
  },
} as const
