import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Store, MessageCircle, BarChart3, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { data: catalogos = [] } = useQuery({
    queryKey: ["catalogos-publicos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogos").select("*").eq("publicado", true).limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="text-primary size-6" />
            <span className="font-display font-bold text-xl tracking-tight">simbi</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="text-sm font-semibold hover:text-primary transition-colors">Entrar</Link>
            <Link to="/auth" className="bg-foreground text-background text-sm font-bold px-4 py-2 rounded-full hover:bg-foreground/90 transition-transform hover:-translate-y-0.5">Criar Loja</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* BG Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm font-medium mb-8">
            <span className="flex size-2 rounded-full bg-primary animate-pulse" />
            A nova forma de vender online
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight max-w-[18ch] leading-[1.1]">
            Tudo o que você precisa para vender <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">mais e melhor.</span>
          </h1>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Crie um catálogo digital personalizado, permita que seus clientes comprem com um Carrinho integrado ao WhatsApp e gerencie tudo em um Dashboard super completo.
          </p>
          
          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <Link to="/auth" className="bg-primary hover:bg-brand-hover text-white px-8 py-4 rounded-full font-semibold shadow-lg shadow-primary/30 transition-all hover:-translate-y-1 flex items-center gap-2">
              Começar Agora <ArrowRight size={18} />
            </Link>
            <a href="#funcionalidades" className="bg-surface hover:bg-secondary border border-border px-8 py-4 rounded-full font-semibold transition-all">
              Ver Funcionalidades
            </a>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="funcionalidades" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold tracking-tight">Um sistema completo. Sem complicação.</h2>
            <p className="mt-4 text-muted-foreground">Venda produtos físicos ou serviços com uma experiência premium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-background border border-border rounded-3xl p-10 overflow-hidden relative group hover:border-primary/50 transition-colors">
              <div className="relative z-10 max-w-md">
                <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <Store size={24} />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Catálogo com a sua Cara</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Personalize nome, cores, logo e capa. Seu cliente terá uma experiência de loja oficial, em um link próprio (ex: /c/sua-loja).</p>
              </div>
            </div>

            <div className="bg-background border border-border rounded-3xl p-10 relative group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-sage/10 text-sage rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle size={24} />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">Checkout no WhatsApp</h3>
              <p className="text-muted-foreground">O cliente monta o carrinho e o pedido chega pronto e formatado direto no seu número.</p>
            </div>

            <div className="md:col-span-3 bg-foreground text-background rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <div className="size-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 size={24} />
                </div>
                <h3 className="font-display text-3xl font-bold mb-4">Painel Administrativo Completo</h3>
                <p className="text-white/70 text-lg">Acompanhe faturamento, controle status dos pedidos, veja a base de clientes e atualize produtos em tempo real. Uma visão 360 do seu negócio.</p>
              </div>
              <div className="flex-1 w-full flex justify-end">
                <div className="w-full max-w-sm bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-md">
                  <div className="h-4 w-1/3 bg-white/20 rounded-full mb-6" />
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="size-10 bg-white/10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2.5 w-3/4 bg-white/20 rounded-full" />
                          <div className="h-2.5 w-1/2 bg-white/10 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="vitrine" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight">Quem já usa a simbi</h2>
              <p className="mt-2 text-muted-foreground">Catálogos incríveis criados pelos nossos vendedores.</p>
            </div>
          </div>

          {catalogos.length === 0 ? (
            <div className="bg-surface border border-border rounded-3xl p-16 text-center">
              <p className="text-xl font-medium text-muted-foreground">Seja o primeiro a criar um catálogo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {catalogos.map((c) => (
                <Link
                  key={c.slug}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="group bg-surface border border-border rounded-3xl p-6 hover:shadow-soft hover:border-primary/30 transition-all block"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.nome} className="size-14 rounded-2xl object-cover shadow-sm" />
                    ) : (
                      <div className="size-14 rounded-2xl bg-secondary text-foreground font-display text-xl font-bold grid place-items-center">
                        {c.nome.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{c.nome}</h3>
                      <p className="text-sm text-primary font-medium mt-0.5">/c/{c.slug}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2">{c.descricao || "Sem descrição"}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Store className="text-primary size-6" />
            <span className="font-display font-bold text-xl">simbi</span>
          </div>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Simbi. O poder nas mãos de quem vende.</p>
          <div className="flex gap-4">
            <Link to="/auth" className="text-sm font-medium hover:text-primary">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}