import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Store, ShoppingBag, Clock, Users, Target, CalendarDays, TrendingUp } from "lucide-react";
import { listarPedidos } from "@/lib/pedidos.functions";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewDashboard({ linkPublico }: { linkPublico: string }) {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
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

  return (
    <div className="space-y-6 pb-12 w-full">
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

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-primary" size={24}/>
            <h3 className="font-bold text-xl">Perfil dos Clientes</h3>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Categoria</th>
                  <th className="px-6 py-4 font-semibold text-right">Quantidade</th>
                  <th className="px-6 py-4 font-semibold text-right">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#8E7CFF] flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#8E7CFF]" /> Clientes Novos
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground text-right">{clientsData.novos}</td>
                  <td className="px-6 py-4 font-medium text-muted-foreground text-right">
                    {clientsData.total > 0 ? Math.round((clientsData.novos / clientsData.total) * 100) : 0}%
                  </td>
                </tr>
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#10B981] flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#10B981]" /> Clientes Fiéis (Recorrentes)
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground text-right">{clientsData.recorrentes}</td>
                  <td className="px-6 py-4 font-medium text-muted-foreground text-right">
                    {clientsData.total > 0 ? Math.round((clientsData.recorrentes / clientsData.total) * 100) : 0}%
                  </td>
                </tr>
                <tr className="bg-secondary/10">
                  <td className="px-6 py-4 font-bold text-foreground">Total de Clientes</td>
                  <td className="px-6 py-4 font-bold text-foreground text-right">{clientsData.total}</td>
                  <td className="px-6 py-4 font-medium text-muted-foreground text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}