import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, X, Search, Loader2, Image as ImageIcon, Weight, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImagem } from "@/lib/storage.functions";
import { toast } from "sonner";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

function ImageUpload({ label, value, onChange }: { label: string, value: string, onChange: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImagem(file);
      onChange(url);
    } catch (err: any) {
      alert("ERRO SUPABASE: " + JSON.stringify(err) + " - " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground block">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative size-16 rounded-xl overflow-hidden border border-border group shrink-0">
            <img src={value} alt="Upload" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center size-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors shrink-0">
            {loading ? <Loader2 className="animate-spin text-muted-foreground" size={20}/> : <Plus className="text-muted-foreground" size={20}/>}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading}/>
          </label>
        )}
      </div>
    </div>
  );
}

function MultipleImageUpload({ label, values, onChange }: { label: string, values: string[], onChange: (urls: string[]) => void }) {
  const [loading, setLoading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading(true);
    try {
      const newUrls = await Promise.all(files.map(f => uploadImagem(f)));
      onChange([...(values || []), ...newUrls]);
    } catch (err) {
      alert("Erro ao fazer upload das imagens.");
    } finally {
      setLoading(false);
    }
  };
  const removeImage = (index: number) => {
    const newValues = [...(values || [])];
    newValues.splice(index, 1);
    onChange(newValues);
  };
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground block">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        {(values || []).map((url, i) => (
          <div key={i} className="relative size-16 rounded-xl overflow-hidden border border-border group shrink-0">
            <img src={url} alt="Galeria" className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center size-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors shrink-0">
          {loading ? <Loader2 className="animate-spin text-muted-foreground" size={20}/> : <Plus className="text-muted-foreground" size={20}/>}
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} disabled={loading}/>
        </label>
      </div>
    </div>
  );
}

