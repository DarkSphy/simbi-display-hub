import { supabase } from "@/integrations/supabase/client";

export type LojaConfig = {
  id: string;
  nome_loja: string;
  whatsapp: string;
  logo_url: string;
  cor_principal: string;
  mensagem_rodape: string;
};

export async function obterLojaConfig(): Promise<LojaConfig> {
  const { data, error } = await supabase.from("loja_config").select("*").limit(1).maybeSingle();
  if (error) {
    console.error("Erro ao buscar configurações da loja:", error);
    throw error;
  }
  if (!data) {
    return {
      id: "default",
      nome_loja: "simbi",
      whatsapp: "5511999999999",
      logo_url: "",
      cor_principal: "#3A5A40",
      mensagem_rodape: "Agradecemos a preferência!",
    };
  }
  return data as LojaConfig;
}
