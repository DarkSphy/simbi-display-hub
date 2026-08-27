import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listarCatalogosPublicos } from "@/lib/produtos.functions";

const vitrineQuery = queryOptions({
  queryKey: ["catalogos-publicos"],
  queryFn: () => listarCatalogosPublicos(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(vitrineQuery),
  head: () => ({
    meta: [
      { title: "simbi — o catálogo digital de quem vende comida de verdade" },
      {
        name: "description",
        content:
          "Crie um catálogo com a sua cara: logo, nome, horário e produtos frescos em um link só seu. Sem carrinho, sem taxa de entrega.",
      },
      { property: "og:title", content: "simbi — o catálogo digital de quem vende comida de verdade" },
      {
        property: "og:description",
        content: "Um link só seu para mostrar produtos frescos, com logo, horário e contato do seu jeito.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">Não conseguimos abrir a página agora.</p>
    </div>
  ),
  component: Home,
});

const passos = [
  {
    numero: "01",
    titulo: "Monte a sua página",
    texto: "Logo, nome, descrição, horário de funcionamento e contato — tudo com a identidade do seu negócio.",
  },
  {
    numero: "02",
    titulo: "Cadastre o que está fresco",
    texto: "Foto, medida, preço e um texto curto. Publique ou guarde cada item com um toque.",
  },
  {
    numero: "03",
    titulo: "Compartilhe o seu link",
    texto: "Um endereço exclusivo para colar na bio, no grupo do bairro ou na etiqueta da caixa.",
  },
];

function Home() {
  const { data: catalogos } = useSuspenseQuery(vitrineQuery);

  return (
    <div className="min-h-screen bg-cream text-ink font-body">
      <header className="border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-2xl font-semibold tracking-tight">simbi</span>
            <span className="hidden sm:inline eyebrow text-ink/45">catálogos de produtos vivos</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#como-funciona" className="hidden sm:inline text-ink/50 hover:text-ink transition-colors">
              Como funciona
            </a>
            <Link to="/admin" className="font-medium bg-ink text-cream px-3.5 py-2 rounded-full text-sm">
              Área do produtor
            </Link>
          </nav>
        </div>
      </header>

      <section>
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-14 grid grid-cols-12 gap-8 items-end">
          <div className="col-span-12 lg:col-span-7">
            <p className="eyebrow text-clay mb-4">Um link, o seu jeito de mostrar</p>
            <h1 className="font-display font-medium text-[56px] leading-[0.95] tracking-tight text-balance max-w-[15ch]">
              Cada produtor com o <em className="italic font-normal text-clay">seu</em> catálogo
            </h1>
            <p className="mt-6 text-pretty text-ink/65 max-w-[48ch]">
              A simbi dá a quem faz comida de verdade uma página própria: logo, nome, horário e a lista do que está
              fresco hoje. Nada congelado, nada de carrinho — só o seu produto bem apresentado, no seu endereço.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/auth" className="bg-ink text-cream rounded-full px-6 py-3.5 text-sm font-medium">
                Criar meu catálogo
              </Link>
              {catalogos[0] ? (
                <Link
                  to="/c/$slug"
                  params={{ slug: catalogos[0].slug }}
                  className="text-sm underline underline-offset-4 decoration-ink/30 hover:decoration-clay"
                >
                  Ver um catálogo real
                </Link>
              ) : null}
            </div>
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
      </section>

      <section id="como-funciona" className="border-y border-ink/10 bg-paper scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          {passos.map((passo) => (
            <div key={passo.numero}>
              <span className="font-display text-4xl text-clay">{passo.numero}</span>
              <h2 className="mt-3 font-display text-2xl font-medium leading-tight">{passo.titulo}</h2>
              <p className="mt-2 text-sm text-ink/60 text-pretty">{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-ink/10">
            <h2 className="font-display text-3xl font-medium">Catálogos na simbi</h2>
            <span className="eyebrow text-ink/40">{catalogos.length} produtores</span>
          </div>

          {catalogos.length === 0 ? (
            <p className="font-display text-2xl text-ink/50 py-14">
              Ainda não há catálogos publicados. O primeiro pode ser o seu.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catalogos.map((c) => (
                <Link
                  key={c.slug}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="bg-paper rounded-2xl ring-1 ring-black/5 p-6 hover:ring-clay/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={`Logo ${c.nome}`}
                        loading="lazy"
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover ring-1 ring-ink/10"
                      />
                    ) : (
                      <span className="size-11 rounded-full bg-linen grid place-items-center font-display text-lg">
                        {c.nome.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="font-display text-xl font-medium">{c.nome}</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/60 text-pretty line-clamp-3">{c.descricao}</p>
                  <span className="mt-4 inline-block eyebrow text-clay">/c/{c.slug}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-paper">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap items-baseline justify-between gap-4">
          <p className="font-display text-2xl max-w-[24ch] text-balance">
            Sua comida merece uma página tão boa quanto ela.
          </p>
          <Link to="/auth" className="bg-clay text-cream rounded-full px-6 py-3 text-sm font-medium">
            Começar agora
          </Link>
        </div>
      </footer>
    </div>
  );
}
