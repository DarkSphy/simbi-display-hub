import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, ShoppingBag, Users, Settings, PackageOpen, Store, ExternalLink, ZoomIn, ZoomOut, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";

import { ViewDashboard } from "@/components/admin/ViewDashboard";
import { ViewPedidos } from "@/components/admin/ViewPedidos";
import { ViewProdutos } from "@/components/admin/ViewProdutos";
import { ViewClientes } from "@/components/admin/ViewClientes";
import { ViewConfiguracoes } from "@/components/admin/ViewConfiguracoes";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel | Simbi" },
      { name: "description", content: "Gerencie seu catálogo, produtos, pedidos e configurações na Simbi." },
      { property: "og:title", content: "Painel | Simbi" },
      { property: "og:description", content: "Gerencie seu catálogo, produtos, pedidos e configurações na Simbi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("painel");
  const [zoomPercent, setZoomPercent] = useState(100);
  const [zoomHydrated, setZoomHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('simbi_zoom');
    const parsed = saved ? Number.parseInt(saved, 10) : 100;
    if (Number.isFinite(parsed)) setZoomPercent(parsed);
    setZoomHydrated(true);
  }, []);

  useEffect(() => {
    if (!zoomHydrated) return;
    localStorage.setItem('simbi_zoom', zoomPercent.toString());
    document.documentElement.style.fontSize = `${(zoomPercent / 100) * 16}px`;
  }, [zoomHydrated, zoomPercent]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });

  const { data: catalogo, isLoading } = useQuery({
    queryKey: ["meu-catalogo", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const userId = session?.user?.id;
      if (!userId) return null;
      const { data, error } = await supabase.from("catalogos").select("*").eq("user_id", userId).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (isLoading) return <div className="min-h-screen grid place-items-center bg-background"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
  if (!catalogo) return <div className="min-h-screen grid place-items-center bg-background"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Bem-vindo(a)!</h2><p>Você precisa criar sua loja primeiro.</p></div></div>;

  const linkPublico = `https://simbi-display-hub.lovable.app/c/${catalogo.slug}`;

  const tabs = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: PackageOpen },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface border-r border-border flex flex-col md:fixed md:h-screen md:left-0 top-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Store className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">simbi</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">ESPAÇO DE TRABALHO</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition-all ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
              >
                <Icon size={20} className={active ? "text-white" : "opacity-70"} />
                {t.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          {/* CONTROLES DE INTERFACE (MOVidos DE VOLTA PARA A SIDEBAR COMO ANTES) */}
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-2xl mb-2">
            <span className="text-sm font-semibold text-muted-foreground mr-1">Zoom:</span>
            <button type="button" onClick={() => setZoomPercent(prev => Math.max(20, prev - 10))} className="p-1.5 text-muted-foreground hover:bg-background hover:text-foreground rounded-lg transition-colors bg-background/50 border border-border shadow-sm"><ZoomOut size={16}/></button>
            <span className="text-sm font-bold font-mono w-10 text-center text-foreground">{zoomPercent}%</span>
            <button type="button" onClick={() => setZoomPercent(prev => Math.min(200, prev + 10))} className="p-1.5 text-muted-foreground hover:bg-background hover:text-foreground rounded-lg transition-colors bg-background/50 border border-border shadow-sm"><ZoomIn size={16}/></button>
          </div>
          
          <button type="button" onClick={() => setIsDark(prev => !prev)} className="flex items-center justify-center gap-2 bg-secondary/50 px-4 py-2.5 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground transition-all w-full mb-4">
            {isDark ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-primary"/>}
            {isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          </button>

          <a href={linkPublico} target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all font-semibold w-full">
            <ExternalLink size={20} className="opacity-70" />
            Ver Loja
          </a>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-all font-semibold w-full text-left mt-2">
            <LogOut size={20} className="opacity-70" />
            Sair da conta
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <div className="p-4 sm:p-8 md:p-12 flex-1">
          <div className="max-w-6xl mx-auto">
          {activeTab === 'painel' && <ViewDashboard linkPublico={linkPublico} />}
          {activeTab === 'pedidos' && <ViewPedidos />}
          {activeTab === 'produtos' && <ViewProdutos catalogo={catalogo} />}
          {activeTab === 'clientes' && <ViewClientes />}
          {activeTab === 'configuracoes' && <ViewConfiguracoes catalogo={catalogo} reload={() => queryClient.invalidateQueries({ queryKey: ["meu-catalogo"] })} />}
          </div>
        </div>
      </main>
    </div>
  );
}