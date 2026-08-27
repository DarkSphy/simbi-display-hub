import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Produto = Database["public"]["Tables"]["produtos"]["Row"];

export const listarCatalogo = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;

  const supabasePublic = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabasePublic
    .from("produtos")
    .select("id, nome, descricao, categoria, preco, medida, imagem_url, disponivel, destaque, ordem")
    .eq("visivel", true)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Falha ao carregar catálogo", error.message);
    return [] as Array<Pick<Produto, "id" | "nome" | "descricao" | "categoria" | "preco" | "medida" | "imagem_url" | "disponivel" | "destaque" | "ordem">>;
  }

  return data ?? [];
});
