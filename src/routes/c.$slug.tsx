import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ShoppingBag, Search, ExternalLink, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Info, Minus, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import type { CatalogoPublico } from "@/lib/produtos.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/c/$slug")({
  component: CatalogoPublicoView,
});

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

function CatalogoPublicoView() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["catalogo-publico", slug],
    queryFn: async () => {
      const { data: cData, error: cErr } = await supabase.from("catalogos").select("*").eq("slug", slug).single();
      if (cErr || !cData) throw new Error("Catálogo não encontrado");
      const { data: pData, error: pErr } = await supabase.from("produtos").select("*").eq("catalogo_id", cData.id).eq("visivel", true).order("ordem");
      if (pErr) throw pErr;
      return { catalogo: cData, produtos: pData } as CatalogoPublico;
    }
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center bg-background"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
  if (!data?.catalogo) return <div className="min-h-screen grid place-items-center bg-background text-xl font-bold">Catálogo não encontrado.</div>;

  return <Catalog catalogo={data.catalogo} produtos={data.produtos} />;
}

// ---------------------------
// ANIMATION STORE
// ---------------------------
let triggerAnimation: (src: string, e: React.MouseEvent) => void = () => {};

function FlyingAnimationProvider() {
  const [flyingItem, setFlyingItem] = useState<{ id: number, src: string, startX: number, startY: number } | null>(null);

  useEffect(() => {
    triggerAnimation = (src, e) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const newId = Date.now();
      setFlyingItem({ id: newId, src, startX: e.clientX, startY: e.clientY });
      
      // Bump cart button
      setTimeout(() => {
        const cartBtn = document.getElementById("cart-button-trigger");
        if (cartBtn) {
          cartBtn.style.transform = "scale(1.2)";
          setTimeout(() => cartBtn.style.transform = "scale(1) translateY(-4px)", 150);
        }
      }, 500);

      // Remove item
      setTimeout(() => setFlyingItem(null), 600);
    };
  }, []);

  return (
    <>
      {flyingItem && (
        <img 
          key={flyingItem.id}
          src={flyingItem.src}
          className="fixed z-[9999] rounded-full object-cover shadow-xl pointer-events-none transition-all duration-500 ease-in-out border-2 border-primary"
          style={{
            width: 50, height: 50,
            left: flyingItem.startX - 25, top: flyingItem.startY - 25,
            transform: 'translate(calc(100vw - 80px - var(--startX)), calc(100vh - 80px - var(--startY))) scale(0.2)',
            '--startX': `${flyingItem.startX}px`,
            '--startY': `${flyingItem.startY}px`,
            opacity: 0.8
          } as any}
        />
      )}
    </>
  );
}

// ---------------------------
// COMPONENTS
// ---------------------------

