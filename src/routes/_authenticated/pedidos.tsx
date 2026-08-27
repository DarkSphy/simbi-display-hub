import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listarPedidos } from "@/lib/pedidos.functions";

export const Route = createFileRoute("/_authenticated/pedidos")({
  component: PedidosPage,
});

function PedidosPage() {
  const { data: pedidos = [], isLoading } = useQuery({ queryKey: ["pedidos"], queryFn: listarPedidos });

  return (
    <div className="min-h-screen bg-paper text-ink font-body p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link to="/admin" className="text-sm underline">Voltar para o Painel</Link>
        <h1 className="text-3xl font-display">Pedidos Recebidos</h1>
        
        {isLoading ? <p>Carregando...</p> : (
          <div className="bg-cream rounded-xl border border-ink/10 overflow-hidden divide-y divide-ink/10">
            {pedidos.map(p => (
              <div key={p.id} className="p-6">
                <p className="font-medium text-lg">{p.cliente_nome}</p>
                <p className="text-sm text-ink/60">{p.cliente_whatsapp} - {p.cliente_endereco}</p>
                <div className="mt-4">
                  {p.itens.map((i: any) => (
                    <p key={i.id} className="text-sm">{i.quantidade}x {i.nome}</p>
                  ))}
                </div>
                <p className="font-bold mt-4">Total: R$ {p.total}</p>
              </div>
            ))}
            {pedidos.length === 0 && <p className="p-6 text-center">Nenhum pedido ainda.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
