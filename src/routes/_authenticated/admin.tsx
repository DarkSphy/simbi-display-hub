import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, ShoppingBag, Users, Settings, PackageOpen, Store, ExternalLink, ZoomIn, ZoomOut, Moon, Sun, Archive } from "lucide-react";
import { Toaster } from "sonner";

import { ViewDashboard } from "@/components/admin/ViewDashboard";
import { ViewPedidos } from "@/components/admin/ViewPedidos";
import { ViewProdutos } from "@/components/admin/ViewProdutos";
import { ViewClientes } from "@/components/admin/ViewClientes";
import { ViewConfiguracoes } from "@/components/admin/ViewConfiguracoes";
import { ViewEstoque } from "@/components/admin/ViewEstoque";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("painel");
  const queryClient = useQueryClient();

  const [zoom, setZoom] = useState(100);
  const [theme, setTheme] = useState('light');

  // Load from LocalStorage safely on mount
  useEffect(() => {
    try {
      const savedZoom = localStorage.getItem('simbi_zoom');
      if (savedZoom) {
        const p = parseInt(savedZoom, 10);
        if (!isNaN(p)) {
          setZoom(p);
          document.documentElement.style.fontSize = `${(p / 100) * 16}px`;
        }
      }
      
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    } catch(e) {}
  }, []);

  const handleZoom = (change: number) => {
    let next = zoom + change;
    if (next < 20) next = 20;
    if (next > 200) next = 200;
    setZoom(next);
    
    // Garantia absoluta de atualização visual na tela (nuclear bypass)
    const span = document.getElementById('zoom-display-text');
    if (span) span.innerText = next + '%';

    try {
      localStorage.setItem('simbi_zoom', next.toString());
      document.documentElement.style.fontSize = `${(next / 100) * 16}px`;
    } catch(e) {}
  };

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      setTimeout(() => {
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, 0);
      return next;
    });
  }, []);

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

  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!catalogo) return <div className="min-h-screen bg-background text-center pt-20">Você precisa criar sua loja primeiro.</div>;

  const linkPublico = `https://simbi-display-hub.lovable.app/c/${catalogo.slug}`;

  const tabs = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: PackageOpen },
    { id: 'estoque', label: 'Estoque', icon: Archive },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface border-r border-border flex flex-col md:fixed md:h-screen md:left-0 top-0 z-40">
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
        <header className="sticky top-0 z-50 bg-surface border-b border-border p-4 flex justify-end items-center gap-4">
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-sm font-semibold text-muted-foreground mr-1 hidden sm:inline">Zoom:</span>
            <button onClick={() => handleZoom(-10)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg"><ZoomOut size={18}/></button>
            <span id="zoom-display-text" className="text-sm font-bold font-mono w-10 text-center text-primary">{zoom}%</span>
            <button onClick={() => handleZoom(10)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg"><ZoomIn size={18}/></button>
          </div>
          <button onClick={toggleTheme} className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun size={18} className="text-amber-500"/> : <Moon size={18} className="text-primary"/>}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </header>

        <div className="p-4 sm:p-8 md:p-12 flex-1">
          <div className="max-w-6xl mx-auto">
          {activeTab === 'painel' && <ViewDashboard linkPublico={linkPublico} />}
          {activeTab === 'pedidos' && <ViewPedidos />}
          {activeTab === 'produtos' && <ViewProdutos catalogo={catalogo} />}
          {activeTab === 'estoque' && <ViewEstoque catalogo={catalogo} />}
          {activeTab === 'clientes' && <ViewClientes />}
          {activeTab === 'configuracoes' && <ViewConfiguracoes catalogo={catalogo} reload={() => queryClient.invalidateQueries({ queryKey: ["meu-catalogo"] })} />}
          </div>
        </div>
      </main>
    </div>
  );
}