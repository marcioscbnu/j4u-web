-- ============================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS - J4U MARKETPLACE (POSTGRESQL / SUPABASE)
-- ============================================================================

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de Ofertas
CREATE TABLE IF NOT EXISTS public.ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  fornecedor TEXT NOT NULL CHECK (fornecedor IN ('mercadolivre', 'shopee')),
  cta TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  url TEXT NOT NULL,
  cadastro TEXT NOT NULL,
  expiracao TEXT NOT NULL,
  expiracao_iso DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'destaque', 'campeao', 'arquivado')),
  cliques INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Função segura (RPC) para incrementar cliques de visitantes públicos
CREATE OR REPLACE FUNCTION public.incrementar_clique_oferta(oferta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ofertas
  SET cliques = cliques + 1
  WHERE id = oferta_id;
END;
$$;

-- 4. Habilitar Row Level Security (RLS - Segurança a Nível de Linha)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Acesso para CATEGORIAS
-- Qualquer visitante pode ler categorias
CREATE POLICY "Leitura publica de categorias"
ON public.categorias FOR SELECT
TO anon, authenticated
USING (true);

-- Apenas o e-mail administrador pode inserir, editar ou excluir categorias
CREATE POLICY "Admin gerencia categorias"
ON public.categorias FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com');

-- 6. Políticas de Acesso para OFERTAS
-- Qualquer visitante pode ler ofertas
CREATE POLICY "Leitura publica de ofertas"
ON public.ofertas FOR SELECT
TO anon, authenticated
USING (true);

-- Apenas o e-mail administrador pode inserir, editar ou excluir ofertas
CREATE POLICY "Admin gerencia ofertas"
ON public.ofertas FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'j4umarketplace@gmail.com');

-- 7. Habilitar Realtime (atualização automática na tela sem F5)
ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ofertas;

-- 8. Categorias iniciais de exemplo (opcional)
INSERT INTO public.categorias (nome, icone) VALUES
  ('Casa & Cozinha', 'home'),
  ('Tecnologia', 'cpu'),
  ('Ferramentas', 'wrench'),
  ('Moda & Estilo', 'shopping-bag');
