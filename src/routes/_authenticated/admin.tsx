import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Catalogo, Produto } from "@/lib/produtos.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gestão do meu catálogo — simbi" },
      { name: "description", content: "Personalize sua página e escolha o que aparece no seu link público." },
      { property: "og:title", content: "Gestão do meu catálogo — simbi" },
      { property: "og:description", content: "Personalize sua página e escolha o que aparece no seu link público." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const gerarSlug = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

type Rascunho = {
  nome: string;
  descricao: string;
  categoria: string;
  preco: string;
  medida: string;
  imagem_url: string;
  disponivel: boolean;
  destaque: boolean;
  visivel: boolean;
};

const rascunhoVazio: Rascunho = {
  nome: "",
  descricao: "",
  categoria: "",
  preco: "",
  medida: "",
  imagem_url: "",
  disponivel: true,
  destaque: false,
  visivel: true,
};

type FormLoja = {
  nome: string;
  slug: string;
  descricao: string;
  logo_url: string;
  capa_url: string;
  horario: string;
  contato: string;
  endereco: string;
  publicado: boolean;
};

const campoClasse =
  "mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none";

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<Rascunho | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loja, setLoja] = useState<FormLoja | null>(null);
  const [salvandoLoja, setSalvandoLoja] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const catalogoQ = useQuery({
    queryKey: ["meu-catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogos").select("*").maybeSingle();
      if (error) throw error;
      return (data as Catalogo | null) ?? null;
    },
  });
  const catalogo = catalogoQ.data ?? null;

  useEffect(() => {
    if (catalogo && !loja) {
      setLoja({
        nome: catalogo.nome,
        slug: catalogo.slug,
        descricao: catalogo.descricao,
        logo_url: catalogo.logo_url ?? "",
        capa_url: catalogo.capa_url ?? "",
        horario: catalogo.horario,
        contato: catalogo.contato,
        endereco: catalogo.endereco,
        publicado: catalogo.publicado,
      });
    }
  }, [catalogo, loja]);

  const { data: produtos = [], isLoading, refetch } = useQuery({
    queryKey: ["produtos-admin", catalogo?.id],
    enabled: Boolean(catalogo?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("catalogo_id", catalogo!.id)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Produto[];
    },
  });

  async function atualizarLista() {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ["catalogo"] });
  }

  async function criarCatalogo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const formEl = e.target as HTMLFormElement;
    const nome = (new FormData(formEl).get("nome") as string).trim();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) return;
    const { error } = await supabase.from("catalogos").insert({
      user_id: sessao.user.id,
      nome,
      slug: gerarSlug(nome) || `catalogo-${Date.now()}`,
    });
    if (error) {
      setErro(error.message.includes("duplicate") ? "Esse nome já está em uso. Tente outro." : error.message);
      return;
    }
    await catalogoQ.refetch();
  }

  async function salvarLoja(e: React.FormEvent) {
    e.preventDefault();
    if (!loja || !catalogo) return;
    setErro(null);
    setSalvandoLoja(true);
    const { error } = await supabase
      .from("catalogos")
      .update({
        nome: loja.nome.trim(),
        slug: gerarSlug(loja.slug || loja.nome),
        descricao: loja.descricao.trim(),
        logo_url: loja.logo_url.trim() || null,
        capa_url: loja.capa_url.trim() || null,
        horario: loja.horario.trim(),
        contato: loja.contato.trim(),
        endereco: loja.endereco.trim(),
        publicado: loja.publicado,
      })
      .eq("id", catalogo.id);
    setSalvandoLoja(false);
    if (error) {
      setErro(error.message.includes("duplicate") ? "Esse endereço de link já está em uso." : error.message);
      return;
    }
    await catalogoQ.refetch();
    await queryClient.invalidateQueries({ queryKey: ["catalogos-publicos"] });
  }

  async function alternarVisibilidade(p: Produto) {
    const { error } = await supabase.from("produtos").update({ visivel: !p.visivel }).eq("id", p.id);
    if (error) setErro(error.message);
    await atualizarLista();
  }

  function abrirNovo() {
    setEditando("novo");
    setForm({ ...rascunhoVazio });
    setErro(null);
  }

  function abrirEdicao(p: Produto) {
    setEditando(p.id);
    setErro(null);
    setForm({
      nome: p.nome,
      descricao: p.descricao,
      categoria: p.categoria,
      preco: String(p.preco),
      medida: p.medida,
      imagem_url: p.imagem_url ?? "",
      disponivel: p.disponivel,
      destaque: p.destaque,
      visivel: p.visivel,
    });
  }

  async function remover(p: Produto) {
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) setErro(error.message);
    setForm(null);
    setEditando(null);
    await atualizarLista();
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !catalogo) return;
    setErro(null);

    const base = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria.trim() || "Outros",
      preco: Number(form.preco.replace(",", ".")) || 0,
      medida: form.medida.trim(),
      imagem_url: form.imagem_url.trim() || null,
      disponivel: form.disponivel,
      destaque: form.destaque,
      visivel: form.visivel,
    };

    const { error } =
      editando === "novo"
        ? await supabase.from("produtos").insert({ ...base, catalogo_id: catalogo.id })
        : await supabase.from("produtos").update(base).eq("id", editando!);

    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(null);
    setForm(null);
    await atualizarLista();
  }

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const visiveis = produtos.filter((p) => p.visivel).length;
  const linkPublico =
    catalogo && typeof window !== "undefined" ? `${window.location.origin}/c/${catalogo.slug}` : "";

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <header className="border-b border-ink/10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-2xl font-semibold tracking-tight">simbi</span>
            <span className="hidden sm:inline eyebrow text-ink/45">área do produtor</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {catalogo ? (
              <Link
                to="/c/$slug"
                params={{ slug: catalogo.slug }}
                className="text-ink/50 hover:text-ink transition-colors"
              >
                Ver meu catálogo
              </Link>
            ) : null}
            <button onClick={sair} className="font-medium bg-ink text-cream px-3.5 py-2 rounded-full text-sm">
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {erro ? <p className="mb-6 text-sm text-destructive">{erro}</p> : null}

        {catalogoQ.isLoading ? (
          <p className="text-sm text-ink/50">Carregando…</p>
        ) : !catalogo ? (
          <form onSubmit={criarCatalogo} className="max-w-md">
            <p className="eyebrow text-clay mb-3">Primeiro passo</p>
            <h1 className="font-display text-3xl font-medium leading-tight text-balance">
              Como o seu catálogo vai se chamar?
            </h1>
            <p className="mt-3 text-sm text-ink/60">
              Esse nome também vira o seu link público. Você pode ajustar tudo depois.
            </p>
            <input name="nome" required placeholder="Ex.: Sítio das Ervas" className={campoClasse} />
            <button type="submit" className="mt-4 bg-ink text-cream rounded-full px-5 py-3 text-sm font-medium">
              Criar meu catálogo
            </button>
          </form>
        ) : (
          <>
            <section className="rounded-2xl bg-cream ring-1 ring-black/5 p-6 mb-10">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="eyebrow text-clay mb-2">Meu link exclusivo</p>
                  <p className="font-display text-2xl">{linkPublico || `/c/${catalogo.slug}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(linkPublico);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="bg-clay text-cream rounded-full px-4 py-2.5 text-sm font-medium"
                  >
                    {copiado ? "Copiado!" : "Copiar link"}
                  </button>
                  <Link
                    to="/c/$slug"
                    params={{ slug: catalogo.slug }}
                    className="text-sm underline underline-offset-4 decoration-ink/30 hover:decoration-clay"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            </section>

            {loja ? (
              <form onSubmit={salvarLoja} className="rounded-2xl bg-cream ring-1 ring-black/5 p-6 mb-12">
                <h2 className="font-display text-2xl font-medium">Identidade do catálogo</h2>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="eyebrow text-ink/45">Nome</span>
                    <input
                      required
                      value={loja.nome}
                      onChange={(e) => setLoja({ ...loja, nome: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-ink/45">Endereço do link (/c/…)</span>
                    <input
                      value={loja.slug}
                      onChange={(e) => setLoja({ ...loja, slug: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="eyebrow text-ink/45">Descrição</span>
                    <textarea
                      rows={3}
                      value={loja.descricao}
                      onChange={(e) => setLoja({ ...loja, descricao: e.target.value })}
                      className="mt-2 w-full bg-cream rounded-2xl px-4 py-3 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-ink/45">Link do logo</span>
                    <input
                      value={loja.logo_url}
                      onChange={(e) => setLoja({ ...loja, logo_url: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-ink/45">Link da imagem de capa</span>
                    <input
                      value={loja.capa_url}
                      onChange={(e) => setLoja({ ...loja, capa_url: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-ink/45">Horário de funcionamento</span>
                    <input
                      value={loja.horario}
                      onChange={(e) => setLoja({ ...loja, horario: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow text-ink/45">Contato (WhatsApp, e-mail…)</span>
                    <input
                      value={loja.contato}
                      onChange={(e) => setLoja({ ...loja, contato: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="eyebrow text-ink/45">Onde encontrar</span>
                    <input
                      value={loja.endereco}
                      onChange={(e) => setLoja({ ...loja, endereco: e.target.value })}
                      className={campoClasse}
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={loja.publicado}
                      onChange={(e) => setLoja({ ...loja, publicado: e.target.checked })}
                      className="size-4 accent-sage"
                    />
                    Catálogo publicado (visível para quem abrir o link)
                  </label>
                  <button
                    type="submit"
                    disabled={salvandoLoja}
                    className="bg-ink text-cream rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {salvandoLoja ? "Salvando…" : "Salvar identidade"}
                  </button>
                </div>
              </form>
            ) : null}

            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 md:col-span-4">
                <p className="eyebrow text-clay mb-3">Produtos</p>
                <h2 className="font-display text-3xl font-medium leading-tight text-balance max-w-[20ch]">
                  O que aparece no catálogo, você decide
                </h2>
                <p className="mt-3 text-sm text-ink/60 text-pretty">
                  {produtos.length} itens cadastrados · {visiveis} no seu link público.
                </p>
                <button
                  onClick={abrirNovo}
                  className="mt-5 inline-flex items-center gap-2 bg-clay text-cream text-sm font-medium px-4 py-2.5 rounded-full hover:bg-clay/90 transition-colors"
                >
                  <span className="text-base leading-none">＋</span> Novo produto
                </button>
              </div>

              <div className="col-span-12 md:col-span-8">
                <div className="rounded-2xl bg-cream ring-1 ring-black/5 overflow-hidden">
                  <div className="grid grid-cols-12 items-center gap-3 px-5 py-3 border-b border-ink/10 eyebrow text-ink/45">
                    <span className="col-span-4">Produto</span>
                    <span className="col-span-3">Categoria</span>
                    <span className="col-span-2">Preço</span>
                    <span className="col-span-3 text-right">Visível</span>
                  </div>

                  {isLoading ? (
                    <p className="px-5 py-8 text-sm text-ink/50">Carregando…</p>
                  ) : produtos.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-ink/50">Nenhum produto cadastrado ainda.</p>
                  ) : (
                    produtos.map((p) => (
                      <div
                        key={p.id}
                        className={`grid grid-cols-12 items-center gap-3 px-5 py-4 border-b border-ink/5 last:border-b-0 ${
                          p.visivel ? "" : "opacity-60"
                        }`}
                      >
                        <span className="col-span-4 font-medium">{p.nome}</span>
                        <span className="col-span-3 text-sm text-ink/55">{p.categoria}</span>
                        <span className="col-span-2 text-sm">{moeda(Number(p.preco))}</span>
                        <span className="col-span-3 flex justify-end items-center gap-3">
                          <button
                            onClick={() => abrirEdicao(p)}
                            className="text-sm underline underline-offset-4 decoration-ink/30 hover:decoration-clay"
                          >
                            Editar
                          </button>
                          <button
                            aria-label={p.visivel ? "Ocultar do catálogo" : "Publicar no catálogo"}
                            onClick={() => alternarVisibilidade(p)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${
                              p.visivel ? "bg-sage" : "bg-ink/20"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 size-5 rounded-full bg-cream shadow-sm transition-all ${
                                p.visivel ? "right-0.5" : "left-0.5"
                              }`}
                            />
                          </button>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {form ? (
          <div className="fixed inset-0 z-50 bg-ink/40 grid place-items-center px-6 py-10 overflow-y-auto">
            <form
              onSubmit={salvar}
              className="w-full max-w-xl bg-paper rounded-2xl ring-1 ring-black/5 p-6 space-y-4 my-auto"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-medium">
                  {editando === "novo" ? "Novo produto" : "Editar produto"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setForm(null);
                    setEditando(null);
                  }}
                  className="text-sm text-ink/50 hover:text-ink"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block col-span-2">
                  <span className="eyebrow text-ink/45">Nome</span>
                  <input
                    required
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={campoClasse}
                  />
                </label>

                <label className="block col-span-2">
                  <span className="eyebrow text-ink/45">Descrição</span>
                  <textarea
                    rows={3}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="mt-2 w-full bg-cream rounded-2xl px-4 py-3 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Categoria</span>
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className={campoClasse}
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Medida</span>
                  <input
                    value={form.medida}
                    onChange={(e) => setForm({ ...form, medida: e.target.value })}
                    placeholder="1 kg, unidade…"
                    className={campoClasse}
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Preço (R$)</span>
                  <input
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    inputMode="decimal"
                    className={campoClasse}
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Link da foto</span>
                  <input
                    value={form.imagem_url}
                    onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                    className={campoClasse}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.visivel}
                    onChange={(e) => setForm({ ...form, visivel: e.target.checked })}
                    className="size-4 accent-sage"
                  />
                  No catálogo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.disponivel}
                    onChange={(e) => setForm({ ...form, disponivel: e.target.checked })}
                    className="size-4 accent-sage"
                  />
                  Disponível
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.destaque}
                    onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
                    className="size-4 accent-clay"
                  />
                  Destaque
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                {editando !== "novo" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const alvo = produtos.find((p) => p.id === editando);
                      if (alvo) void remover(alvo);
                    }}
                    className="text-sm text-destructive underline underline-offset-4"
                  >
                    Remover produto
                  </button>
                ) : (
                  <span />
                )}
                <button type="submit" className="bg-ink text-cream rounded-full px-5 py-2.5 text-sm font-medium">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  );
}
