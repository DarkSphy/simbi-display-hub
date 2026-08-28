import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Loader2, Package, Weight, X, Image as ImageIcon } from "lucide-react";
import { ImageUpload, MultipleImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewProdutos({ catalogo }: any) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos-admin", catalogo.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").eq("catalogo_id", catalogo.id).order("created_at");
      if (error) throw error; return data;
    }
  });

  const categoriasLoja = catalogo.categorias_padrao || [];
  const categoriasUsadas = Array.from(new Set(produtos.map(p => p.categoria)));
  const todasCategorias = Array.from(new Set([...categoriasLoja, ...categoriasUsadas]));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      estoque: Number(form.estoque) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      preco: Number(form.preco) || 0
    };
    if (payload.id) { await supabase.from("produtos").update(payload).eq("id", payload.id); } 
    else { await supabase.from("produtos").insert({...payload, catalogo_id: catalogo.id}); }
    setForm(null); 
    queryClient.invalidateQueries({queryKey: ["produtos-admin"]});
    toast.success("Produto salvo com sucesso!");
  };

  const addPasso = () => {
    const arr = form.modo_preparo || [];
    setForm({...form, modo_preparo: [...arr, ""]});
  };

  const updatePasso = (idx: number, val: string) => {
    const arr = [...(form.modo_preparo || [])];
    arr[idx] = val;
    setForm({...form, modo_preparo: arr});
  };

  const removePasso = (idx: number) => {
    const arr = [...(form.modo_preparo || [])];
    arr.splice(idx, 1);
    setForm({...form, modo_preparo: arr});
  };

  const filtrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = filtroCategoria === "todas" || p.categoria === filtroCategoria;
    return matchBusca && matchCat;
  });

  if (isLoading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>;

  return (
    <div className="space-y-6 pb-12 w-full animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold">Produtos</h2>
          <p className="text-muted-foreground mt-1">Gerencie o seu catálogo e estoque.</p>
        </div>
        {!form && (
          <button onClick={() => setForm({nome:'', descricao:'', preco:0, categoria: categoriasLoja[0] || '', visivel:true, disponivel:true, imagem_url:'', tipo_venda: 'unidade', modo_preparo: [], estoque: 0, estoque_minimo: 0})} className="bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-hover flex items-center gap-2 shadow-sm transition-all active:scale-95"><Plus size={20}/> Novo Produto</button>
        )}
      </header>

      {form ? (
        <form onSubmit={salvar} className="bg-surface border border-border p-6 sm:p-8 rounded-3xl shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="font-bold text-2xl font-display">{form.id ? "Editar Produto" : "Novo Produto"}</h3>
            <button type="button" onClick={()=>setForm(null)} className="p-2 bg-secondary rounded-full hover:bg-border"><X/></button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 shrink-0 space-y-6">
              <ImageUpload label="Foto Principal do Produto" value={form.imagem_url || ''} onChange={url => setForm({...form, imagem_url: url})} />
              <MultipleImageUpload label="Galeria de Fotos (Opcional)" values={form.galeria || []} onChange={urls => setForm({...form, galeria: urls})} />
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label className="block space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground block">Nome do Produto</span>
                  <input required value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all"/>
                </label>
                
                <div className="space-y-1.5">
                  <span className="text-sm font-bold text-muted-foreground block">Categoria</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="flex-1 border rounded-xl p-3 outline-none focus:border-primary bg-background">
                      <option value="" disabled>Selecione...</option>
                      {todasCategorias.map((c:string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input placeholder="Ou nova..." value={categoriasLoja.includes(form.categoria) ? '' : form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="flex-1 border rounded-xl p-3 outline-none focus:border-primary bg-background"/>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/50 p-5 rounded-2xl border border-border">
                <span className="text-sm font-bold text-muted-foreground block mb-3">Venda e Precificação</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex gap-2">
                    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border p-2 transition-colors ${form.tipo_venda === "unidade" || !form.tipo_venda ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                      <input type="radio" name="tipo" value="unidade" checked={form.tipo_venda === 'unidade' || !form.tipo_venda} onChange={() => setForm({...form, tipo_venda: 'unidade'})} className="hidden"/>
                      <Package size={16}/> <span className="font-bold text-sm">Unidade</span>
                    </label>
                    <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border p-2 transition-colors ${form.tipo_venda === "peso" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                      <input type="radio" name="tipo" value="peso" checked={form.tipo_venda === 'peso'} onChange={() => setForm({...form, tipo_venda: 'peso'})} className="hidden"/>
                      <Weight size={16}/> <span className="font-bold text-sm">Peso</span>
                    </label>
                  </div>
                  
                  <label className="block">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">Preço (R$)</span>
                    <input type="number" step="0.01" min="0" required value={form.preco} onChange={e=>setForm({...form,preco:e.target.value})} className="w-full border rounded-xl p-2 outline-none focus:border-primary bg-background font-mono"/>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">Medida/Porção</span>
                    <input placeholder="ex: 1 Kg, 500g, 1 Unid" value={form.medida||''} onChange={e=>setForm({...form,medida:e.target.value})} className="w-full border rounded-xl p-2 outline-none focus:border-primary bg-background"/>
                  </label>
                </div>
              </div>

              {/* ESTOQUE */}
              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20">
                <span className="text-sm font-bold text-primary block mb-3">Controle de Estoque</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-bold text-foreground block mb-1">Estoque Atual</span>
                    <input type="number" min="0" value={form.estoque ?? 0} onChange={e=>setForm({...form,estoque:e.target.value})} className="w-full border rounded-xl p-2 outline-none focus:border-primary bg-background font-mono"/>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-foreground block mb-1">Estoque Mínimo (Alerta)</span>
                    <input type="number" min="0" value={form.estoque_minimo ?? 0} onChange={e=>setForm({...form,estoque_minimo:e.target.value})} className="w-full border rounded-xl p-2 outline-none focus:border-primary bg-background font-mono"/>
                  </label>
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-muted-foreground block">Descrição Curta</span>
                <textarea value={form.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={2} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background resize-none"/>
              </label>

              {/* Passos de Preparo */}
              <div className="border border-border p-6 rounded-2xl bg-secondary/30 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground block">Modo de Preparo / Detalhes (Opcional)</span>
                  <button type="button" onClick={addPasso} className="text-xs font-bold bg-background border border-border px-3 py-1.5 rounded-lg hover:bg-secondary flex items-center gap-1 shadow-sm"><Plus size={14}/> Adicionar Etapa</button>
                </div>
                
                <div className="space-y-3">
                  {(!form.modo_preparo || form.modo_preparo.length === 0) && (
                    <p className="text-sm text-muted-foreground/60 italic">Adicione passos se quiser mostrar um tutorial ou detalhes técnicos por etapas.</p>
                  )}
                  {(form.modo_preparo || []).map((passo: string, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="bg-background border border-border rounded-xl w-10 flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
                      <input value={passo} onChange={(e) => updatePasso(idx, e.target.value)} placeholder={`Descreva a etapa ${idx + 1}...`} className="flex-1 border rounded-xl p-2 outline-none focus:border-primary bg-background"/>
                      <button type="button" onClick={() => removePasso(idx)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg"><X size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-6 p-4 rounded-xl border border-border bg-background items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.visivel} onChange={e=>setForm({...form,visivel:e.target.checked})} className="size-5 rounded border-border text-primary focus:ring-primary"/>
                  <div className="flex flex-col"><span className="font-bold text-sm">Visível na Loja</span><span className="text-xs text-muted-foreground">Clientes podem ver</span></div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.disponivel} onChange={e=>setForm({...form,disponivel:e.target.checked})} className="size-5 rounded border-border text-primary focus:ring-primary"/>
                  <div className="flex flex-col"><span className="font-bold text-sm">Em Estoque</span><span className="text-xs text-muted-foreground">Pode ser comprado</span></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border">
            <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-hover shadow-sm transition-all active:scale-95">Salvar Produto</button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..." className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl shadow-sm outline-none focus:border-primary transition-all" />
            </div>
            <select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)} className="bg-surface border border-border px-4 py-3 rounded-xl shadow-sm outline-none focus:border-primary font-medium min-w-[150px]">
              <option value="todas">Todas as Categorias</option>
              {todasCategorias.map((c:string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtrados.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10 bg-surface rounded-3xl border border-border">Nenhum produto encontrado.</p>}
            {filtrados.map((p: any) => {
              const estoqueCritico = p.estoque !== null && p.estoque <= (p.estoque_minimo || 0);
              return (
                <div key={p.id} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative">
                  {!p.visivel && <div className="absolute top-3 right-3 bg-background/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg z-10 border border-border shadow-sm">Oculto</div>}
                  {p.imagem_url ? (
                    <div className="h-40 overflow-hidden"><img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
                  ) : (
                    <div className="h-40 bg-secondary flex items-center justify-center text-muted-foreground"><ImageIcon size={32} className="opacity-20"/></div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md line-clamp-1">{p.categoria}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1">{p.nome}</h3>
                    <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">{p.tipo_venda === 'peso' ? <Weight size={12}/> : <Package size={12}/>} {p.medida}</span>
                      <span className={`px-2 py-0.5 rounded-full ${estoqueCritico ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground'}`}>Estoque: {p.estoque || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                      <span className="font-bold text-xl">{moeda(p.preco)}<span className="text-xs text-muted-foreground font-normal">{p.tipo_venda === 'peso' ? '/kg' : ''}</span></span>
                      <button onClick={() => setForm(p)} className="px-4 py-2 bg-secondary text-foreground rounded-lg font-bold hover:bg-border transition-colors">Editar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}