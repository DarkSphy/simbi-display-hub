import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { listarPedidos, atualizarStatusPedido } from "@/lib/pedidos.functions";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewPedidos() {
  const queryClient = useQueryClient();
  const { data: pedidos = [], isLoading } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  if (isLoading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>;

  const filtrados = pedidos.filter(p => {
    const matchBusca = p.cliente_nome.toLowerCase().includes(busca.toLowerCase()) || p.cliente_whatsapp.includes(busca);
    const matchStatus = filtroStatus === "todos" || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Agrupar por data
  const agrupados = filtrados.reduce((acc, p) => {
    const dataObj = parseISO(p.created_at);
    let label = format(dataObj, "dd 'de' MMMM", { locale: ptBR });
    if (isToday(dataObj)) label = "Hoje";
    else if (isYesterday(dataObj)) label = "Ontem";

    const pedidosDoDia = acc[label] ?? [];
    pedidosDoDia.push(p);
    acc[label] = pedidosDoDia;
    return acc;
  }, {} as Record<string, any[]>);

  const confirmarDia = async (diaPedidos: any[]) => {
    const pendentes = diaPedidos.filter(p => p.status !== 'entregue');
    if (!pendentes.length) return;
    
    // Simplificando o Promise.all para o banco de dados
    await Promise.all(pendentes.map(p => atualizarStatusPedido(p.id, 'entregue')));
    queryClient.invalidateQueries({queryKey: ["pedidos"]});
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold">Pedidos</h2>
          <p className="text-muted-foreground mt-1">Gerencie os pedidos recebidos via WhatsApp.</p>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente ou WhatsApp..." className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl shadow-sm outline-none focus:border-primary transition-all" />
        </div>
        <select value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)} className="bg-surface border border-border px-4 py-3 rounded-xl shadow-sm outline-none focus:border-primary font-medium min-w-[150px]">
          <option value="todos">Todos os Status</option>
          <option value="pendente">Pendentes</option>
          <option value="confirmado">Confirmados</option>
          <option value="entregue">Entregues</option>
        </select>
      </div>

      {Object.keys(agrupados).length === 0 ? (
        <div className="bg-surface border border-border rounded-3xl p-16 text-center shadow-sm">
          <p className="text-xl font-medium text-muted-foreground">Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(agrupados).map(([dia, diaPedidos]) => (
            <div key={dia} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="text-primary" size={20}/> {dia}</h3>
                <button onClick={() => confirmarDia(diaPedidos)} className="text-sm font-bold text-sage bg-sage/10 hover:bg-sage/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <CheckCircle2 size={16}/> Entregar Todos
                </button>
              </div>

              <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="font-semibold p-4">Horário</th>
                        <th className="font-semibold p-4">Cliente</th>
                        <th className="font-semibold p-4">Itens</th>
                        <th className="font-semibold p-4">Total</th>
                        <th className="font-semibold p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {diaPedidos.map(p => (
                        <tr key={p.id} className="hover:bg-secondary/30 transition-colors group">
                          <td className="p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {format(parseISO(p.created_at), "HH:mm")}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-foreground">{p.cliente_nome}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{p.cliente_whatsapp}</p>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            <div className="max-w-[300px] truncate" title={p.itens.map((i:any) => i.quantidade + 'x ' + i.nome).join(", ")}>
                              {p.itens.map((i:any) => `${i.quantidade}x ${i.nome}`).join(", ")}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-foreground whitespace-nowrap">{moeda(p.total)}</td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="relative inline-block">
                              <select 
                                value={p.status}
                                onChange={async (e) => {
                                  await atualizarStatusPedido(p.id, e.target.value);
                                  queryClient.invalidateQueries({queryKey: ["pedidos"]});
                                }}
                                className={`cursor-pointer appearance-none rounded-full border px-4 py-2 pr-8 text-xs font-bold outline-none ${p.status === "entregue" ? "border-sage/30 bg-sage/10 text-sage" : p.status === "cancelado" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"}`}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="entregue">Entregue</option>
                                <option value="cancelado">Cancelado</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}