import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Package, Plus, Minus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ViewEstoque({ catalogo }: { catalogo: any }) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos, critico, zerado
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["estoque-admin", catalogo.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id, nome, categoria, estoque, estoque_minimo, imagem_url").eq("catalogo_id", catalogo.id).order("nome");
      if (error) throw error; return data;
    }
  });

  const atualizarEstoque = async (id: string, novoEstoque: number) => {
    if (novoEstoque < 0) novoEstoque = 0;
    setLoadingId(id);
    try {
      const { error } = await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", id);
      if (error) throw error;
      toast.success("Estoque atualizado!");
      queryClient.invalidateQueries({ queryKey: ["estoque-admin"] });
    } catch (e: any) {
      toast.error("Erro ao atualizar estoque.");
    } finally {
      setLoadingId(null);
    }
  };

  const filtrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria?.toLowerCase().includes(busca.toLowerCase());
    
    let matchFiltro = true;
    if (filtro === 'zerado') matchFiltro = p.estoque === 0;
    else if (filtro === 'critico') matchFiltro = p.estoque !== null && p.estoque <= (p.estoque_minimo || 0);

    return matchBusca && matchFiltro;
  });

  const totalZerados = produtos.filter(p => p.estoque === 0).length;
  const totalCriticos = produtos.filter(p => p.estoque > 0 && p.estoque <= (p.estoque_minimo || 0)).length;

  if (isLoading) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32}/></div>;

  return (
    <div className="space-y-6 pb-12 w-full animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground mt-1">Acompanhe e faça a reposição rápida dos seus produtos.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Package size={24}/></div>
          <div><p className="text-sm font-bold text-muted-foreground">Total de Produtos</p><p className="text-2xl font-display font-bold">{produtos.length}</p></div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><AlertTriangle size={24}/></div>
          <div><p className="text-sm font-bold text-muted-foreground">Estoque Crítico</p><p className="text-2xl font-display font-bold">{totalCriticos}</p></div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"><AlertTriangle size={24}/></div>
          <div><p className="text-sm font-bold text-muted-foreground">Estoque Zerado</p><p className="text-2xl font-display font-bold">{totalZerados}</p></div>
        </div>
      </div>

      <div className="bg-surface border border-border p-6 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar produto por nome ou categoria..." className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-primary transition-all" />
          </div>
          <select value={filtro} onChange={e=>setFiltro(e.target.value)} className="bg-background border border-border px-4 py-3 rounded-xl shadow-sm outline-none focus:border-primary font-medium min-w-[200px]">
            <option value="todos">Todos os Produtos</option>
            <option value="critico">Estoque Crítico</option>
            <option value="zerado">Estoque Zerado</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold w-16">Foto</th>
                <th className="px-6 py-4 font-semibold">Produto</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Mínimo</th>
                <th className="px-6 py-4 font-semibold text-right">Reposição Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">Nenhum produto encontrado.</td>
                </tr>
              )}
              {filtrados.map((p) => {
                const isCritico = p.estoque > 0 && p.estoque <= (p.estoque_minimo || 0);
                const isZerado = p.estoque === 0;
                
                let badgeClass = 'bg-sage/10 text-sage';
                let badgeText = 'Normal';
                let Icon = CheckCircle2;
                
                if (isZerado) { badgeClass = 'bg-destructive/10 text-destructive'; badgeText = 'Zerado'; Icon = AlertTriangle; }
                else if (isCritico) { badgeClass = 'bg-amber-500/10 text-amber-500'; badgeText = 'Crítico'; Icon = AlertTriangle; }

                return (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      {p.imagem_url ? (
                        <img src={p.imagem_url} alt={p.nome} className="w-12 h-12 rounded-xl object-cover border border-border"/>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><Package size={20}/></div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground text-base line-clamp-1">{p.nome}</p>
                      <span className="text-xs font-bold text-muted-foreground uppercase">{p.categoria}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${badgeClass}`}>
                        <Icon size={14} /> {badgeText}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-muted-foreground">
                      {p.estoque_minimo || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-mono text-lg font-bold w-12 text-center">{p.estoque}</span>
                        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 border border-border">
                          <button 
                            disabled={loadingId === p.id || p.estoque === 0} 
                            onClick={() => atualizarEstoque(p.id, p.estoque - 1)}
                            className="p-1.5 hover:bg-background hover:text-destructive rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Minus size={18}/>
                          </button>
                          <div className="w-px h-6 bg-border mx-1"></div>
                          <button 
                            disabled={loadingId === p.id} 
                            onClick={() => atualizarEstoque(p.id, p.estoque + 1)}
                            className="p-1.5 hover:bg-background hover:text-sage rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Plus size={18}/>
                          </button>
                        </div>
                        <button 
                          disabled={loadingId === p.id}
                          onClick={() => {
                            const add = window.prompt(`Quantas unidades adicionar ao estoque de ${p.nome}?`, "10");
                            if (add && !isNaN(Number(add))) {
                              atualizarEstoque(p.id, p.estoque + Number(add));
                            }
                          }}
                          className="px-3 py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors whitespace-nowrap hidden sm:block"
                        >
                          + Reposição Lote
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}