function ProductModal({ produto, onClose, onAdd }: { produto: any, onClose: () => void, onAdd: (qty: number, e: React.MouseEvent) => void }) {
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);
  
  const fotos = [produto.imagem_url, ...(produto.galeria || [])].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Galeria */}
        <div className="relative h-64 sm:h-80 bg-secondary flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"><X size={20}/></button>
          
          {fotos.length > 0 ? (
            <>
              <img src={fotos[imgIndex]} alt={produto.nome} className="w-full h-full object-cover transition-all duration-300"/>
              {fotos.length > 1 && (
                <>
                  <button onClick={(e)=>{e.stopPropagation(); setImgIndex((i)=> i === 0 ? fotos.length-1 : i-1);}} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1.5 rounded-full hover:bg-black/60"><ChevronLeft/></button>
                  <button onClick={(e)=>{e.stopPropagation(); setImgIndex((i)=> i === fotos.length-1 ? 0 : i+1);}} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1.5 rounded-full hover:bg-black/60"><ChevronRight/></button>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                    {fotos.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}/>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ShoppingBag size={64}/></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">{produto.categoria}</span>
              <span className="text-sm font-bold text-muted-foreground">{produto.medida}</span>
            </div>
            <h2 className="text-2xl font-bold font-display">{produto.nome}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{produto.descricao}</p>
          </div>

          {produto.modo_preparo && (
            <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
              <h3 className="font-bold flex items-center gap-2 mb-2 text-sm"><Info size={16} className="text-primary"/> Detalhes / Ingredientes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{produto.modo_preparo}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border bg-surface flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center justify-between w-full sm:w-auto bg-secondary rounded-2xl p-1 border border-border">
            <button onClick={()=>setQty(Math.max(1, qty-1))} className="w-10 h-10 flex items-center justify-center bg-surface rounded-xl shadow-sm hover:text-primary"><Minus size={18}/></button>
            <span className="w-12 text-center font-bold text-lg">{qty}</span>
            <button onClick={()=>setQty(qty+1)} className="w-10 h-10 flex items-center justify-center bg-surface rounded-xl shadow-sm hover:text-primary"><Plus size={18}/></button>
          </div>
          <button onClick={(e) => onAdd(qty, e)} className="flex-1 w-full bg-primary text-white font-bold px-6 py-4 rounded-2xl shadow-sm hover:bg-brand-hover hover:shadow-md transition-all active:scale-95 flex items-center justify-between group">
            <span>Adicionar</span>
            <span className="font-display group-hover:scale-105 transition-transform">{moeda(produto.preco * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Catalog({ catalogo, produtos }: { catalogo: any, produtos: any[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const { addItem, items } = useCart();
  const [produtoAtivo, setProdutoAtivo] = useState<any>(null);

  const categorias = ["Todas", ...Array.from(new Set(produtos.map(p => p.categoria)))];

  const filtrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoria === "Todas" || p.categoria === categoria;
    return matchBusca && matchCat;
  });

  const handleAdd = (p: any, qty: number, e: React.MouseEvent) => {
    for(let i=0; i<qty; i++) {
      addItem(p);
    }
    const imgSrc = p.imagem_url || (p.galeria && p.galeria[0]) || '';
    if (imgSrc) {
      triggerAnimation(imgSrc, e);
    } else {
      toast.success(qty > 1 ? `${qty}x ${p.nome} adicionados!` : `${p.nome} adicionado!`);
    }
    setProdutoAtivo(null);
  };

  const handleAddDirect = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(p);
    const imgSrc = p.imagem_url || (p.galeria && p.galeria[0]) || '';
    if (imgSrc) {
      triggerAnimation(imgSrc, e);
    } else {
      toast.success(`${p.nome} adicionado!`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <FlyingAnimationProvider />
      {produtoAtivo && (
        <ProductModal 
          produto={produtoAtivo} 
          onClose={() => setProdutoAtivo(null)} 
          onAdd={(qty, e) => handleAdd(produtoAtivo, qty, e)} 
        />
      )}

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 w-full bg-secondary">
        {catalogo.capa_url && <img src={catalogo.capa_url} alt="Capa" className="absolute inset-0 w-full h-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {catalogo.logo_url && (
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-background shadow-xl shrink-0">
              <img src={catalogo.logo_url} alt="Logo" className="w-full h-full object-cover bg-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-display font-bold">{catalogo.nome}</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">{catalogo.descricao}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 mt-4">
        {/* Busca e Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-4 z-30">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produtos..." className="w-full pl-12 pr-4 py-3.5 bg-surface/80 backdrop-blur-md border border-border rounded-2xl shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
            {categorias.map(c => (
              <button key={c} onClick={() => setCategoria(c)} className={`px-5 py-3 rounded-2xl font-semibold whitespace-nowrap snap-start transition-all ${categoria === c ? 'bg-primary text-white shadow-sm' : 'bg-surface border border-border text-muted-foreground hover:text-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10">Nenhum produto encontrado.</p>}
          {filtrados.map(p => (
            <div key={p.id} onClick={() => setProdutoAtivo(p)} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer hover:-translate-y-1">
              {p.imagem_url ? (
                <div className="h-48 overflow-hidden relative">
                  <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  {(p.galeria?.length > 0 || p.modo_preparo) && (
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                      <Info size={12}/> Mais detalhes
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-secondary grid place-items-center text-muted-foreground/30 relative">
                  <ShoppingBag size={48}/>
                  {p.modo_preparo && (
                    <div className="absolute top-3 left-3 bg-black/10 text-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                      <Info size={12}/> Mais detalhes
                    </div>
                  )}
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{p.categoria}</span>
                  <span className="text-xs font-bold text-muted-foreground">{p.medida}</span>
                </div>
                <h3 className="font-bold text-xl mb-1.5 group-hover:text-primary transition-colors">{p.nome}</h3>
                <p className="text-sm text-muted-foreground flex-1 line-clamp-2">{p.descricao}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display font-bold text-2xl">{moeda(p.preco)}</span>
                  {p.disponivel ? (
                    <button onClick={(e) => handleAddDirect(p, e)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold p-3 rounded-xl transition-colors active:scale-90" aria-label="Adicionar rápido">
                      <Plus size={20}/>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">Esgotado</span>
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
      const url = `https://wa.me/${String(catalogo.contato || '').replace(/\D/g, '')}?text=${mensagem}`;
      clearCart(); setOpen(false); window.open(url, '_blank');
    } catch (err) {
      console.error("Erro no checkout:", err); toast.error("Erro ao enviar pedido. A loja precisa configurar o sistema.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button id="cart-button-trigger" onClick={() => setOpen(true)} className="fixed bottom-6 right-6 bg-primary text-white p-4 sm:p-5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] shadow-primary/40 hover:-translate-y-1 transition-all z-40 flex items-center gap-3">
        <ShoppingBag size={24} />
        {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-foreground border-2 border-primary text-background text-xs w-7 h-7 rounded-full flex items-center justify-center font-bold animate-in zoom-in">{cartCount}</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border bg-background">
              <h2 className="text-2xl font-display font-bold flex items-center gap-3"><ShoppingBag className="text-primary"/> Seu Pedido</h2>
              <button onClick={()=>setOpen(false)} className="text-muted-foreground hover:bg-secondary p-2 rounded-full transition-colors"><X/></button>
            </div>
            {items.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground/60"><ShoppingBag size={64} className="mb-4 opacity-50"/><p className="font-medium text-lg">Seu carrinho está vazio.</p></div> : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-background border border-border p-4 rounded-2xl shadow-sm">
                      <div className="flex-1 mr-4">
                        <p className="font-bold text-base leading-tight mb-1">{item.nome}</p>
                        <p className="text-sm text-primary font-bold">{moeda(Number(item.preco))}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
                        <button onClick={()=>updateQuantity(item.id, item.quantidade-1)} className="w-8 h-8 rounded-lg bg-surface shadow-sm font-bold flex items-center justify-center hover:text-primary transition-colors">-</button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantidade}</span>
                        <button onClick={()=>updateQuantity(item.id, item.quantidade+1)} className="w-8 h-8 rounded-lg bg-surface shadow-sm font-bold flex items-center justify-center hover:text-primary transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 pb-2 font-display text-2xl font-bold flex justify-between items-end border-t border-border">
                  <span className="text-lg text-muted-foreground font-medium">Total</span>
                  <span className="text-primary text-3xl">{moeda(total)}</span>
                </div>
                
                <form onSubmit={handleCheckout} className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground"><Info size={18}/> Dados de Entrega</h3>
                  <input required value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome Completo" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
                  <input required value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"/>
                  <textarea required value={endereco} onChange={e=>setEndereco(e.target.value)} placeholder="Endereço de Entrega Completo" className="w-full p-4 rounded-2xl bg-background border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" rows={3}/>
                  <button disabled={loading} type="submit" className="w-full p-5 rounded-2xl bg-primary hover:bg-brand-hover text-white font-bold flex justify-center items-center gap-3 mt-6 shadow-[0_4px_14px_rgba(0,0,0,0.2)] shadow-primary/40 transition-transform active:scale-95 disabled:opacity-50 text-lg">
                    {loading ? "Enviando..." : <><MessageCircle size={22}/> Finalizar via WhatsApp</>}
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