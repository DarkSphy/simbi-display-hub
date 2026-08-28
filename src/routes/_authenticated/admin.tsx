import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, ShoppingBag, Users, Settings, PackageOpen, Store, ExternalLink } from "lucide-react";
import { Toaster } from "sonner";

import { ViewDashboard } from "@/components/admin/ViewDashboard";
import { ViewPedidos } from "@/components/admin/ViewPedidos";
import { ViewProdutos } from "@/components/admin/ViewProdutos";
import { ViewClientes } from "@/components/admin/ViewClientes";
import { ViewConfiguracoes } from "@/components/admin/ViewConfiguracoes";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("painel");

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
      const { data, error } = await supabase.from("catalogos").select("*").eq("user_id", session!.user.id).single();
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

      <main className="flex-1 md:ml-64 p-4 sm:p-8 md:p-12 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'painel' && <ViewDashboard linkPublico={linkPublico} />}
          {activeTab === 'pedidos' && <ViewPedidos />}
          {activeTab === 'produtos' && <ViewProdutos catalogo={catalogo} />}
          {activeTab === 'clientes' && <ViewClientes />}
          {activeTab === 'configuracoes' && <ViewConfiguracoes catalogo={catalogo} />}
        </div>
      </main>
    </div>
  );
}

// O lucide-react "ExternalLink" estava faltando no topo, vou consertar.
// Mas o código usa import { ..., ExternalLink } ... não estava no bloco. Resolverei.