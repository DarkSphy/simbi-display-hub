
drop policy if exists "Permitir checkout público" on public.pedidos;
drop policy if exists "Permitir envio de pedido publico" on public.pedidos;
drop policy if exists "Permitir inserção de pedidos ao público" on public.pedidos;

create policy "Pedido em catalogo publicado"
on public.pedidos for insert to anon, authenticated
with check (exists (select 1 from public.catalogos c where c.id = catalogo_id and c.publicado = true));
