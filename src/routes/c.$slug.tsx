import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

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
      loaderData?.catalogo?.descricao || `Veja os produtos frescos de ${nome} no catÃ¡logo digital simbi.`;
    return {
      meta: [
        { title: `${nome} â€” catÃ¡logo simbi` },
        { name: "description", content: descricao.slice(0, 155) },
        { property: "og:title", content: `${nome} â€” catÃ¡logo simbi` },
        { property: "og:description", content: descricao.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">NÃ£o conseguimos abrir este catÃ¡logo agora.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <p className="font-display text-2xl">CatÃ¡logo nÃ£o encontrado.</p>
    </div>
  ),
  component: CatalogoPublico,
});

const moeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(valor);

function CartDrawer({ catalogo }: { catalogo: any }) {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [loading, setLoading] = useState(false);

  const cartCount = items.reduce((acc, item) => acc + item.quantidade, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("pedidos").insert({
        cliente_nome: nome,
        cliente_whatsapp: whatsapp,
        cliente_endereco: endereco,
        itens: items,
        total: total,
        catalogo_id: catalogo.id
      });

      if (error) throw error;

      const msgItens = items.map(i => "- ${i.quantidade}x ${i.nome} (${moeda(Number(i.preco) * i.quantidade)})").join('%0A');
      const mensagem = "Olá, gostaria de fazer o seguinte pedido:%0A%0A${msgItens}%0A%0ATotal: *${moeda(total)}*%0A%0A*Meus dados:*%0ANome: ${nome}%0AWhatsApp: ${whatsapp}%0AEndereço: ${endereco}";
      const url = "https://wa.me/${catalogo.contato}?text=${mensagem}";
      
      clearCart();
      setOpen(false);
      window.open(url, '_blank');
    } catch (err) {
      alert("Erro ao enviar pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 bg-clay text-cream p-4 rounded-full shadow-lg hover:bg-clay/90 transition-colors z-40 flex items-center gap-2">
        <ShoppingBag size={24} />
        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-ink text-cream text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-paper h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-display">Seu Pedido</h2><button onClick={()=>setOpen(false)}><X/></button></div>
            {items.length === 0 ? <p>Carrinho vazio.</p> : (
              <div className="flex-1 overflow-y-auto space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div><p className="font-medium">{item.nome}</p><p className="text-sm">{moeda(Number(item.preco))}</p></div>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>updateQuantity(item.id, item.quantidade-1)} className="w-8 h-8 rounded-full border flex items-center justify-center">-</button>
                      <span>{item.quantidade}</span>
                      <button onClick={()=>updateQuantity(item.id, item.quantidade+1)} className="w-8 h-8 rounded-full border flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 font-display text-xl flex justify-between"><span>Total</span><span>{moeda(total)}</span></div>
                <form onSubmit={handleCheckout} className="space-y-4 pt-6">
                  <input required value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome Completo" className="w-full p-3 rounded-xl border"/>
                  <input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full p-3 rounded-xl border"/>
                  <textarea required value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Endereço" className="w-full p-3 rounded-xl border"/>
                  <button disabled={loading} type="submit" className="w-full p-4 rounded-full bg-ink text-cream">{loading ? "Enviando..." : "Finalizar via WhatsApp"}</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CatalogoPublico() {
  const { data } = useSuspenseQuery(catalogoQuery(Route.useParams().slug));
  const { catalogo, produtos } = data;
  const { addItem } = useCart();
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
          <h1 className="font-display text-4xl font-medium">Este catÃ¡logo nÃ£o existe (ou saiu do ar).</h1>
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
              <p className="eyebrow text-clay mb-4">CatÃ¡logo desta semana</p>
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
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 text-sm">âŒ•</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, ingrediente ou categoriaâ€¦"
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
            <p className="font-display text-2xl text-ink/50 py-16">Nada por aqui nesta estaÃ§Ã£o.</p>
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
                          {p.disponivel ? "disponÃ­vel" : "esgotado"}
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
            {catalogo.nome} Â· catÃ¡logo digital
          </span>
          <Link to="/" className="hover:text-ink transition-colors">
            Crie o seu catÃ¡logo na simbi
          </Link>
        </div>
      </footer>
    </div>
  );
}

