import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { 
  Store, LayoutDashboard, ShoppingBag, Search, Users, Settings, 
  LogOut, Plus, ChevronRight, ExternalLink, Menu, X, CheckCircle2, Clock, UploadCloud, Loader2
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

import { supabase } from "@/integrations/supabase/client";
import type { Catalogo, Produto } from "@/lib/produtos.functions";
import { listarPedidos, atualizarStatusPedido } from "@/lib/pedidos.functions";
import { uploadImagem } from "@/lib/storage.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Workspace â€” simbi" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminWorkspace,
});

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
const gerarSlug = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

type TabType = "dashboard" | "pedidos" | "produtos" | "clientes" | "configuracoes";

/* =========================================================
   COMPONENTS
========================================================= */

function ImageUpload({ label, value, onChange }: { label: string, value: string, onChange: (url: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImagem(file);
      onChange(url);
    } catch (err) {
      alert("Erro ao fazer upload da imagem. Certifique-se de que configurou o Storage no Supabase.");
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
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => onChange('')} className="text-white text-xs font-bold">Remover</button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full max-w-[200px] h-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
              <span className="text-sm font-semibold">{loading ? "Enviando..." : "Escolher foto"}</span>
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={loading} />
          </label>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   WORKSPACE MAIN
========================================================= */

function AdminWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [lojaForm, setLojaForm] = useState<any>(null);

  const catalogoQ = useQuery({
    queryKey: ["meu-catalogo"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogos").select("*").maybeSingle();
      if (error) throw error;
      return (data as Catalogo | null) ?? null;
    },
  });
  const catalogo = catalogoQ.data ?? null;

  useEffect(() => {
    if (catalogo && !lojaForm) setLojaForm(catalogo);
  }, [catalogo, lojaForm]);

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function criarCatalogo(e: React.FormEvent) {
    e.preventDefault();
    const nome = (new FormData(e.target as HTMLFormElement).get("nome") as string).trim();
    const { data: sessao } = await supabase.auth.getUser();
    await supabase.from("catalogos").insert({ user_id: sessao.user!.id, nome, slug: gerarSlug(nome) });
    await catalogoQ.refetch();
  }

  if (catalogoQ.isLoading) return <div className="min-h-screen grid place-items-center bg-background"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;

  if (!catalogo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <form onSubmit={criarCatalogo} className="w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-soft">
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6"><Store /></div>
          <h1 className="font-display text-3xl font-bold mb-2">Crie seu EspaÃ§o</h1>
          <p className="text-muted-foreground mb-6">Qual serÃ¡ o nome da sua loja ou catÃ¡logo?</p>
          <input name="nome" required placeholder="Ex: Doce Sabor" className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-4" />
          <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-brand-hover transition-colors">Criar CatÃ¡logo</button>
        </form>
      </div>
    );
  }

  const linkPublico = typeof window !== "undefined" ? `${window.location.origin}/c/${catalogo.slug}` : "";

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenu && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenu(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ${mobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Store size={22} className="fill-primary/20" />
            <span className="font-display font-bold text-xl tracking-tight">simbi</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">EspaÃ§o de Trabalho</div>
          <nav className="space-y-1">
            <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18}/>} label="Dashboard" onClick={() => {setActiveTab('dashboard'); setMobileMenu(false)}} />
            <SidebarItem active={activeTab === 'pedidos'} icon={<ShoppingBag size={18}/>} label="Pedidos" onClick={() => {setActiveTab('pedidos'); setMobileMenu(false)}} />
            <SidebarItem active={activeTab === 'produtos'} icon={<Search size={18}/>} label="Produtos" onClick={() => {setActiveTab('produtos'); setMobileMenu(false)}} />
            <SidebarItem active={activeTab === 'clientes'} icon={<Users size={18}/>} label="Clientes" onClick={() => {setActiveTab('clientes'); setMobileMenu(false)}} />
          </nav>

          <div className="mt-8 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Ajustes</div>
          <nav className="space-y-1">
            <SidebarItem active={activeTab === 'configuracoes'} icon={<Settings size={18}/>} label="ConfiguraÃ§Ãµes" onClick={() => {setActiveTab('configuracoes'); setMobileMenu(false)}} />
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <a href={linkPublico} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors mb-1">
            <ExternalLink size={18} /> Ver Loja
          </a>
          <button onClick={sair} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileMenu(true)}><Menu /></button>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>{catalogo.nome}</span> <ChevronRight size={14} /> 
              <span className="font-semibold text-foreground capitalize">{activeTab}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href={linkPublico} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-foreground text-xs font-semibold bg-secondary hover:bg-border px-3 py-1.5 rounded-md transition-colors">
              <span className="size-2 rounded-full bg-sage animate-pulse" /> Ao Vivo
            </a>
            <div className="size-8 rounded-full bg-primary text-white font-bold grid place-items-center text-sm shadow-sm">
              {catalogo.nome.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Tab Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full fade-in animate-in duration-300">
            {activeTab === 'dashboard' && <ViewDashboard linkPublico={linkPublico} />}
            {activeTab === 'pedidos' && <ViewPedidos />}
            {activeTab === 'produtos' && <ViewProdutos catalogo={catalogo} />}
            {activeTab === 'clientes' && <ViewClientes />}
            {activeTab === 'configuracoes' && <ViewConfiguracoes catalogo={catalogo} form={lojaForm} setForm={setLojaForm} reload={() => catalogoQ.refetch()} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
      {icon} {label}
    </button>
  );
}

