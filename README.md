# J4UMarketPlace — Versão 5.0.2 (Black Friday Edition — Edição, Expiração & Faxina)

## Novidades da v5.0.2
- **Edição Completa de Ofertas (`/admin`):** Botão **Editar** em cada oferta cadastrada para alterar categoria, fornecedor, preço, título, foto na íntegra, link de afiliado, arquivo de vídeo (`/video/`), legenda, data de expiração e status (`Ativa`), preservando integralmente a data original de `cadastro`.
- **Expiração Automática na Vitrine (`VitrineJ4U.tsx`):** Ofertas com `expiracao_iso` (ou `expiracao`) vencida ficam automaticamente invisíveis no portal público, enquanto o `/admin` sinaliza quais ofertas já expiraram.
- **Faxina em Lote (`/admin`):** Ferramenta de limpeza controlada para eliminar ofertas por **Categoria** e/ou por **Data de Cadastramento** (com pré-visualização da quantidade de itens afetados e confirmação explícita antes de excluir).
- **Responsividade Total & Zero Scroll Horizontal:** Fornecedores e categorias organizados em grades responsivas (`grid-cols-2` no celular até `xl:grid-cols-6` no desktop).

## Como rodar
1. Copie `.env.local` (com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) para a raiz do projeto.
2. Execute `supabase/v5_0_2_alinhamento_banco.sql` no SQL Editor do Supabase.
3. Rode `npm install` e `npm run dev`.
