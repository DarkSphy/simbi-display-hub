import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Store, ShoppingBag, Clock, Users, Target } from "lucide-react";
import { listarPedidos } from "@/lib/pedidos.functions";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewDashboard({ linkPublico }: { linkPublico: string }) {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
  const total = pedidos.reduce((acc, p) => p.status !== 'cancelado' ? acc + Number(p.total) : acc, 0);
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;
  const agendados = pedidos.filter(p => p.agendado).length;

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      
      let name = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      name = name.charAt(0).toUpperCase() + name.slice(1).replace('.', '');
      if (i === 0) name = 'Hoje';
      if (i === 1) name = 'Ontem';

      days.push({ dateStr: str, name, vendas: 0 });
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
      map.set(p.cliente_whatsapp, (map.get(p.cliente_whatsapp) || 0) + 1);
    });
    let novos = 0; let recorrentes = 0;
    map.forEach(qty => {
      if (qty > 1) recorrentes++; else novos++;
    });
    return { novos, recorrentes, total: novos + recorrentes };
  }, [pedidos]);

  const maxVendas = Math.max(...chartData.map(d => d.vendas), 1);
  const pctNovos = clientsData.total > 0 ? (clientsData.novos / clientsData.total) * 100 : 0;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-primary/5 group-hover:scale-110 transition-transform"><Store size={100}/></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><Store size={24}/></div>
            <p className="font-semibold text-muted-foreground">Faturamento</p>
          </div>
          <p className="font-display text-3xl xl:text-4xl whitespace-nowrap font-bold text-foreground relative z-10">{moeda(total)}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-sage/5 group-hover:scale-110 transition-transform"><ShoppingBag size={100}/></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="size-12 rounded-2xl bg-sage/10 text-sage flex items-center justify-center"><ShoppingBag size={24}/></div>
            <p className="font-semibold text-muted-foreground">Vendas</p>
          </div>
          <p className="font-display text-3xl xl:text-4xl whitespace-nowrap font-bold text-foreground relative z-10">{pedidos.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-amber-500/5 group-hover:scale-110 transition-transform"><Clock size={100}/></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock size={24}/></div>
            <p className="font-semibold text-muted-foreground">Pendentes</p>
          </div>
          <p className="font-display text-3xl xl:text-4xl whitespace-nowrap font-bold text-foreground relative z-10">{pendentes}</p>
        </div>
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:scale-110 transition-transform"><Users size={100}/></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Users size={24}/></div>
            <p className="font-semibold text-muted-foreground">Fidelização</p>
          </div>
          <p className="font-display text-3xl font-bold text-foreground relative z-10">{clientsData.recorrentes} <span className="text-lg text-muted-foreground font-medium">fiéis</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-xl mb-2">Desempenho de Vendas (7 Dias)</h3>
          
          <div className="flex items-end justify-between h-[250px] w-full mt-8 gap-1 sm:gap-3">
            {chartData.map(day => {
              const heightPercent = day.vendas > 0 ? (day.vendas / maxVendas) * 100 : 2;
              return (
                <div key={day.name} className="flex flex-col items-center flex-1 h-full group">
                  <div className="w-full relative h-full flex items-end justify-center">
                    <div 
                      className="w-full max-w-[48px] bg-primary/20 group-hover:bg-primary transition-all duration-300 rounded-t-lg relative flex flex-col justify-end"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background font-bold text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none">
                        {moeda(day.vendas)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground mt-3">{day.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-sm flex flex-col">
          <h3 className="font-bold text-xl mb-6 text-center">Novos vs Recorrentes</h3>
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            {pedidos.length === 0 ? (
              <div className="text-muted-foreground font-medium">Sem dados ainda</div>
            ) : (
              <>
                <div className="relative size-48 md:size-56 rounded-full flex items-center justify-center shadow-md transition-all duration-500 hover:scale-105" 
                     style={{ background: `conic-gradient(#8E7CFF ${pctNovos}%, #10B981 ${pctNovos}% 100%)` }}>
                  <div className="absolute bg-surface w-36 h-36 md:w-40 md:h-40 rounded-full shadow-inner flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold text-foreground">{clientsData.total}</span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Clientes</span>
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 sm:gap-8 mt-10 w-full">
                  <div className="flex flex-col items-center gap-1 bg-secondary/50 px-4 py-2 rounded-2xl flex-1 max-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-[#8E7CFF]" />
                      <span className="text-xs font-bold text-muted-foreground uppercase">Novos</span>
                    </div>
                    <span className="font-bold text-foreground text-xl">{clientsData.novos}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 bg-secondary/50 px-4 py-2 rounded-2xl flex-1 max-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-[#10B981]" />
                      <span className="text-xs font-bold text-muted-foreground uppercase">Fiéis</span>
                    </div>
                    <span className="font-bold text-foreground text-xl">{clientsData.recorrentes}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}