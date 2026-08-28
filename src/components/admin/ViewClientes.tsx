import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Star, Users } from "lucide-react";
import { listarPedidos } from @/lib/pedidos.functions;

const moeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

export function ViewClientes() {
  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

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
    return Array.from(map.values()).map(c => ({
      ...c,
      tipo: c.qty > 1 ? "recorrente" : "novo"
    })).sort((a,b)=>b.total - a.total);
  }, [pedidos]);

  const filtrados = clientes.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.whatsapp.includes(busca);
    const matchTipo = filtroTipo === "todos" || c.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold">Clientes</h2>
          <p className="text-muted-foreground mt-1">Sua base de dados de compradores fiéis.</p>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente ou WhatsApp..." className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl shadow-sm outline-none focus:border-primary transition-all" />
        </div>
        <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)} className="bg-surface border border-border px-4 py-3 rounded-xl shadow-sm outline-none focus:border-primary font-medium min-w-[180px]">
          <option value="todos">Todos os Clientes</option>
          <option value="novo">Novos (1 Pedido)</option>
          <option value="recorrente">Recorrentes (+1 Pedido)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.length === 0 && <p className="col-span-full text-center text-muted-foreground p-10 bg-surface rounded-3xl border border-border">Nenhum cliente encontrado.</p>}
        {filtrados.map(c => (
          <div key={c.whatsapp} className="bg-surface border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            {c.tipo === "recorrente" && (
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                <Star size={10} fill="currentColor"/> Recorrente
              </div>
            )}
            <div className="flex items-center gap-4 mb-5 mt-2">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center font-display text-xl font-bold">{c.nome.slice(0,1).toUpperCase()}</div>
              <div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{c.nome}</h3>
                <p className="text-sm text-muted-foreground font-mono">{c.whatsapp}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-5" title={c.endereco}>{c.endereco}</p>
            <div className="pt-4 border-t border-border flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Pedidos</p>
                <p className="font-bold">{c.qty}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Gasto Total</p>
                <p className="font-bold text-lg text-primary">{moeda(c.total)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}