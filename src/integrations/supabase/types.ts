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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      catalogos: {
        Row: {
          capa_url: string | null
          categorias_padrao: Json | null
          contato: string
          created_at: string
          descricao: string
          endereco: string
          horario: string
          horarios_funcionamento: Json | null
          id: string
          logo_url: string | null
          nome: string
          permitir_agendamento: boolean | null
          publicado: boolean
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capa_url?: string | null
          categorias_padrao?: Json | null
          contato?: string
          created_at?: string
          descricao?: string
          endereco?: string
          horario?: string
          horarios_funcionamento?: Json | null
          id?: string
          logo_url?: string | null
          nome?: string
          permitir_agendamento?: boolean | null
          publicado?: boolean
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capa_url?: string | null
          categorias_padrao?: Json | null
          contato?: string
          created_at?: string
          descricao?: string
          endereco?: string
          horario?: string
          horarios_funcionamento?: Json | null
          id?: string
          logo_url?: string | null
          nome?: string
          permitir_agendamento?: boolean | null
          publicado?: boolean
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loja_config: {
        Row: {
          cor_principal: string | null
          id: string
          logo_url: string | null
          mensagem_rodape: string | null
          nome_loja: string
          whatsapp: string
        }
        Insert: {
          cor_principal?: string | null
          id?: string
          logo_url?: string | null
          mensagem_rodape?: string | null
          nome_loja?: string
          whatsapp?: string
        }
        Update: {
          cor_principal?: string | null
          id?: string
          logo_url?: string | null
          mensagem_rodape?: string | null
          nome_loja?: string
          whatsapp?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          agendado: boolean | null
          catalogo_id: string | null
          cliente_endereco: string
          cliente_nome: string
          cliente_whatsapp: string
          created_at: string
          id: string
          itens: Json
          status: string
          total: number
        }
        Insert: {
          agendado?: boolean | null
          catalogo_id?: string | null
          cliente_endereco: string
          cliente_nome: string
          cliente_whatsapp: string
          created_at?: string
          id?: string
          itens: Json
          status?: string
          total: number
        }
        Update: {
          agendado?: boolean | null
          catalogo_id?: string | null
          cliente_endereco?: string
          cliente_nome?: string
          cliente_whatsapp?: string
          created_at?: string
          id?: string
          itens?: Json
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          catalogo_id: string
          categoria: string
          created_at: string
          descricao: string
          destaque: boolean
          disponivel: boolean
          galeria: Json | null
          id: string
          imagem_url: string | null
          medida: string
          modo_preparo: Json | null
          nome: string
          ordem: number
          preco: number
          tipo_venda: string | null
          updated_at: string
          visivel: boolean
        }
        Insert: {
          catalogo_id: string
          categoria?: string
          created_at?: string
          descricao?: string
          destaque?: boolean
          disponivel?: boolean
          galeria?: Json | null
          id?: string
          imagem_url?: string | null
          medida?: string
          modo_preparo?: Json | null
          nome: string
          ordem?: number
          preco?: number
          tipo_venda?: string | null
          updated_at?: string
          visivel?: boolean
        }
        Update: {
          catalogo_id?: string
          categoria?: string
          created_at?: string
          descricao?: string
          destaque?: boolean
          disponivel?: boolean
          galeria?: Json | null
          id?: string
          imagem_url?: string | null
          medida?: string
          modo_preparo?: Json | null
          nome?: string
          ordem?: number
          preco?: number
          tipo_venda?: string | null
          updated_at?: string
          visivel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "produtos_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "catalogos"
            referencedColumns: ["id"]
          },
        ]
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
