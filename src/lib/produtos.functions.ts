import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

export type Produto = Database["public"]["Tables"]["produtos"]["Row"];
export type Catalogo = Database["public"]["Tables"]["catalogos"]["Row"];

export type ProdutoPublico = Pick<
  Produto,
  "id" | "nome" | "descricao" | "categoria" | "preco" | "medida" | "imagem_url" | "disponivel" | "modo_preparo" | "galeria" | "tipo_venda" | "destaque" | "ordem"
>;

export type CatalogoPublico = {
  catalogo: Pick<
    Catalogo,
    "id" | "slug" | "nome" | "descricao" | "logo_url" | "capa_url" | "horario" | "contato" | "endereco"
  > | null;
  produtos: ProdutoPublico[];
};

export const listarCatalogoPorSlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }): Promise<CatalogoPublico> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("Configuração pública do banco indisponível");
    const supabasePublic = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: catalogo, error: erroCatalogo } = await supabasePublic
      .from("catalogos")
      .select("id, slug, nome, descricao, logo_url, capa_url, horario, contato, endereco")
      .eq("slug", data.slug)
      .maybeSingle();

    if (erroCatalogo || !catalogo) {
      return { catalogo: null, produtos: [] };
    }

    const { data: produtos, error } = await supabasePublic
      .from("produtos")
      .select("id, nome, descricao, categoria, preco, medida, imagem_url, disponivel, destaque, ordem, galeria, modo_preparo, tipo_venda")
      .eq("catalogo_id", catalogo.id)
      .eq("visivel", true)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Falha ao carregar catálogo", error.message);
      return { catalogo, produtos: [] };
    }

    return { catalogo, produtos: produtos ?? [] };
  });

export const listarCatalogosPublicos = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) throw new Error("Configuração pública do banco indisponível");
  const supabasePublic = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabasePublic
    .from("catalogos")
    .select("slug, nome, descricao, logo_url")
    .order("created_at", { ascending: true })
    .limit(12);

  if (error) {
    console.error("Falha ao carregar catálogos", error.message);
    return [];
  }
  return data ?? [];
});
