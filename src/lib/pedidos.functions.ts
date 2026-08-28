import { supabase } from "@/integrations/supabase/client";

export type Pedido = {
  id: string;
  created_at: string;
  cliente_nome: string;
  cliente_whatsapp: string;
  cliente_endereco: string;
  itens: any[];
  total: number;
  status: string;
  agendado: boolean | null;
};

export async function listarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao listar pedidos:", error);
    throw error;
  }
  return data as Pedido[];
}

export async function atualizarStatusPedido(id: string, status: string) {
  const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
  if (error) {
    console.error("Erro ao atualizar status:", error);
    throw error;
  }
}
