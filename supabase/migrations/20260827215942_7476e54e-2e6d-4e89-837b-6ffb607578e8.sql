CREATE TABLE public.catalogos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  nome text NOT NULL DEFAULT 'Meu catálogo',
  descricao text NOT NULL DEFAULT '',
  logo_url text,
  capa_url text,
  horario text NOT NULL DEFAULT '',
  contato text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  publicado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalogos TO authenticated;
GRANT SELECT ON public.catalogos TO anon;
GRANT ALL ON public.catalogos TO service_role;

ALTER TABLE public.catalogos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogos publicados sao publicos" ON public.catalogos
  FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "Produtor le seu catalogo" ON public.catalogos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Produtor cria seu catalogo" ON public.catalogos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Produtor atualiza seu catalogo" ON public.catalogos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Produtor remove seu catalogo" ON public.catalogos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_catalogos_updated_at BEFORE UPDATE ON public.catalogos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.produtos ADD COLUMN catalogo_id uuid REFERENCES public.catalogos(id) ON DELETE CASCADE;

INSERT INTO public.catalogos (user_id, slug, nome, descricao, horario, contato)
VALUES ('7a5fdd08-c294-41e0-8dcf-dd97b8622516', 'simbi', 'simbi', 'Farinhas, fermentos, peixes e ervas frescas, direto do produtor.', 'Ter a sáb, 8h às 14h', '');

UPDATE public.produtos SET catalogo_id = (SELECT id FROM public.catalogos WHERE slug = 'simbi') WHERE catalogo_id IS NULL;

ALTER TABLE public.produtos ALTER COLUMN catalogo_id SET NOT NULL;
CREATE INDEX produtos_catalogo_id_idx ON public.produtos (catalogo_id);

DROP POLICY "Catalogo publico mostra produtos visiveis" ON public.produtos;
DROP POLICY "Produtores autenticados atualizam" ON public.produtos;
DROP POLICY "Produtores autenticados inserem" ON public.produtos;
DROP POLICY "Produtores autenticados leem tudo" ON public.produtos;
DROP POLICY "Produtores autenticados removem" ON public.produtos;

CREATE POLICY "Produtos visiveis de catalogos publicados" ON public.produtos
  FOR SELECT TO anon USING (
    visivel = true AND EXISTS (
      SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.publicado = true
    )
  );
CREATE POLICY "Produtor le seus produtos" ON public.produtos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Produtor insere seus produtos" ON public.produtos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Produtor atualiza seus produtos" ON public.produtos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Produtor remove seus produtos" ON public.produtos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.catalogos c WHERE c.id = produtos.catalogo_id AND c.user_id = auth.uid())
  );