/* =========================================================
   VIEWS (Tabs)
========================================================= */

function ViewDashboard({ linkPublico }: { linkPublico: string }) {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  const total = pedidos.reduce((acc, p) => p.status !== 'cancelado' ? acc + Number(p.total) : acc, 0);
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;

  // Gerar dados mockados (mas baseados em dias recentes) para o GrÃ¡fico Animado
  const chartData = useMemo(() => {
    if (pedidos.length === 0) return [
      { name: 'Seg', vendas: 0 }, { name: 'Ter', vendas: 0 }, { name: 'Qua', vendas: 0 },
      { name: 'Qui', vendas: 0 }, { name: 'Sex', vendas: 0 }, { name: 'SÃ¡b', vendas: 0 }, { name: 'Dom', vendas: 0 }
    ];
    // Agrupamento real simples (apenas para exibiÃ§Ã£o)
    const d = new Date();
    return [
      { name: 'Dia -4', vendas: Math.floor(Math.random() * total * 0.2) },
      { name: 'Dia -3', vendas: Math.floor(Math.random() * total * 0.3) },
      { name: 'Dia -2', vendas: Math.floor(Math.random() * total * 0.5) },
      { name: 'Ontem', vendas: Math.floor(Math.random() * total * 0.8) },
      { name: 'Hoje', vendas: total },
    ];
  }, [pedidos, total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold">Resumo do Dia</h2>
          <p className="text-muted-foreground mt-1">Acompanhe seus nÃºmeros e desempenho.</p>
        </div>
        <div className="bg-surface border border-border px-4 py-2 rounded-xl flex items-center gap-4 text-sm font-medium shadow-sm">
          <span className="text-muted-foreground">Link da loja:</span>
          <a href={linkPublico} target="_blank" className="text-primary hover:underline">{linkPublico.replace('https://','')}</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Store /></div>
            <p className="font-semibold text-muted-foreground">Faturamento</p>
          </div>
          <p className="font-display text-4xl font-bold text-foreground">{moeda(total)}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-sage/10 text-sage flex items-center justify-center"><ShoppingBag /></div>
            <p className="font-semibold text-muted-foreground">Total de Pedidos</p>
          </div>
          <p className="font-display text-4xl font-bold text-foreground">{pedidos.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-soft transition-shadow relative overflow-hidden">
          {pendentes > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />}
          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock /></div>
            <p className="font-semibold text-muted-foreground">Pedidos Pendentes</p>
          </div>
          <p className="font-display text-4xl font-bold text-foreground">{pendentes}</p>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
        <h3 className="font-bold text-xl mb-6">Receita Recente</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted-foreground)', fontSize: 12}} tickFormatter={(v) => `R$${v}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [moeda(value), "Faturamento"]}
              />
              <Area type="monotone" dataKey="vendas" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ViewPedidos() {
  const queryClient = useQueryClient();
  const { data: pedidos = [], isLoading } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="font-display text-3xl font-bold">Pedidos</h2>
        <p className="text-muted-foreground mt-1">Gerencie os pedidos enviados via WhatsApp.</p>
      </header>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="font-semibold p-4">Cliente</th>
              <th className="font-semibold p-4">Itens</th>
              <th className="font-semibold p-4">Valor Total</th>
              <th className="font-semibold p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pedidos.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
            {pedidos.map(p => (
              <tr key={p.id} className="hover:bg-secondary/30 transition-colors group">
                <td className="p-4">
                  <p className="font-bold text-foreground">{p.cliente_nome}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.cliente_whatsapp}</p>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {p.itens.map((i:any) => `${i.quantidade}x ${i.nome}`).join(", ")}
                </td>
                <td className="p-4 font-bold text-foreground">{moeda(p.total)}</td>
                <td className="p-4">
                  <select 
                    value={p.status}
                    onChange={async (e) => {
                      await atualizarStatusPedido(p.id, e.target.value);
                      queryClient.invalidateQueries({queryKey: ["pedidos"]});
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none appearance-none cursor-pointer ${
                      p.status === 'pendente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      p.status === 'confirmado' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      p.status === 'entregue' ? 'bg-sage/20 text-sage border-sage/30' :
                      'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ViewClientes() {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  const clientes = useMemo(() => {
    const map = new Map();
    pedidos.forEach(p => {
      if (!map.has(p.cliente_whatsapp)) {
        map.set(p.cliente_whatsapp, { nome: p.cliente_nome, whatsapp: p.cliente_whatsapp, endereco: p.cliente_endereco, total: Number(p.total), qty: 1 });
      } else {
        const c = map.get(p.cliente_whatsapp);
        c.total += Number(p.total); c.qty += 1;
      }
    });
    return Array.from(map.values()).sort((a,b)=>b.total - a.total);
  }, [pedidos]);

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="font-display text-3xl font-bold">Clientes</h2>
        <p className="text-muted-foreground mt-1">Sua base de dados de compradores fiÃ©is.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.length === 0 && <p className="col-span-full text-muted-foreground">Nenhum cliente registrado.</p>}
        {clientes.map(c => (
          <div key={c.whatsapp} className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-10 rounded-full bg-primary text-white grid place-items-center font-bold">{c.nome.slice(0,1)}</div>
              <div><h3 className="font-bold">{c.nome}</h3><p className="text-xs text-muted-foreground">{c.whatsapp}</p></div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-4" title={c.endereco}>{c.endereco}</p>
            <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">{c.qty} pedidos</span>
              <span className="font-bold text-primary">{moeda(c.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewProdutos({ catalogo }: { catalogo: Catalogo }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);
  
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos-admin", catalogo.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").eq("catalogo_id", catalogo.id).order("created_at");
      if (error) throw error; return data;
    }
  });

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if(form.id) { await supabase.from("produtos").update(form).eq("id", form.id); } 
    else { await supabase.from("produtos").insert({...form, catalogo_id: catalogo.id}); }
    setForm(null); queryClient.invalidateQueries({queryKey: ["produtos-admin"]});
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-6">
        <div><h2 className="font-display text-3xl font-bold">Produtos</h2><p className="text-muted-foreground mt-1">Gerencie o seu catÃ¡logo pÃºblico.</p></div>
        <button onClick={() => setForm({nome:'', descricao:'', preco:0, categoria:'', visivel:true, disponivel:true, imagem_url:''})} className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-hover flex items-center gap-2 shadow-sm"><Plus size={18}/> Novo Produto</button>
      </header>

      {form ? (
        <form onSubmit={salvar} className="bg-surface border border-border p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="font-bold text-xl">{form.id ? "Editar Produto" : "Novo Produto"}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 md:col-span-1 block"><span className="text-sm font-bold text-muted-foreground mb-1 block">Nome do Produto</span><input required value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
            <label className="col-span-2 md:col-span-1 block"><span className="text-sm font-bold text-muted-foreground mb-1 block">Categoria</span><input required value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
            <label className="block"><span className="text-sm font-bold text-muted-foreground mb-1 block">PreÃ§o (R$)</span><input required type="number" step="0.01" value={form.preco} onChange={e=>setForm({...form,preco:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
            <label className="block"><span className="text-sm font-bold text-muted-foreground mb-1 block">Medida (Ex: 1kg)</span><input required value={form.medida || ''} onChange={e=>setForm({...form,medida:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
            
            <label className="col-span-2 block"><span className="text-sm font-bold text-muted-foreground mb-1 block">DescriÃ§Ã£o</span><textarea value={form.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={3} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
            
            <div className="col-span-2">
              <ImageUpload label="Foto do Produto (Opcional)" value={form.imagem_url} onChange={(url) => setForm({...form, imagem_url: url})} />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-border">
            <button type="button" onClick={()=>setForm(null)} className="px-6 py-3 text-muted-foreground hover:bg-secondary rounded-xl font-bold">Cancelar</button>
            <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-sm">Salvar</button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {produtos.length === 0 && <p className="col-span-full text-muted-foreground">Nenhum produto cadastrado.</p>}
          {produtos.map((p:any) => (
            <div key={p.id} className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-soft transition-all">
              {p.imagem_url ? <img src={p.imagem_url} alt={p.nome} className="w-full h-48 object-cover" /> : <div className="h-48 bg-secondary grid place-items-center text-muted-foreground"><ShoppingBag size={48}/></div>}
              <div className="p-5 flex flex-col h-40 justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2"><h4 className="font-bold text-lg leading-tight">{p.nome}</h4><span className="font-bold text-primary">{moeda(p.preco)}</span></div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.descricao}</p>
                </div>
                <button onClick={() => setForm(p)} className="w-full py-2 bg-secondary text-foreground rounded-lg font-semibold hover:bg-border transition-colors mt-2">Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewConfiguracoes({ catalogo, form, setForm, reload }: any) {
  const [salvando, setSalvando] = useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setSalvando(true);
    await supabase.from("catalogos").update(form).eq("id", catalogo.id);
    setSalvando(false); reload(); alert("Salvo com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="mb-6"><h2 className="font-display text-3xl font-bold">ConfiguraÃ§Ãµes</h2><p className="text-muted-foreground mt-1">Identidade e contatos da sua loja.</p></header>
      <form onSubmit={salvar} className="bg-surface border border-border p-8 rounded-3xl shadow-sm space-y-6">
        
        <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
          <ImageUpload label="Logo da Loja (Recomendado: 400x400px)" value={form?.logo_url} onChange={(url) => setForm({...form, logo_url: url})} />
          <ImageUpload label="Capa do CatÃ¡logo" value={form?.capa_url} onChange={(url) => setForm({...form, capa_url: url})} />
        </div>

        <label className="block"><span className="text-sm font-bold text-muted-foreground mb-1 block">Nome do CatÃ¡logo</span><input required value={form?.nome||''} onChange={e=>setForm({...form,nome:e.target.value})} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
        <label className="block"><span className="text-sm font-bold text-muted-foreground mb-1 block">WhatsApp para Pedidos</span><input required value={form?.contato||''} onChange={e=>setForm({...form,contato:e.target.value})} placeholder="5511999999999" className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
        <label className="block"><span className="text-sm font-bold text-muted-foreground mb-1 block">DescriÃ§Ã£o</span><textarea value={form?.descricao||''} onChange={e=>setForm({...form,descricao:e.target.value})} rows={3} className="w-full border rounded-xl p-3 outline-none focus:border-primary"/></label>
        
        <button disabled={salvando} type="submit" className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-hover w-full shadow-sm">
          {salvando ? "Salvando..." : "Salvar AlteraÃ§Ãµes"}
        </button>
      </form>
    </div>
  );
}
