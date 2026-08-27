import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Produto } from "@/lib/produtos.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Gestão do cardápio — simbi" },
      { name: "description", content: "Cadastre produtos e escolha o que aparece no catálogo público da simbi." },
      { property: "og:title", content: "Gestão do cardápio — simbi" },
      { property: "og:description", content: "Cadastre produtos e escolha o que aparece no catálogo público." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

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

function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<Rascunho | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { data: produtos = [], isLoading, refetch } = useQuery({
    queryKey: ["produtos-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
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

  async function alternarVisibilidade(p: Produto) {
    const { error } = await supabase.from("produtos").update({ visivel: !p.visivel }).eq("id", p.id);
    if (error) setErro(error.message);
    await atualizarLista();
  }

  async function remover(p: Produto) {
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
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

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErro(null);

    const payload = {
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
        ? await supabase.from("produtos").insert(payload)
        : await supabase.from("produtos").update(payload).eq("id", editando!);

    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(null);
    setForm(null);
    await atualizarLista();
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const visiveis = produtos.filter((p) => p.visivel).length;

  return (
    <div className="min-h-screen bg-paper text-ink font-body">
      <header className="border-b border-ink/10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-2xl font-semibold tracking-tight">simbi</span>
            <span className="hidden sm:inline eyebrow text-ink/45">área do produtor</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-ink/50 hover:text-ink transition-colors">
              Ver catálogo
            </Link>
            <button onClick={sair} className="font-medium bg-ink text-cream px-3.5 py-2 rounded-full text-sm">
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-4">
            <p className="eyebrow text-clay mb-3">Gestão</p>
            <h1 className="font-display text-3xl font-medium leading-tight text-balance max-w-[20ch]">
              O que aparece no catálogo, você decide
            </h1>
            <p className="mt-3 text-sm text-ink/60 text-pretty">
              {produtos.length} itens cadastrados · {visiveis} no catálogo público. O que fica guardado não aparece para
              os clientes.
            </p>
            <button
              onClick={abrirNovo}
              className="mt-5 inline-flex items-center gap-2 bg-clay text-cream text-sm font-medium px-4 py-2.5 rounded-full hover:bg-clay/90 transition-colors"
            >
              <span className="text-base leading-none">＋</span> Novo produto
            </button>
            {erro ? <p className="mt-4 text-sm text-destructive">{erro}</p> : null}
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
                        className={`w-11 h-6 rounded-full relative transition-colors ${p.visivel ? "bg-sage" : "bg-ink/20"}`}
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
                    className="mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block col-span-2">
                  <span className="eyebrow text-ink/45">Descrição</span>
                  <textarea
                    rows={3}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className="mt-2 w-full bg-cream rounded-xl px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Categoria</span>
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Farinhas, Peixes…"
                    className="mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Medida</span>
                  <input
                    value={form.medida}
                    onChange={(e) => setForm({ ...form, medida: e.target.value })}
                    placeholder="1,2 kg"
                    className="mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Preço (R$)</span>
                  <input
                    inputMode="decimal"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    className="mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>

                <label className="block">
                  <span className="eyebrow text-ink/45">Link da imagem</span>
                  <input
                    value={form.imagem_url}
                    onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                    placeholder="https://…"
                    className="mt-2 w-full bg-cream rounded-full px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-5 pt-2">
                {[
                  { chave: "visivel" as const, rotulo: "No catálogo" },
                  { chave: "disponivel" as const, rotulo: "Disponível" },
                  { chave: "destaque" as const, rotulo: "Destaque" },
                ].map(({ chave, rotulo }) => (
                  <label key={chave} className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [chave]: !form[chave] })}
                      className={`w-11 h-6 rounded-full relative transition-colors ${form[chave] ? "bg-sage" : "bg-ink/20"}`}
                    >
                      <span
                        className={`absolute top-0.5 size-5 rounded-full bg-cream shadow-sm transition-all ${
                          form[chave] ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                    {rotulo}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                {editando !== "novo" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const alvo = produtos.find((p) => p.id === editando);
                      if (!alvo) return;
                      await remover(alvo);
                      setForm(null);
                      setEditando(null);
                    }}
                    className="text-sm text-destructive underline underline-offset-4"
                  >
                    Remover produto
                  </button>
                ) : (
                  <span />
                )}
                <button type="submit" className="bg-ink text-cream rounded-full px-6 py-2.5 text-sm font-medium">
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
