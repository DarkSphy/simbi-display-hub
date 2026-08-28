import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon, Store, Phone, Loader2, Plus, X } from "lucide-react";
import { uploadImagem } from "@/lib/storage.functions";

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
          <div className="relative size-16 rounded-xl overflow-hidden border border-border group">
            <img src={value} alt="Upload" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center size-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors">
            {loading ? <Loader2 className="animate-spin text-muted-foreground" size={20}/> : <Plus className="text-muted-foreground" size={20}/>}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading}/>
          </label>
        )}
      </div>
    </div>
  );
}

export function ViewConfiguracoes({ catalogo, form, setForm, reload }: any) {
  const [salvando, setSalvando] = useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setSalvando(true);
    await supabase.from("catalogos").update(form).eq("id", catalogo.id);
    setSalvando(false); reload(); alert("Salvo com sucesso!");
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12 w-full">
      <header className="mb-8">
        <h2 className="font-display text-3xl font-bold">Configurações</h2>
        <p className="text-muted-foreground mt-2">Personalize a identidade visual da sua loja, contatos e informações públicas.</p>
      </header>

      <form onSubmit={salvar} className="space-y-8">
        
        {/* Identidade Visual */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><ImageIcon size={22} className="text-primary"/> Identidade Visual</h3>
            <p className="text-sm text-muted-foreground mt-1">Imagens que representam sua marca. Faça upload dos arquivos.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 bg-background p-6 rounded-2xl border border-border">
              <ImageUpload label="Logo da Loja" value={form?.logo_url} onChange={(url) => setForm({...form, logo_url: url})} />
              <p className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg">Recomendado: Imagem quadrada (ex: 400x400px ou 500x500px). Aparece no topo e nas redes sociais.</p>
            </div>
            <div className="space-y-3 bg-background p-6 rounded-2xl border border-border">
              <ImageUpload label="Banner de Fundo (Capa)" value={form?.capa_url} onChange={(url) => setForm({...form, capa_url: url})} />
              <p className="text-xs text-muted-foreground bg-secondary p-3 rounded-lg">Recomendado: 1920x1080px (horizontal) para Computadores, adaptável para Celulares. Fica atrás da sua logo.</p>
            </div>
          </div>
        </section>

        {/* Informações da Loja */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Informações Principais</h3>
            <p className="text-sm text-muted-foreground mt-1">Os dados que aparecem na página inicial da loja para seus clientes.</p>
          </div>
        {/* Categorias */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Categorias da Loja</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie categorias para facilitar o cadastro de produtos depois.</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(form?.categorias_padrao || []).map((cat: string, i: number) => (
                <div key={i} className="bg-secondary text-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                  {cat}
                  <button type="button" onClick={() => {
                    const newCats = [...(form.categorias_padrao || [])];
                    newCats.splice(i, 1);
                    setForm({...form, categorias_padrao: newCats});
                  }} className="text-muted-foreground hover:text-destructive"><X size={16}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input id="new-cat" placeholder="Nova categoria..." className="flex-1 border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-base" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !(form?.categorias_padrao || []).includes(val)) {
                    setForm({...form, categorias_padrao: [...(form?.categorias_padrao || []), val]});
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}/>
              <button type="button" onClick={() => {
                const input = document.getElementById('new-cat') as HTMLInputElement;
                const val = input.value.trim();
                if (val && !(form?.categorias_padrao || []).includes(val)) {
                  setForm({...form, categorias_padrao: [...(form?.categorias_padrao || []), val]});
                  input.value = '';
                }
              }} className="bg-secondary text-foreground px-4 rounded-xl font-bold hover:bg-border transition-colors">Adicionar</button>
            </div>
          </div>
        </section>

          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Nome do Negócio</span>
              <input required value={form?.nome||''} onChange={e=>setForm({...form,nome:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-base"/>
            </label>
            
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Descrição da Loja</span>
              <textarea value={form?.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={3} className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-base" placeholder="Conte um pouco sobre o que você vende, seus diferenciais..."/>
            </label>
          </div>
        </section>

        {/* Atendimento */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Phone size={22} className="text-primary"/> Atendimento</h3>
            <p className="text-sm text-muted-foreground mt-1">Como os clientes entrarão em contato para finalizar pedidos e tirar dúvidas.</p>
          </div>
        {/* Categorias */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Categorias da Loja</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie categorias para facilitar o cadastro de produtos depois.</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(form?.categorias_padrao || []).map((cat: string, i: number) => (
                <div key={i} className="bg-secondary text-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
                  {cat}
                  <button type="button" onClick={() => {
                    const newCats = [...(form.categorias_padrao || [])];
                    newCats.splice(i, 1);
                    setForm({...form, categorias_padrao: newCats});
                  }} className="text-muted-foreground hover:text-destructive"><X size={16}/></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input id="new-cat" placeholder="Nova categoria..." className="flex-1 border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-base" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !(form?.categorias_padrao || []).includes(val)) {
                    setForm({...form, categorias_padrao: [...(form?.categorias_padrao || []), val]});
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}/>
              <button type="button" onClick={() => {
                const input = document.getElementById('new-cat') as HTMLInputElement;
                const val = input.value.trim();
                if (val && !(form?.categorias_padrao || []).includes(val)) {
                  setForm({...form, categorias_padrao: [...(form?.categorias_padrao || []), val]});
                  input.value = '';
                }
              }} className="bg-secondary text-foreground px-4 rounded-xl font-bold hover:bg-border transition-colors">Adicionar</button>
            </div>
          </div>
        </section>

          <div className="space-y-6">
            <label className="block max-w-md">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Número do WhatsApp para Receber Pedidos</span>
              <input required value={form?.contato||''} onChange={e=>setForm({...form,contato:e.target.value})} placeholder="Ex: 5511999999999" className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background font-mono text-base"/>
              <p className="text-xs text-muted-foreground mt-2 bg-secondary p-3 rounded-lg">Importante: Coloque o código do país (55) + DDD + número. Apenas números, sem traços ou parênteses.</p>
            </label>
          </div>
        </section>
        
        <div className="flex justify-end pt-2">
          <button disabled={salvando} type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-brand-hover shadow-md hover:shadow-lg flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
            {salvando && <Loader2 className="animate-spin" size={24} />}
            {salvando ? "Salvando Alterações..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}