const fs = require('fs');

function applyPatch(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched ' + file);
  } else {
    console.log('Search string not found in ' + file);
  }
}

// 1. ViewConfiguracoes.tsx
let vConfig = fs.readFileSync('src/components/admin/ViewConfiguracoes.tsx', 'utf8');
const searchConfig = '        {/* Categorias */}';
const replaceConfig = \        {/* Horários de Funcionamento */}
        <section className="bg-surface border border-border p-8 rounded-3xl shadow-sm hover:shadow-soft transition-shadow">
          <div className="mb-6 pb-4 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Store size={22} className="text-primary"/> Horário de Funcionamento</h3>
            <p className="text-sm text-muted-foreground mt-1">Defina quando sua loja está aberta para receber pedidos.</p>
          </div>
          
          <div className="space-y-4 mb-6">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, idx) => {
              const h = (form?.horarios_funcionamento || {})[idx] || { ativo: true, abre: '18:00', fecha: '23:00' };
              return (
                <div key={idx} className={\lex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-colors \\}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={h.ativo} className="size-5 rounded border-border text-primary focus:ring-primary" onChange={(e) => {
                      const newH = { ...(form?.horarios_funcionamento || {}) };
                      newH[idx] = { ...h, ativo: e.target.checked };
                      setForm({...form, horarios_funcionamento: newH});
                    }}/>
                    <span className="font-bold w-24">{dia}</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <input type="time" disabled={!h.ativo} value={h.abre} onChange={(e) => {
                      const newH = { ...(form?.horarios_funcionamento || {}) };
                      newH[idx] = { ...h, abre: e.target.value };
                      setForm({...form, horarios_funcionamento: newH});
                    }} className="border border-border rounded-lg px-3 py-2 bg-surface outline-none focus:border-primary disabled:opacity-50"/>
                    <span className="text-muted-foreground font-medium">até</span>
                    <input type="time" disabled={!h.ativo} value={h.fecha} onChange={(e) => {
                      const newH = { ...(form?.horarios_funcionamento || {}) };
                      newH[idx] = { ...h, fecha: e.target.value };
                      setForm({...form, horarios_funcionamento: newH});
                    }} className="border border-border rounded-lg px-3 py-2 bg-surface outline-none focus:border-primary disabled:opacity-50"/>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-foreground">Permitir Agendamentos?</h4>
              <p className="text-sm text-muted-foreground mt-1">Se ativado, clientes podem fazer pedidos mesmo fora do horário (serão marcados como agendados). Se desativado, o carrinho será bloqueado fora do horário.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" checked={form?.permitir_agendamento || false} onChange={e => setForm({...form, permitir_agendamento: e.target.checked})} />
              <div className="w-14 h-7 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </section>

        {/* Categorias */}
\;
if(vConfig.includes(searchConfig)){
  vConfig = vConfig.replace(searchConfig, replaceConfig);
  fs.writeFileSync('src/components/admin/ViewConfiguracoes.tsx', vConfig, 'utf8');
  console.log('Patched ViewConfiguracoes.tsx');
}

// 2. ViewPedidos.tsx
applyPatch('src/components/admin/ViewPedidos.tsx',
  \import { Search, Filter, CheckCircle2, Loader2, Calendar } from "lucide-react";\,
  \import { Search, Filter, CheckCircle2, Loader2, Calendar, CalendarClock } from "lucide-react";\
);
applyPatch('src/components/admin/ViewPedidos.tsx',
  \<option value="todos">Todos os Status</option>\,
  \<option value="todos">Todos os Status</option>\\n          <option value="agendados">Somente Agendados</option>\
);
applyPatch('src/components/admin/ViewPedidos.tsx',
  \const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;\,
  \const matchStatus = filtroStatus === "todos" || (filtroStatus === "agendados" ? p.agendado : p.status === filtroStatus);\
);
applyPatch('src/components/admin/ViewPedidos.tsx',
  \<p className="font-bold text-foreground">{p.cliente_nome}</p>\,
  \<p className="font-bold text-foreground flex items-center gap-2">{p.cliente_nome} {p.agendado && <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CalendarClock size={10}/> Agendamento</span>}</p>\
);

// 3. ViewDashboard.tsx
applyPatch('src/components/admin/ViewDashboard.tsx',
  \import { Store, ShoppingBag, Clock, Users, Target } from "lucide-react";\,
  \import { Store, ShoppingBag, Clock, Users, Target, CalendarClock } from "lucide-react";\
);
applyPatch('src/components/admin/ViewDashboard.tsx',
  \const pendentes = pedidos.filter(p => p.status === 'pendente').length;\,
  \const pendentes = pedidos.filter(p => p.status === 'pendente').length;\\n  const agendados = pedidos.filter(p => p.agendado).length;\
);
applyPatch('src/components/admin/ViewDashboard.tsx',
  \<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">\,
  \<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">\
);
applyPatch('src/components/admin/ViewDashboard.tsx',
  \<div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:scale-110 transition-transform"><Users size={100}/></div>\,
  \<div className="absolute -right-6 -top-6 text-amber-500/5 group-hover:scale-110 transition-transform"><CalendarClock size={100}/></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><CalendarClock size={24}/></div>
            <p className="font-semibold text-muted-foreground">Agendados</p>
          </div>
          <p className="font-display text-4xl font-bold text-foreground relative z-10">{agendados}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:scale-110 transition-transform"><Users size={100}/></div>\
);

// 4. c..tsx
applyPatch('src/routes/c..tsx',
  \import { ShoppingBag, Search, ExternalLink, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Info, Minus, Plus, Package, Weight } from "lucide-react";\,
  \import { ShoppingBag, Search, ExternalLink, Menu, X, MessageCircle, ChevronLeft, ChevronRight, Info, Minus, Plus, Package, Weight, Clock, CalendarClock } from "lucide-react";\
);
applyPatch('src/routes/c..tsx',
  \<h1 className="text-3xl md:text-4xl font-display font-bold">{catalogo.nome}</h1>\,
  \<div className="flex flex-col md:flex-row items-center md:items-end gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold">{catalogo.nome}</h1>
              {(() => {
                let isOpen = true;
                if (catalogo.horarios_funcionamento) {
                  const hoje = new Date();
                  const dia = hoje.getDay();
                  const h = catalogo.horarios_funcionamento[dia];
                  if (!h || !h.ativo) isOpen = false;
                  else {
                    const agora = hoje.getHours() * 60 + hoje.getMinutes();
                    const [abreH, abreM] = (h.abre||'00:00').split(':').map(Number);
                    const [fechaH, fechaM] = (h.fecha||'23:59').split(':').map(Number);
                    const minAbre = abreH * 60 + abreM;
                    const minFecha = fechaH * 60 + fechaM;
                    if (minFecha < minAbre) isOpen = agora >= minAbre || agora <= minFecha;
                    else isOpen = agora >= minAbre && agora <= minFecha;
                  }
                }
                return isOpen ? (
                  <span className="bg-sage/20 text-sage border border-sage/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm"><Clock size={14}/> Aberto Agora</span>
                ) : (
                  <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-sm"><Clock size={14}/> Fechado</span>
                );
              })()}
            </div>\
);
applyPatch('src/routes/c..tsx',
  \unction CartDrawer({ catalogo }: { catalogo: any }) {\,
  \unction CartDrawer({ catalogo }: { catalogo: any }) {
  let isOpen = true;
  if (catalogo.horarios_funcionamento) {
    const hoje = new Date();
    const dia = hoje.getDay();
    const h = catalogo.horarios_funcionamento[dia];
    if (!h || !h.ativo) isOpen = false;
    else {
      const agora = hoje.getHours() * 60 + hoje.getMinutes();
      const [abreH, abreM] = (h.abre||'00:00').split(':').map(Number);
      const [fechaH, fechaM] = (h.fecha||'23:59').split(':').map(Number);
      const minAbre = abreH * 60 + abreM;
      const minFecha = fechaH * 60 + fechaM;
      if (minFecha < minAbre) isOpen = agora >= minAbre || agora <= minFecha;
      else isOpen = agora >= minAbre && agora <= minFecha;
    }
  }

  const isAgendamento = !isOpen && catalogo.permitir_agendamento;
  const isBloqueado = !isOpen && !catalogo.permitir_agendamento;\
);
applyPatch('src/routes/c..tsx',
  \const { error } = await supabase.from("pedidos").insert({\,
  \const { error } = await supabase.from("pedidos").insert({
        agendado: isAgendamento,\
);
applyPatch('src/routes/c..tsx',
  \const mensagem = \\\Olá! Gostaria de fazer o seguinte pedido:\\n\\n\\\n\\nTotal: *\*\\n\\n*Meus dados:*\\nNome: \\\nWhatsApp: \\\nEndereço: \\\\;\,
  \const textoIntro = isAgendamento ? 'Olá! Gostaria de AGENDAR o seguinte pedido para quando a loja abrir' : 'Olá! Gostaria de fazer o seguinte pedido';
      const mensagem = \\\\:\\n\\n\\\n\\nTotal: *\*\\n\\n*Meus dados:*\\nNome: \\\nWhatsApp: \\\nEndereço: \\\\;\
);
applyPatch('src/routes/c..tsx',
  \<button disabled={loading} type="submit" className="w-full p-5 rounded-2xl bg-primary hover:bg-brand-hover text-white font-bold flex justify-center items-center gap-3 mt-6 shadow-[0_4px_14px_rgba(0,0,0,0.2)] shadow-primary/40 transition-transform active:scale-95 disabled:opacity-50 text-lg">
                    {loading ? "Enviando..." : <><MessageCircle size={22}/> Finalize o pedido enviando para o WhatsApp</>}
                  </button>\,
  \{isBloqueado ? (
                    <div className="w-full p-5 rounded-2xl bg-secondary text-muted-foreground font-bold flex justify-center items-center gap-3 mt-6 border border-border">
                      <Clock size={22}/> A Loja está fechada no momento
                    </div>
                  ) : (
                  <button disabled={loading} type="submit" className={\w-full p-5 rounded-2xl text-white font-bold flex justify-center items-center gap-3 mt-6 shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-transform active:scale-95 disabled:opacity-50 text-lg \\}>
                    {loading ? "Enviando..." : isAgendamento ? <><CalendarClock size={22}/> Agendar via WhatsApp</> : <><MessageCircle size={22}/> Finalize o pedido enviando para o WhatsApp</>}
                  </button>
                  )}\
);
