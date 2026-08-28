import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, Phone, Clock, Loader2, X, Palette, Moon, Sun } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export function ViewConfiguracoes({ catalogo, reload }: any) {
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<any>(() => {
    const padrao: any = {};
    for (let i = 0; i < 7; i++) padrao[i] = { ativo: true, abre: '08:00', fecha: '18:00' };
    return { ...catalogo, horarios_funcionamento: catalogo?.horarios_funcionamento ?? padrao };
  });

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setSalvando(true);
    const payload = {
      descricao: form.descricao ?? '',
      logo_url: form.logo_url || null,
      capa_url: form.capa_url || null,
      contato: form.contato ?? '',
      endereco: form.endereco ?? '',
      horario: form.horario ?? '',
      categorias_padrao: form.categorias_padrao ?? [],
      horarios_funcionamento: form.horarios_funcionamento ?? null,
      permitir_agendamento: !!form.permitir_agendamento,
      cor_primaria: form.cor_primaria || null,
      tema_escuro: !!form.tema_escuro,
    };
    const { error } = await supabase.from("catalogos").update(payload).eq("id", catalogo.id);
    setSalvando(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    reload();
  };

  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  return (
    <div className="animate-fade-in space-y-8 pb-12 w-full max-w-4xl">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold">Configurações da Loja</h2>
        <p className="text-muted-foreground mt-1">Personalize as informações, cores, horários e atendimento do seu catálogo.</p>
      </div>

      <form onSubmit={salvar} className="space-y-8">
        {/* Identidade Visual */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Identidade Visual</h3>
            <p className="text-sm text-muted-foreground mt-1">Imagens e textos principais que seus clientes verão primeiro.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            <ImageUpload label="Logo da Loja (Recomendado: 400x400)" value={form?.logo_url||''} onChange={url=>setForm({...form,logo_url:url})} />
            <ImageUpload label="Capa do Catálogo (Recomendado: 1200x400)" value={form?.capa_url||''} onChange={url=>setForm({...form,capa_url:url})} />
          </div>

          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Nome da Loja</span>
              <input disabled value={form?.nome||''} className="w-full border rounded-xl p-3 bg-secondary/50 text-muted-foreground cursor-not-allowed"/>
              <p className="text-xs text-muted-foreground mt-1">O nome da loja e o link não podem ser alterados após a criação.</p>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Descrição Breve (Bio)</span>
              <textarea value={form?.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={3} placeholder="Escreva uma frase de boas-vindas..." className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background resize-none text-base"/>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Endereço Físico (Opcional)</span>
              <input value={form?.endereco||''} onChange={e=>setForm({...form,endereco:e.target.value})} placeholder="Rua, Número, Bairro, Cidade - Estado" className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background text-base"/>
            </label>
          </div>
        </section>

        {/* Cores e Tema */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Palette size={22} className="text-primary"/> Cores e Tema do Catálogo</h3>
            <p className="text-sm text-muted-foreground mt-1">Personalize a aparência dos botões e defina o tema do seu catálogo público.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <span className="text-sm font-bold text-foreground mb-3 block">Cor Primária (Botões e Destaques)</span>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={form?.cor_primaria || '#8E7CFF'} 
                  onChange={e => setForm({...form, cor_primaria: e.target.value})}
                  className="size-14 rounded-xl cursor-pointer border-2 border-border p-1 bg-background"
                />
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={form?.cor_primaria || '#8E7CFF'} 
                    onChange={e => setForm({...form, cor_primaria: e.target.value})}
                    placeholder="#8E7CFF"
                    className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm font-bold text-foreground mb-3 block">Tema do Catálogo</span>
              <div className="flex gap-4">
                <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${!form.tema_escuro ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                  <input type="radio" name="tema" checked={!form.tema_escuro} onChange={() => setForm({...form, tema_escuro: false})} className="sr-only" />
                  <Sun size={24} className="mb-2" />
                  <span className="font-bold text-sm">Tema Claro</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.tema_escuro ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}>
                  <input type="radio" name="tema" checked={form.tema_escuro} onChange={() => setForm({...form, tema_escuro: true})} className="sr-only" />
                  <Moon size={24} className="mb-2" />
                  <span className="font-bold text-sm">Tema Escuro</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Horários */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Clock size={22} className="text-primary"/> Grade de Horários</h3>
              <p className="text-sm text-muted-foreground mt-1">Configure exatamente quando sua loja online estará aberta e aceitando pedidos.</p>
            </div>
            <label className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/20 transition-colors">
              <input type="checkbox" checked={form?.permitir_agendamento || false} onChange={e => setForm({...form, permitir_agendamento: e.target.checked})} className="size-5 rounded border-primary text-primary focus:ring-primary" />
              <div className="flex flex-col">
                <span className="font-bold text-sm text-primary">Aceitar Fora do Horário</span>
                <span className="text-xs text-primary/80">Receber pedidos como "agendado"</span>
              </div>
            </label>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Dia da Semana</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Abertura</th>
                  <th className="px-6 py-4 font-semibold">Fechamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {diasSemana.map((dia, idx) => {
                  const h = (form?.horarios_funcionamento || {})[idx] || { ativo: true, abre: '08:00', fecha: '18:00' };
                  return (
                    <tr key={idx} className={`transition-colors ${h.ativo ? 'bg-background hover:bg-secondary/20' : 'bg-secondary/20'}`}>
                      <td className="px-6 py-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={h.ativo} className="size-5 rounded border-border text-primary focus:ring-primary" onChange={(e) => {
                            const newH = { ...(form?.horarios_funcionamento || {}) };
                            newH[idx] = { ...h, ativo: e.target.checked };
                            setForm({...form, horarios_funcionamento: newH});
                          }}/>
                          <span className={`font-bold text-base ${h.ativo ? 'text-foreground' : 'text-muted-foreground'}`}>{dia}</span>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${h.ativo ? 'bg-sage/10 text-sage' : 'bg-destructive/10 text-destructive'}`}>
                          {h.ativo ? 'Aberto' : 'Fechado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input type="time" disabled={!h.ativo} value={h.abre} onChange={(e) => {
                          const newH = { ...(form?.horarios_funcionamento || {}) };
                          newH[idx] = { ...h, abre: e.target.value };
                          setForm({...form, horarios_funcionamento: newH});
                        }} className={`border rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-base ${h.ativo ? 'bg-surface border-border text-foreground' : 'bg-transparent border-transparent text-muted-foreground cursor-not-allowed opacity-50'}`}/>
                      </td>
                      <td className="px-6 py-4">
                        <input type="time" disabled={!h.ativo} value={h.fecha} onChange={(e) => {
                          const newH = { ...(form?.horarios_funcionamento || {}) };
                          newH[idx] = { ...h, fecha: e.target.value };
                          setForm({...form, horarios_funcionamento: newH});
                        }} className={`border rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono text-base ${h.ativo ? 'bg-surface border-border text-foreground' : 'bg-transparent border-transparent text-muted-foreground cursor-not-allowed opacity-50'}`}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Categorias */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Categorias da Loja</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie categorias para facilitar o cadastro de produtos depois.</p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(form?.categorias_padrao || []).map((cat: string, i: number) => (
                <div key={i} className="bg-secondary text-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm border border-border/50">
                  {cat}
                  <button type="button" onClick={() => {
                    const newCats = [...(form.categorias_padrao || [])];
                    newCats.splice(i, 1);
                    setForm({...form, categorias_padrao: newCats});
                  }} className="text-muted-foreground hover:text-destructive bg-background/50 rounded p-0.5"><X size={16}/></button>
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
              }} className="bg-primary/10 text-primary px-5 rounded-xl font-bold hover:bg-primary/20 transition-colors">Adicionar</button>
            </div>
          </div>
        </section>

        {/* Atendimento */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Phone size={22} className="text-primary"/> Atendimento</h3>
            <p className="text-sm text-muted-foreground mt-1">Como os clientes entrarão em contato para finalizar pedidos e tirar dúvidas.</p>
          </div>

          <div className="space-y-6">
            <label className="block max-w-md">
              <span className="text-sm font-bold text-foreground mb-1.5 block">Número do WhatsApp para Receber Pedidos</span>
              <input required value={form?.contato||''} onChange={e=>setForm({...form,contato:e.target.value})} placeholder="Ex: 5511999999999" className="w-full border rounded-xl p-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background font-mono text-base tracking-wide"/>
              <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 p-3 rounded-lg border border-border/50">Importante: Coloque o código do país (55) + DDD + número. Apenas números, sem traços ou parênteses.</p>
            </label>
          </div>
        </section>
        
        <div className="flex justify-end pt-4 pb-8">
          <button disabled={salvando} type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-brand-hover shadow-lg flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
            {salvando && <Loader2 className="animate-spin" size={24} />}
            {salvando ? "Salvando Alterações..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}