-- Extensão para UUID
create extension if not exists "pgcrypto";

-- Tabela de fornecedores dinâmicos
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  url_base text,
  cor_badge text not null default '#38BDF8',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Tabela de ofertas vinculadas a fornecedores
create table if not exists public.ofertas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  preco numeric(10,2) not null check (preco > 0),
  url_afiliado text not null,
  video_arquivo text not null default 'video0001.mp4',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists idx_ofertas_fornecedor_id on public.ofertas(fornecedor_id);
create index if not exists idx_ofertas_ativo on public.ofertas(ativo);
create index if not exists idx_fornecedores_ativo on public.fornecedores(ativo);

-- Habilitar Row Level Security (RLS)
alter table public.fornecedores enable row level security;
alter table public.ofertas enable row level security;

alter table public.fornecedores force row level security;
alter table public.ofertas force row level security;

-- Limpar políticas anteriores caso existam
drop policy if exists "Leitura publica de fornecedores ativos" on public.fornecedores;
drop policy if exists "Admin total em fornecedores" on public.fornecedores;

drop policy if exists "Leitura publica de ofertas ativas" on public.ofertas;
drop policy if exists "Admin total em ofertas" on public.ofertas;

-- Leitura pública apenas para registros ativos
create policy "Leitura publica de fornecedores ativos"
on public.fornecedores
for select
to anon, authenticated
using (ativo = true);

create policy "Leitura publica de ofertas ativas"
on public.ofertas
for select
to anon, authenticated
using (ativo = true);

-- Acesso completo restrito a j4umarketplace@gmail.com
create policy "Admin total em fornecedores"
on public.fornecedores
for all
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com'
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com'
);

create policy "Admin total em ofertas"
on public.ofertas
for all
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com'
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com'
);
