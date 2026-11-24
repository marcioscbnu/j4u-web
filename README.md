# J4UMarketPlace - Pacote Atualizado

Este pacote contém os arquivos estruturados e atualizados para o deploy na Vercel com integração Supabase:

1. **Autenticação Administrativa Exclusiva (OTP via E-mail):**
   - Acesso restrito exclusivamente ao e-mail `j4umarketplace@gmail.com`.
   - Envio e validação de código de verificação (`signInWithOtp` / `verifyOtp`).
   - Guarda de sessão (`AdminAuthGuard`) bloqueando qualquer acesso não autorizado.

2. **Recuperação e Redefinição de Senha:**
   - Componente de solicitação de link (`SolicitarRecuperacaoSenha.tsx`).
   - Página dedicada para criação da nova senha (`src/app/redefinir-senha/page.tsx`).

3. **Políticas RLS (Row Level Security) para Supabase:**
   - Script SQL em `supabase/rls_admin_policies.sql` restringindo escrita e operações administrativas exclusivamente ao e-mail autorizado.

4. **Correção de Tipagem (`FornecedorTipo`):**
   - Exemplo de importação ajustada para evitar falhas de build no `next build`.
