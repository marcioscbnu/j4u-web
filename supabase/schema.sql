-- ============================================================================
-- J4U MARKETPLACE - SCHEMA COMPLETO E IDEMPOTENTE (SUPABASE)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  icone TEXT NOT NULL DEFAULT 'tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ofertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  fornecedor TEXT NOT NULL CHECK (fornecedor IN ('mercadolivre', 'shopee')),
  cta TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  url TEXT NOT NULL,
  video_url TEXT DEFAULT '',
  cadastro TEXT NOT NULL,
  expiracao TEXT NOT NULL,
  expiracao_iso TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'destaque', 'campeao', 'arquivado')),
  cliques INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ofertas
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.admin_users (email)
VALUES ('j4umarketplace@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ofertas_categoria_id ON public.ofertas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_status ON public.ofertas(status);
CREATE INDEX IF NOT EXISTS idx_ofertas_expiracao_iso ON public.ofertas(expiracao_iso);

CREATE OR REPLACE FUNCTION public.incrementar_clique_oferta(oferta_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ofertas
  SET cliques = COALESCE(cliques, 0) + 1
  WHERE id = oferta_id;
END;
$$;

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categorias_select_public" ON public.categorias;
CREATE POLICY "categorias_select_public" ON public.categorias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ofertas_select_public" ON public.ofertas;
CREATE POLICY "ofertas_select_public" ON public.ofertas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_users_select_auth" ON public.admin_users;
CREATE POLICY "admin_users_select_auth" ON public.admin_users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "categorias_write_admin" ON public.categorias;
CREATE POLICY "categorias_write_admin" ON public.categorias
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "ofertas_write_admin" ON public.ofertas;
CREATE POLICY "ofertas_write_admin" ON public.ofertas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email'));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ofertas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
