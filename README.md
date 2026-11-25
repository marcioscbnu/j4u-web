# J4UMarketPlace — Versão 2.0

Portal de curadoria de ofertas com vídeo local (`/video/video0001.mp4`), tema preto puro (`#000000`), gestão dinâmica de fornecedores no Supabase e painel administrativo protegido por OTP para `j4umarketplace@gmail.com`.

## Estrutura Principal

- `supabase/schema.sql`: Tabelas `fornecedores` e `ofertas` com chave estrangeira (`fornecedor_id`, `ON DELETE RESTRICT`) e políticas RLS.
- `public/video/`: Coloque aqui os arquivos `.mp4` locais (padrão: `video0001.mp4`).
- `src/app/layout.tsx` e `src/app/page.tsx`: Vitrine pública em fundo preto puro (`#000000`).
- `src/app/admin/page.tsx`: Área administrativa protegida via OTP (`shouldCreateUser: false`), sem cadastro público (`signup`) e sem `signOut`.
- `src/components/VitrineJ4U.tsx`: Vitrine com resumo no topo (contagem exata + fornecedor ativo), busca por título sem acentos, filtro por fornecedor, ordenação por preço/recentes e paginação incremental ("Ver mais ofertas").

## Como executar

1. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Execute o SQL de `supabase/schema.sql` no SQL Editor do Supabase.
3. No painel Supabase > Authentication > Providers > Email, habilite o envio de OTP e desative o cadastro público (`Allow new users to sign up = OFF`). Crie manualmente o usuário `j4umarketplace@gmail.com` se ainda não existir.
4. Coloque `video0001.mp4` dentro de `public/video/`.
5. Instale as dependências e rode o projeto:
   ```bash
   npm install
   npm run dev
   ```
