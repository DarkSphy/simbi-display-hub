import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ShoppingBag, X, Search, Clock, MapPin, MessageCircle } from "lucide-react";

import { listarCatalogoPorSlug } from "@/lib/produtos.functions";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

const catalogoQuery = (slug: string) =>
  queryOptions({
    queryKey: ["catalogo", slug],
    queryFn: () => listarCatalogoPorSlug({ data: { slug } }),
  });

export const Route = createFileRoute("/c/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(catalogoQuery(params.slug)),
  head: ({ loaderData, params }) => {
    const nome = loaderData?.catalogo?.nome ?? params.slug;
    return {
      meta: [{ title: `${nome} — Catálogo Digital` }],
    };
  },
  component: CatalogoPublico,
});

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

function CatalogoPublico() {
  const { data } = useSuspenseQuery(catalogoQuery(Route.useParams().slug));
  const { catalogo, produtos } = data;
  const { addItem } = useCart();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const categorias = useMemo(() => ["Todos", ...Array.from(new Set(produtos.map((p) => p.categoria)))], [produtos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const casaCategoria = categoria === "Todos" || p.categoria === categoria;
      const casaBusca = !termo || p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo);
      return casaCategoria && casaBusca;
    });
  }, [produtos, busca, categoria]);

  if (!catalogo) return <div className="min-h-screen grid place-items-center">Não encontrado.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-24">
      {/* Capa */}
      <div className="w-full h-48 md:h-64 relative bg-primary/10">
        {catalogo.capa_url ? (
          <img src={catalogo.capa_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-pink-500 opacity-20" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Info Loja */}
        <div className="relative -mt-16 mb-10 flex flex-col items-center text-center">
          <div className="size-32 rounded-3xl bg-surface border-4 border-background overflow-hidden shadow-soft mb-4 grid place-items-center">
            {catalogo.logo_url ? <img src={catalogo.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="font-display text-4xl font-bold text-primary">{catalogo.nome.slice(0,1)}</span>}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">{catalogo.nome}</h1>
          <p className="text-muted-foreground max-w-xl">{catalogo.descricao}</p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {catalogo.horario && <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-full"><Clock size={16}/> {catalogo.horario}</div>}
            {catalogo.endereco && <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-full"><MapPin size={16}/> {catalogo.endereco}</div>}
          </div>
        </div>

        {/* Buscas */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produtos..." className="w-full bg-surface border border-border rounded-full pl-11 pr-4 py-3 outline-none focus:border-primary shadow-sm" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categorias.map(c => (
              <button key={c} onClick={()=>setCategoria(c)} className={`whitespace-nowrap px-5 py-3 rounded-full font-semibold text-sm transition-all shadow-sm ${categoria === c ? 'bg-primary text-white' : 'bg-surface border border-border text-foreground hover:bg-secondary'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">Nenhum produto encontrado.</p>}
          {filtrados.map(p => (
            <div key={p.id} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-soft transition-all group flex flex-col">
              {p.imagem_url ? (
                <div className="h-48 overflow-hidden"><img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
              ) : (
                <div className="h-48 bg-secondary grid place-items-center text-muted-foreground/30"><ShoppingBag size={48}/></div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{p.categoria}</span>
                  <span className="text-xs font-bold text-muted-foreground">{p.medida}</span>
                </div>
                <h3 className="font-bold text-xl mb-2">{p.nome}</h3>
                <p className="text-sm text-muted-foreground flex-1 line-clamp-2">{p.descricao}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-display font-bold text-2xl">{moeda(p.preco)}</span>
                  {p.disponivel ? (
                    <button onClick={() => addItem(p)} className="bg-primary text-white font-bold px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors shadow-sm shadow-primary/30 hover:-translate-y-0.5">
                      Adicionar
                    </button>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground bg-secondary px-4 py-2 rounded-full">Esgotado</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <CartDrawer catalogo={catalogo} />
    </div>
  );
}

// Drawer mantido mas adaptado para o novo design visual
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
        cliente_nome: nome, cliente_whatsapp: whatsapp, cliente_endereco: endereco, itens: items, total: total, catalogo_id: catalogo.id
      });
      if (error) throw error;
      const msgItens = items.map(i => `- ${i.quantidade}x ${i.nome} (${moeda(Number(i.preco) * i.quantidade)})`).join('%0A');
      const mensagem = `Olá! Gostaria de fazer o seguinte pedido:%0A%0A${msgItens}%0A%0ATotal: *${moeda(total)}*%0A%0A*Meus dados:*%0ANome: ${nome}%0AWhatsApp: ${whatsapp}%0AEndereço: ${endereco}`;
      const url = `https://wa.me/${catalogo.contato?.replace(/\D/g,'')}?text=${mensagem}`;
      clearCart(); setOpen(false); window.open(url, '_blank');
    } catch (err) {
      alert("Erro ao enviar pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 hover:-translate-y-1 transition-all z-40 flex items-center gap-2">
        <ShoppingBag size={24} />
        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-background border-2 border-primary text-primary text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-2xl font-display font-bold">Seu Pedido</h2>
              <button onClick={()=>setOpen(false)} className="text-muted-foreground hover:bg-secondary p-2 rounded-full"><X/></button>
            </div>
            {items.length === 0 ? <p className="p-8 text-center text-muted-foreground font-medium">Seu carrinho está vazio.</p> : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl">
                      <div>
                        <p className="font-bold">{item.nome}</p>
                        <p className="text-sm text-primary font-bold">{moeda(Number(item.preco))}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-secondary p-1 rounded-full">
                        <button onClick={()=>updateQuantity(item.id, item.quantidade-1)} className="w-8 h-8 rounded-full bg-surface shadow-sm font-bold flex items-center justify-center">-</button>
                        <span className="w-4 text-center font-bold">{item.quantidade}</span>
                        <button onClick={()=>updateQuantity(item.id, item.quantidade+1)} className="w-8 h-8 rounded-full bg-surface shadow-sm font-bold flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 font-display text-2xl font-bold flex justify-between"><span>Total</span><span className="text-primary">{moeda(total)}</span></div>
                
                <form onSubmit={handleCheckout} className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-bold mb-4">Dados de Entrega</h3>
                  <input required value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome Completo" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary"/>
                  <input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary"/>
                  <textarea required value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Endereço de Entrega" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary" rows={3}/>
                  <button disabled={loading} type="submit" className="w-full p-4 rounded-2xl bg-primary hover:bg-brand-hover text-white font-bold flex justify-center items-center gap-2 mt-4 shadow-sm shadow-primary/30">
                    {loading ? "Enviando..." : <><MessageCircle size={20}/> Finalizar via WhatsApp</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
