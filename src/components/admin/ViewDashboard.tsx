import { useQuery } from "@tanstack/react-query";
import { Store, ShoppingBag, Clock, Users, Target } from "lucide-react";
import { listarPedidos } from "@/lib/pedidos.functions";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewDashboard({ linkPublico }: { linkPublico: string }) {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
  const total = pedidos.reduce((acc, p) => p.status !== 'cancelado' ? acc + Number(p.total) : acc, 0);
  const pendentes = pedidos.filter(p => p.status === 'pendente').length;
  const agendados = pedidos.filter(p => p.agendado).length;

  return (
    <div className="space-y-6 pb-12 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold">Resumo do Dia</h2>
          <p className="text-muted-foreground mt-1">Acompanhe seus números (Gráficos desativados para estabilidade).</p>
        </div>
        <div className="bg-surface border border-border px-5 py-3 rounded-2xl flex items-center gap-4 text-sm font-medium shadow-sm">
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
          <p className="font-semibold text-muted-foreground mb-2">Agendados</p>
          <p className="font-display text-3xl font-bold text-foreground">{agendados}</p>
        </div>
      </div>
    </div>
  );
}