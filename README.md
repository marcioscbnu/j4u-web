# J4U Marketplace (`v1.0.0` - Supabase Edition)

Portal de curadoria de ofertas de afiliados (Shopee e Mercado Livre) construído com **Next.js 14 (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Supabase (PostgreSQL + Auth + Realtime)** e **Vitest**.

---

## 1. Instalação Local

Após descompactar o projeto, abra o terminal na pasta `j4u-marketplace` e execute:

```bash
npm install
```

Para rodar os testes unitários com **Vitest**:

```bash
npm run test:run
```

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

---

## 2. Configuração do Banco de Dados no Supabase

O script SQL completo para criar as tabelas, regras de segurança e categorias iniciais está salvo dentro deste projeto em:
`supabase/schema.sql`

Basta copiar todo o conteúdo de `supabase/schema.sql`, colar no **SQL Editor** do painel do Supabase e clicar em **Run**.
