
-- PEDIDOS: restringir leitura/atualização ao dono do catálogo
drop policy if exists "Permitir leitura de pedidos" on public.pedidos;
drop policy if exists "Permitir leitura de pedidos a usuários autenticados" on public.pedidos;
drop policy if exists "Permitir atualizacao de pedidos" on public.pedidos;
drop policy if exists "Permitir atualização de pedidos a usuários autenticados" on public.pedidos;

create policy "Dono do catalogo le seus pedidos"
on public.pedidos for select to authenticated
using (exists (select 1 from public.catalogos c where c.id = pedidos.catalogo_id and c.user_id = auth.uid()));

create policy "Dono do catalogo atualiza seus pedidos"
on public.pedidos for update to authenticated
using (exists (select 1 from public.catalogos c where c.id = pedidos.catalogo_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.catalogos c where c.id = pedidos.catalogo_id and c.user_id = auth.uid()));

create policy "Dono do catalogo apaga seus pedidos"
on public.pedidos for delete to authenticated
using (exists (select 1 from public.catalogos c where c.id = pedidos.catalogo_id and c.user_id = auth.uid()));

-- LOJA_CONFIG: remover update aberto
drop policy if exists "Permitir atualização das configurações a usuários autentic" on public.loja_config;
revoke update on public.loja_config from authenticated;
grant all on public.loja_config to service_role;

-- STORAGE: remover escrita pública e exigir posse do arquivo
drop policy if exists "Permitir upload publico" on storage.objects;
drop policy if exists "Permitir atualizacao" on storage.objects;
drop policy if exists "Permitir remocao" on storage.objects;
drop policy if exists "Atualizacao liberada" on storage.objects;
drop policy if exists "Delecao liberada" on storage.objects;
drop policy if exists "Upload liberado" on storage.objects;
drop policy if exists "Vendedores podem atualizar imagens" on storage.objects;
drop policy if exists "Vendedores podem fazer upload de imagens" on storage.objects;
drop policy if exists "Imagens visiveis" on storage.objects;
drop policy if exists "Permitir leitura publica" on storage.objects;

create policy "Imagens upload do proprio usuario"
on storage.objects for insert to authenticated
with check (bucket_id = 'imagens' and owner = auth.uid());

create policy "Imagens update do proprio usuario"
on storage.objects for update to authenticated
using (bucket_id = 'imagens' and owner = auth.uid())
with check (bucket_id = 'imagens' and owner = auth.uid());

create policy "Imagens delete do proprio usuario"
on storage.objects for delete to authenticated
using (bucket_id = 'imagens' and owner = auth.uid());
