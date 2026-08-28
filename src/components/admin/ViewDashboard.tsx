import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Store, ShoppingBag, Clock, Users, Target, CalendarDays, TrendingUp, PackageSearch } from "lucide-react";
import { listarPedidos } from "@/lib/pedidos.functions";
import { supabase } from "@/integrations/supabase/client";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewDashboard({ linkPublico }: { linkPublico: string }) {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
  // Fetch produtos para cruzar os dados de estoque e top vendas
  const { data: produtos = [] } = useQuery({ 
    queryKey: ["produtos-dashboard"], 
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("id, nome, estoque, estoque_minimo, imagem_url");
      return data || [];
    }
  });

  const total = pedidos.reduce((acc, p) => p.status !== 'cancelado' ? acc + Number(p.total) : acc, 0);
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 0; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      
      let name = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      name = name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
      if (i === 0) name = 'Hoje';
      if (i === 1) name = 'Ontem';

      days.push({ dateStr: str, name, vendas: 0, rawDate: d });
    }

    pedidos.forEach(p => {
      if (p.status === 'cancelado') return;
      if (!p.created_at) return;
      const pDate = p.created_at.split('T')[0];
      const day = days.find(d => d.dateStr === pDate);
      if (day) {
        day.vendas += Number(p.total);
      }
    });

    return days;
  }, [pedidos]);

  const clientsData = useMemo(() => {
    const map = new Map();
    pedidos.forEach(p => {
      if (p.status === 'cancelado') return;
      map.set(p.cliente_whatsapp, (map.get(p.cliente_whatsapp) || 0) + 1);
    });
    let novos = 0; let recorrentes = 0;
    map.forEach(qty => {
      if (qty > 1) recorrentes++; else novos++;
    });
    return { novos, recorrentes, total: novos + recorrentes };
  }, [pedidos]);

  // Calcula Recorrência / Mais vendidos
  const produtosVendidos = useMemo(() => {
    const map = new Map();
    pedidos.forEach(p => {
      if (p.status === 'cancelado') return;
      (p.itens || []).forEach((item: any) => {
        if (!item.produto_id) return;
        const current = map.get(item.produto_id) || 0;
        map.set(item.produto_id, current + (Number(item.quantidade) || 1));
      });
    });

    const ranking = Array.from(map.entries()).map(([id, qtd]) => {
      const prod = produtos.find(p => p.id === id);
      return { id, nome: prod?.nome || 'Produto Removido', qtd, estoque: prod?.estoque ?? null, estoque_minimo: prod?.estoque_minimo ?? 0 };
    });

    return ranking.sort((a, b) => b.qtd - a.qtd).slice(0, 5); // Top 5
  }, [pedidos, produtos]);

  return (
    <div className="space-y-6 pb-12 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold">Resumo do Dia</h2>
          <p className="text-muted-foreground mt-1">Acompanhe seus números e desempenho real da loja.</p>
        </div>
        <div className="bg-surface border border-border px-5 py-3 rounded-2xl flex items-center gap-4 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <span className="text-muted-foreground flex items-center gap-2"><Target size={16}/> Link da loja:</span>
          <a href={linkPublico} target="_blank" className="text-primary hover:underline font-bold bg-primary/10 px-3 py-1 rounded-lg">{linkPublico.replace('https://','')}</a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Store size={24}/></div>
          <p className="font-semibold text-muted-foreground mb-2">Faturamento</p>
          <p className="font-display text-3xl font-bold text-foreground">{moeda(total)}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="size-12 rounded-2xl bg-sage/10 text-sage flex items-center justify-center mb-4"><ShoppingBag size={24}/></div>
          <p className="font-semibold text-muted-foreground mb-2">Vendas Totais</p>
          <p className="font-display text-3xl font-bold text-foreground">{pedidos.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4"><Clock size={24}/></div>
          <p className="font-semibold text-muted-foreground mb-2">Pendentes</p>
          <p className="font-display text-3xl font-bold text-foreground">{pendentes}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4"><Users size={24}/></div>
          <p className="font-semibold text-muted-foreground mb-2">Fidelização</p>
          <p className="font-display text-3xl font-bold text-foreground">{clientsData.recorrentes} <span className="text-base text-muted-foreground font-medium">fiéis</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="text-primary" size={24}/>
            <h3 className="font-bold text-xl">Vendas nos Últimos 7 Dias</h3>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Dia</th>
                  <th className="px-6 py-4 font-semibold text-right">Faturamento (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartData.map((day) => (
                  <tr key={day.dateStr} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {day.name} <span className="text-xs text-muted-foreground ml-2">({day.rawDate.toLocaleDateString('pt-BR')})</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground text-right">{moeda(day.vendas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <PackageSearch className="text-primary" size={24}/>
            <h3 className="font-bold text-xl">Mais Vendidos / Estoque</h3>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border flex-1 flex flex-col">
            <table className="w-full text-left text-sm h-full">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-4 font-semibold">Produto</th>
                  <th className="px-4 py-4 font-semibold text-center">Unids. Vendidas</th>
                  <th className="px-4 py-4 font-semibold text-right">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {produtosVendidos.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground font-medium">Nenhuma venda registrada ainda.</td>
                  </tr>
                )}
                {produtosVendidos.map((prod) => {
                  const critico = prod.estoque !== null && prod.estoque <= prod.estoque_minimo;
                  return (
                    <tr key={prod.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-4 font-medium text-foreground line-clamp-2 max-w-[150px]">{prod.nome}</td>
                      <td className="px-4 py-4 font-bold text-foreground text-center">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">{prod.qtd}x</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {prod.estoque === null ? (
                          <span className="text-muted-foreground text-xs italic">S/ Estoque</span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full font-bold text-xs ${critico ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-secondary text-foreground'}`}>
                            {prod.estoque} left
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}