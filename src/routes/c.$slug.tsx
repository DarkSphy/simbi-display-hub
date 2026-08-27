import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listarCatalogoPorSlug } from "@/lib/produtos.functions";

const catalogoQuery = (slug: string) =>
  queryOptions({
    queryKey: ["catalogo", slug],
    queryFn: () => listarCatalogoPorSlug({ data: { slug } }),
  });

export const Route = createFileRoute("/c/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(catalogoQuery(params.slug)),
  head: ({ loaderData, params }) => {
    const nome = loaderData?.catalogo?.nome ?? params.slug;
    const descricao =
      loaderData?.catalogo?.descricao || `Veja os produtos frescos de ${nome} no catálogo digital simbi.`;
    return {
      meta: [
        { title: `${nome} — catálogo simbi` },
        { name: "description", content: descricao.slice(0, 155) },
        { property: "og:title", content: `${nome} — catálogo simbi` },
        { property: "og:description", content: descricao.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">Não conseguimos abrir este catálogo agora.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">Catálogo não encontrado.</p>
    </div>
  ),
  component: CatalogoPublico,
});

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(valor);

function CatalogoPublico() {
  const { data } = useSuspenseQuery(catalogoQuery(Route.useParams().slug));
  const { catalogo, produtos } = data;
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");

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

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-cream text-ink font-body grid place-items-center px-6 text-center">
        <div>
          <p className="eyebrow text-clay mb-3">simbi</p>
          <h1 className="font-display text-4xl font-medium">Este catálogo não existe (ou saiu do ar).</h1>
          <Link to="/" className="mt-6 inline-block bg-ink text-cream rounded-full px-5 py-3 text-sm">
            Conhecer a simbi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink font-body">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {catalogo.logo_url ? (
              <img
                src={catalogo.logo_url}
                alt={`Logo ${catalogo.nome}`}
                width={44}
                height={44}
                className="size-11 rounded-full object-cover ring-1 ring-ink/10"
              />
            ) : null}
            <span className="font-display text-2xl font-semibold tracking-tight">{catalogo.nome}</span>
          </div>
          <Link to="/" className="text-xs text-ink/40 hover:text-ink transition-colors">
            feito com simbi
          </Link>
        </div>
      </header>

      <section>
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow text-clay mb-4">Catálogo desta semana</p>
              <h1 className="font-display font-medium text-[52px] leading-[0.98] tracking-tight text-balance max-w-[16ch]">
                {catalogo.nome}
              </h1>
              {catalogo.descricao ? (
                <p className="mt-5 text-pretty text-ink/65 max-w-[46ch]">{catalogo.descricao}</p>
              ) : null}
              <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
                {catalogo.horario ? (
                  <div>
                    <dt className="eyebrow text-ink/40">Funcionamento</dt>
                    <dd className="text-sm mt-1">{catalogo.horario}</dd>
                  </div>
                ) : null}
                {catalogo.endereco ? (
                  <div>
                    <dt className="eyebrow text-ink/40">Onde encontrar</dt>
                    <dd className="text-sm mt-1">{catalogo.endereco}</dd>
                  </div>
                ) : null}
                {catalogo.contato ? (
                  <div>
                    <dt className="eyebrow text-ink/40">Contato</dt>
                    <dd className="text-sm mt-1">{catalogo.contato}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <div className="rounded-2xl bg-linen ring-1 ring-black/5 p-2">
                <img
                  src={catalogo.capa_url || "/images/hero.jpg"}
                  alt={`Produtos de ${catalogo.nome}`}
                  width={1024}
                  height={640}
                  className="w-full aspect-[16/10] object-cover rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row md:items-center gap-4 pb-8 border-b border-ink/10">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 text-sm">⌕</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, ingrediente ou categoria…"
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
                      <h2 className="mt-2 font-display text-2xl font-medium leading-tight">{p.nome}</h2>
                      <p className={escuro ? "mt-1 text-sm text-cream/60 text-pretty" : "mt-1 text-sm text-ink/60 text-pretty"}>
                        {p.descricao}
                      </p>
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="font-display text-xl">{moeda(Number(p.preco))}</span>
                        <span className={escuro ? "eyebrow text-cream/50" : "eyebrow text-ink/40"}>
                          {p.disponivel ? "disponível" : "esgotado"}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-baseline justify-between gap-4 text-sm text-ink/50">
          <span>
            {catalogo.nome} · catálogo digital
          </span>
          <Link to="/" className="hover:text-ink transition-colors">
            Crie o seu catálogo na simbi
          </Link>
        </div>
      </footer>
    </div>
  );
}
