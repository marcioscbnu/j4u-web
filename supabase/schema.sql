create extension if not exists "pgcrypto";

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  url_base text,
  cor_badge text not null default '#A5D8FF',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  icone text not null default '🏷️',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.categorias
  add column if not exists nome text,
  add column if not exists slug text,
  add column if not exists icone text not null default '🏷️',
  add column if not exists ativo boolean not null default true,
  add column if not exists criado_em timestamptz not null default now();

update public.categorias
set slug = lower(
  regexp_replace(
    translate(
      coalesce(nullif(btrim(slug), ''), nome, 'categoria-' || id::text),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
    ),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  )
)
where slug is null or btrim(slug) = '';

create unique index if not exists idx_categorias_slug_unique
  on public.categorias (slug);

create table if not exists public.ofertas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  categoria_id uuid references public.categorias(id) on delete set null,
  preco numeric(10,2) not null check (preco > 0),
  url_afiliado text not null,
  imagem_url text,
  video_arquivo text not null default 'video0001.mp4',
  legenda_video text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.ofertas
  add column if not exists categoria_id uuid references public.categorias(id) on delete set null,
  add column if not exists imagem_url text,
  add column if not exists video_arquivo text not null default 'video0001.mp4',
  add column if not exists legenda_video text,
  add column if not exists ativo boolean not null default true,
  add column if not exists criado_em timestamptz not null default now();

do $$
declare
  col record;
begin
  for col in
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ofertas'
      and is_nullable = 'NO'
      and column_name not in ('id', 'titulo')
  loop
    execute format('alter table public.ofertas alter column %I drop not null', col.column_name);
  end loop;
end $$;

insert into public.categorias (nome, slug, icone, ativo)
values
  ('Ferramentas', 'ferramentas', '🛠️', true),
  ('Beleza & Cabelos', 'beleza-e-cabelos', '💇‍♀️', true),
  ('Perfumaria', 'perfumaria', '🧴', true),
  ('Casa & Utilidades', 'casa-e-utilidades', '🏠', true),
  ('Eletrônicos', 'eletronicos', '⚡', true)
on conflict (slug) do update
set
  nome = excluded.nome,
  icone = coalesce(nullif(public.categorias.icone, ''), excluded.icone),
  ativo = true;

create index if not exists idx_ofertas_fornecedor_id on public.ofertas(fornecedor_id);
create index if not exists idx_ofertas_categoria_id on public.ofertas(categoria_id);
create index if not exists idx_ofertas_ativo on public.ofertas(ativo);
create index if not exists idx_fornecedores_ativo on public.fornecedores(ativo);
create index if not exists idx_categorias_ativo on public.categorias(ativo);

alter table public.fornecedores enable row level security;
alter table public.categorias enable row level security;
alter table public.ofertas enable row level security;

drop policy if exists "Leitura publica de fornecedores ativos" on public.fornecedores;
create policy "Leitura publica de fornecedores ativos"
on public.fornecedores for select to anon, authenticated
using (ativo = true);

drop policy if exists "Leitura publica de categorias ativas" on public.categorias;
create policy "Leitura publica de categorias ativas"
on public.categorias for select to anon, authenticated
using (ativo = true);

drop policy if exists "Leitura publica de ofertas ativas" on public.ofertas;
create policy "Leitura publica de ofertas ativas"
on public.ofertas for select to anon, authenticated
using (ativo = true);

drop policy if exists "Admin total em fornecedores" on public.fornecedores;
create policy "Admin total em fornecedores"
on public.fornecedores for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com');

drop policy if exists "Admin total em categorias" on public.categorias;
create policy "Admin total em categorias"
on public.categorias for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com');

drop policy if exists "Admin total em ofertas" on public.ofertas;
create policy "Admin total em ofertas"
on public.ofertas for all to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'j4umarketplace@gmail.com');

notify pgrst, 'reload schema';
