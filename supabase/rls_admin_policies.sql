-- Habilita RLS nas tabelas do J4UMarketPlace e restringe escrita
-- exclusivamente ao usuário autenticado j4umarketplace@gmail.com

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Leitura pública para exibição na vitrine
CREATE POLICY "Leitura publica categorias"
ON public.categorias
FOR SELECT
USING (true);

CREATE POLICY "Leitura publica ofertas"
ON public.ofertas
FOR SELECT
USING (true);

-- Escrita (INSERT, UPDATE, DELETE) apenas para o admin autorizado
CREATE POLICY "Admin unico categorias"
ON public.categorias
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com');

CREATE POLICY "Admin unico ofertas"
ON public.ofertas
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com');