export function ViewProdutos({ catalogo }: { catalogo: any }) {
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
    if(form.id) { await supabase.from("produtos").update(form).eq("id", form.id); } 
    else { await supabase.from("produtos").insert({...form, catalogo_id: catalogo.id}); }
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
    <div className="space-y-6 pb-12 w-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold">Produtos</h2>
          <p className="text-muted-foreground mt-1">Gerencie o seu catálogo.</p>
        </div>
        {!form && (
          <button onClick={() => setForm({nome:'', descricao:'', preco:0, categoria: categoriasLoja[0] || '', visivel:true, disponivel:true, imagem_url:'', tipo_venda: 'unidade', modo_preparo: []})} className="bg-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-brand-hover flex items-center gap-2 shadow-sm transition-all active:scale-95"><Plus size={20}/> Novo Produto</button>
        )}
      </header>

      {form ? (
        <form onSubmit={salvar} className="bg-surface border border-border p-8 rounded-3xl shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="font-bold text-2xl font-display">{form.id ? "Editar Produto" : "Novo Produto"}</h3>
            <button type="button" onClick={()=>setForm(null)} className="p-2 bg-secondary rounded-full hover:bg-border"><X/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block space-y-1.5"><span className="text-sm font-bold text-muted-foreground block">Nome do Produto</span><input required value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background transition-all"/></label>
            
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-muted-foreground block">Categoria</span>
              <div className="flex gap-2">
                <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="flex-1 border rounded-xl p-3 outline-none focus:border-primary bg-background">
                  <option value="" disabled>Selecione...</option>
                  {todasCategorias.map((c:string) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Ou nova..." value={categoriasLoja.includes(form.categoria) ? '' : form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="w-1/2 border rounded-xl p-3 outline-none focus:border-primary bg-background"/>
              </div>
            </label>

            <div className="md:col-span-2 bg-secondary/50 p-6 rounded-2xl border border-border flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-1.5">
                <span className="text-sm font-bold text-muted-foreground block">Tipo de Venda</span>
                <div className="flex gap-4">
                  <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${form.tipo_venda === "unidade" || !form.tipo_venda ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                    <input type="radio" name="tipo" value="unidade" checked={form.tipo_venda === 'unidade' || !form.tipo_venda} onChange={() => setForm({...form, tipo_venda: 'unidade'})} className="hidden"/>
                    <Package size={20}/> <span className="font-bold">Por Unidade</span>
                  </label>
                  <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${form.tipo_venda === "peso" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                    <input type="radio" name="tipo" value="peso" checked={form.tipo_venda === 'peso'} onChange={() => setForm({...form, tipo_venda: 'peso'})} className="hidden"/>
                    <Weight size={20}/> <span className="font-bold">Por Peso (Kg/g)</span>
                  </label>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <span className="text-sm font-bold text-muted-foreground block">Preço {form.tipo_venda === 'peso' ? 'por Kg' : 'Unitário'} (R$)</span>
                <input required type="number" step="0.01" value={form.preco} onChange={e=>setForm({...form,preco:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-lg font-bold"/>
              </div>
              <div className="flex-1 space-y-1.5">
                <span className="text-sm font-bold text-muted-foreground block">Medida / Porção</span>
                <input required value={form.medida || ''} onChange={e=>setForm({...form,medida:e.target.value})} placeholder={form.tipo_venda === 'peso' ? "ex: 1 Kg" : "ex: 500g"} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"/>
              </div>
            </div>
            
            <label className="md:col-span-2 block space-y-1.5"><span className="text-sm font-bold text-muted-foreground block">Descrição Curta</span><textarea value={form.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={2} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background"/></label>
            
            {/* Passos de Preparo */}
            <div className="md:col-span-2 border border-border p-6 rounded-2xl bg-background space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground block">Modo de Preparo / Detalhes (Opcional)</span>
                <button type="button" onClick={addPasso} className="text-xs font-bold bg-secondary px-3 py-1.5 rounded-lg hover:bg-border">+ Adicionar Passo</button>
              </div>
              
              <div className="space-y-3">
                {(!form.modo_preparo || form.modo_preparo.length === 0) && (
                  <p className="text-sm text-muted-foreground/60 italic">Adicione passos se quiser mostrar um tutorial ou detalhes técnicos por etapas.</p>
                )}
                {(form.modo_preparo || []).map((passo: string, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="bg-secondary rounded-xl w-10 flex items-center justify-center font-bold text-sm shrink-0">{idx + 1}</div>
                    <input value={passo} onChange={(e) => updatePasso(idx, e.target.value)} placeholder={`Descreva o passo ${idx + 1}...`} className="flex-1 border rounded-xl p-2 outline-none focus:border-primary bg-background"/>
                    <button type="button" onClick={() => removePasso(idx)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg"><X size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-1 border border-border p-5 rounded-2xl bg-background">
              <ImageUpload label="Foto Principal (Vitrine)" value={form.imagem_url} onChange={(url) => setForm({...form, imagem_url: url})} />
            </div>
            <div className="md:col-span-1 border border-border p-5 rounded-2xl bg-background">
              <MultipleImageUpload label="Galeria de Fotos Adicionais" values={form.galeria || []} onChange={(urls) => setForm({...form, galeria: urls})} />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-border">
            <button type="button" onClick={()=>setForm(null)} className="px-6 py-3.5 text-muted-foreground hover:bg-secondary rounded-xl font-bold transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-hover hover:shadow-lg transition-all active:scale-95">Salvar Produto</button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto..." className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl shadow-sm outline-none focus:border-primary transition-all" />
            </div>
            <select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)} className="bg-surface border border-border px-4 py-3 rounded-xl shadow-sm outline-none focus:border-primary font-medium min-w-[150px]">
              <option value="todas">Todas as Categorias</option>
              {todasCategorias.map((c:string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.length === 0 && <p className="col-span-full text-center text-muted-foreground py-10 bg-surface rounded-3xl border border-border">Nenhum produto cadastrado.</p>}
            {filtrados.map((p: any) => (
              <div key={p.id} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                {p.imagem_url ? (
                  <div className="h-40 overflow-hidden"><img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>
                ) : (
                  <div className="h-40 bg-secondary flex items-center justify-center text-muted-foreground/30"><ImageIcon size={40}/></div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">{p.categoria}</span>
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">{p.tipo_venda === 'peso' ? <Weight size={12}/> : <Package size={12}/>} {p.medida}</span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1">{p.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{p.descricao}</p>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="font-bold text-xl">{moeda(p.preco)}<span className="text-xs text-muted-foreground font-normal">{p.tipo_venda === 'peso' ? '/kg' : ''}</span></span>
                    <button onClick={() => setForm(p)} className="px-4 py-2 bg-secondary text-foreground rounded-lg font-bold hover:bg-border transition-colors">Editar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}