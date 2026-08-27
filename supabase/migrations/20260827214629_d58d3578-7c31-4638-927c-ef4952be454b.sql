CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Outros',
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  medida TEXT NOT NULL DEFAULT '',
  imagem_url TEXT,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  visivel BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogo publico mostra produtos visiveis"
  ON public.produtos FOR SELECT TO anon USING (visivel = true);

CREATE POLICY "Produtores autenticados leem tudo"
  ON public.produtos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Produtores autenticados inserem"
  ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Produtores autenticados atualizam"
  ON public.produtos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Produtores autenticados removem"
  ON public.produtos FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.produtos (nome, descricao, categoria, preco, medida, imagem_url, disponivel, destaque, visivel, ordem) VALUES
('Farinha de Trigo', 'Moinho de pedra, colheita tardia de 2024.', 'Farinhas', 28.00, '1,2 kg', '/images/farinha.jpg', true, false, true, 1),
('Cavala Fresca', 'Pescada ao raiar do dia na costa sul.', 'Peixes', 42.00, '1,2 kg', '/images/cavala.jpg', true, false, true, 2),
('Fermento Vivo', 'Cultura de 72h, rústico e cheio de vida.', 'Fermentos', 18.00, '500 g', '/images/fermento.jpg', true, true, true, 3),
('Ervas do Sítio', 'Maço misto colhido na madrugada.', 'Ervas', 12.00, 'maço', '/images/ervas.jpg', true, false, true, 4),
('Azeite Rústico', 'Primeira prensa, oliva verde e picante.', 'Farinhas', 36.00, '500 ml', '/images/azeite.jpg', true, false, true, 5),
('Pão de fermento', 'Assado na lenha, casca crocante.', 'Fermentos', 15.00, '6 unid.', '/images/pao.jpg', true, false, true, 6);