import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listarCatalogo } from "@/lib/produtos.functions";

const catalogoQuery = queryOptions({
  queryKey: ["catalogo"],
  queryFn: () => listarCatalogo(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogoQuery),
  head: () => ({
    meta: [
      { title: "simbi — cardápio digital de produtos vivos" },
      {
        name: "description",
        content:
          "Vitrine viva de farinhas, fermentos, peixes e ervas. Produtos frescos direto do produtor — nada congelado, nada de prateleira.",
      },
      { property: "og:title", content: "simbi — cardápio digital de produtos vivos" },
      {
        property: "og:description",
        content: "Farinhas, fermentos, peixes e ervas frescas, direto do produtor.",
      },
    ],
  }),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">Não conseguimos abrir o cardápio agora.</p>
    </div>
  ),
  component: Catalogo,
});

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(valor);

function Catalogo() {
  const { data: produtos } = useSuspenseQuery(catalogoQuery);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("Todos");

  const categorias = useMemo(
    () => ["Todos", ...Array.from(new Set(produtos.map((p) => p.categoria)))],
    [produtos],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const casaCategoria = categoria === "Todos" || p.categoria === categoria;
      const casaBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.descricao.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo);
      return casaCategoria && casaBusca;
    });
  }, [produtos, busca, categoria]);

  return (
    <div className="min-h-screen bg-cream text-ink font-body">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-2xl font-semibold tracking-tight">simbi</span>
            <span className="hidden sm:inline eyebrow text-ink/45">cardápio de produtos vivos</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#catalogo" className="relative">
              Catálogo
              <span className="absolute -bottom-1 left-0 w-full h-px bg-clay" />
            </a>
            <a href="#encontro" className="hidden sm:inline text-ink/50 hover:text-ink transition-colors">
              Ponto de encontro
            </a>
            <Link to="/admin" className="font-medium bg-ink text-cream px-3.5 py-2 rounded-full text-sm">
              Área do produtor
            </Link>
          </nav>
        </div>
      </header>

      <section>
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow text-clay mb-4">Estação 04 — produtos frescos</p>
              <h1 className="font-display font-medium text-[52px] leading-[0.98] tracking-tight text-balance max-w-[16ch]">
                O que a terra <em className="italic font-normal text-clay">apresenta</em> esta semana
              </h1>
              <p className="mt-5 text-pretty text-ink/65 max-w-[46ch]">
                Uma vitrine viva de farinhas, fermentos, peixes e ervas. Nada congelado, nada de prateleira — cada item
                chega direto do produtor para a sua mesa.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <div className="rounded-2xl bg-linen ring-1 ring-black/5 p-2">
                <img
                  src="/images/hero.jpg"
                  alt="Pão de fermentação natural, cavala fresca, ervas e azeite sobre linho"
                  width={1024}
                  height={640}
                  className="w-full aspect-[16/10] object-cover rounded-xl"
                />
              </div>
            </div>
          </div>

          <div
            id="catalogo"
            className="mt-10 flex flex-col md:flex-row md:items-center gap-4 pb-8 border-b border-ink/10 scroll-mt-24"
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 text-sm">⌕</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, ingrediente ou produtor…"
                className="w-full bg-paper rounded-full pl-10 pr-4 py-3 text-sm ring-1 ring-ink/10 focus:ring-2 focus:ring-clay outline-none placeholder:text-ink/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={
                    c === categoria
                      ? "text-sm px-4 py-2 rounded-full bg-ink text-cream font-medium"
                      : "text-sm px-4 py-2 rounded-full ring-1 ring-ink/15 text-ink/70 hover:ring-ink/40 transition-colors"
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto px-6 pb-20">
          {filtrados.length === 0 ? (
            <p className="font-display text-2xl text-ink/50 py-16">Nada por aqui nesta estação.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtrados.map((p) => {
                const escuro = p.destaque;
                return (
                  <article
                    key={p.id}
                    className={
                      escuro
                        ? "bg-ink text-cream rounded-2xl overflow-hidden ring-1 ring-black/5"
                        : "bg-paper rounded-2xl ring-1 ring-black/5 overflow-hidden"
                    }
                  >
                    <div className="p-2">
                      {p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.nome}
                          loading="lazy"
                          width={1024}
                          height={768}
                          className="w-full aspect-[4/3] object-cover rounded-xl"
                        />
                      ) : (
                        <div
                          className={
                            escuro
                              ? "w-full aspect-[4/3] rounded-xl bg-cream/10 grid place-items-center eyebrow text-cream/40"
                              : "w-full aspect-[4/3] rounded-xl bg-linen grid place-items-center eyebrow text-ink/35"
                          }
                        >
                          sem foto
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div
                        className={
                          escuro
                            ? "flex items-center justify-between eyebrow text-cream/50"
                            : "flex items-center justify-between eyebrow text-sage"
                        }
                      >
                        <span>{p.categoria}</span>
                        <span>{p.medida}</span>
                      </div>
                      <h3 className="mt-2 font-display text-2xl font-medium leading-tight">{p.nome}</h3>
                      <p className={escuro ? "mt-1 text-sm text-cream/60 text-pretty" : "mt-1 text-sm text-ink/60 text-pretty"}>
                        {p.descricao}
                      </p>
                      {escuro && p.disponivel ? (
                        <div className="mt-3 flex items-center gap-2 text-xs text-cream/50">
                          <span className="size-1.5 rounded-full bg-clay inline-block" /> Disponível hoje
                        </div>
                      ) : null}
                      {!p.disponivel ? (
                        <div className={escuro ? "mt-3 text-xs text-cream/50" : "mt-3 text-xs text-ink/45"}>
                          Fora de estação
                        </div>
                      ) : null}
                      <div className="mt-4 flex items-end justify-between">
                        <span className="font-display text-xl font-medium text-clay">{moeda(Number(p.preco))}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="encontro" className="bg-paper border-t border-ink/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-12 gap-6 items-start">
            <div className="col-span-12 md:col-span-4">
              <p className="eyebrow text-clay mb-3">Ponto de encontro</p>
              <h2 className="font-display text-3xl font-medium leading-tight text-balance max-w-[20ch]">
                O cardápio é aberto, a retirada é combinada
              </h2>
              <p className="mt-3 text-sm text-ink/60 text-pretty">
                Compartilhe este link com quem quiser. A conversa sobre quantidade e retirada acontece direto com você.
              </p>
              <Link
                to="/admin"
                className="mt-5 inline-flex items-center gap-2 bg-clay text-cream text-sm font-medium px-4 py-2.5 rounded-full hover:bg-clay/90 transition-colors"
              >
                Área do produtor
              </Link>
            </div>

            <div className="col-span-12 md:col-span-8">
              <div className="rounded-2xl bg-cream ring-1 ring-black/5 overflow-hidden">
                <div className="grid grid-cols-12 items-center gap-3 px-5 py-3 border-b border-ink/10 eyebrow text-ink/45">
                  <span className="col-span-5">Encontro</span>
                  <span className="col-span-4">Quando</span>
                  <span className="col-span-3 text-right">Onde</span>
                </div>
                {[
                  { nome: "Feira da manhã", quando: "Sábado, 7h — 12h", onde: "Praça do Moinho" },
                  { nome: "Retirada no ateliê", quando: "Quarta, 14h — 19h", onde: "Rua das Amoreiras, 88" },
                  { nome: "Combinação direta", quando: "Sob demanda", onde: "Mensagem" },
                ].map((linha) => (
                  <div key={linha.nome} className="grid grid-cols-12 items-center gap-3 px-5 py-4 border-b border-ink/5 last:border-b-0">
                    <span className="col-span-5 font-medium">{linha.nome}</span>
                    <span className="col-span-4 text-sm text-ink/55">{linha.quando}</span>
                    <span className="col-span-3 text-sm text-right">{linha.onde}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-cream border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="font-display text-lg font-medium">simbi</span>
          <span className="text-xs text-ink/45">
            Feito à mão · cardápio digital de produtos vivos · sem carrinho, sem pressa
          </span>
        </div>
      </footer>
    </div>
  );
}
