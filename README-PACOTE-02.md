# Nexora AI — Pacote 02: Autenticação e Banco de Dados

## Como aplicar
1. Copie estes arquivos para a raiz do repositório (não há nada para apagar). Se já existir `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore` ou `src/app/layout.tsx`, **mescle** em vez de sobrescrever.
2. `npm install` e depois `npm run typecheck` e `npm run build`.
3. Rode o SQL: `supabase/migrations/20261105000000_nexora_foundation.sql` (SQL Editor do Supabase → New query → colar → Run). Execute uma única vez.
4. Configure o Supabase (abaixo) e as variáveis de ambiente.

## Variáveis de ambiente
| Variável | Onde obter | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | mesma tela (anon / publishable) | pública, protegida por RLS |
| `NEXT_PUBLIC_SITE_URL` | URL do app, sem `/` final | local: `http://localhost:3000` |

A **service role key não é usada** neste pacote e não deve ser cadastrada.
Cadastre as 3 variáveis na Vercel (Settings → Environment Variables) para Production e Preview.

## Configurações do Supabase
**Authentication → URL Configuration**
- Site URL: a URL de produção (ex.: `https://seu-app.vercel.app`)
- Redirect URLs: `https://seu-app.vercel.app/**` e `http://localhost:3000/**`

**Authentication → Providers → Email**
- Enable Email provider: ligado
- Confirm email: **ligado**
- Minimum password length: 8

**Authentication → Email Templates** (recomendado: o link funciona mesmo abrindo o e-mail em outro app/navegador do celular)
- *Confirm signup* — link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
- *Reset password* — link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Se não alterar os templates, o fluxo padrão (PKCE) usa `/auth/callback`, que também está implementado, mas exige abrir o link **no mesmo navegador** em que fez o cadastro.

**Authentication → Rate Limits / Attack Protection**: mantenha os limites padrão; ative CAPTCHA se houver abuso. Para e-mails em produção, configure SMTP próprio (o SMTP padrão do Supabase tem limite baixo).

## Segurança — resumo
- RLS ativo em todas as 11 tabelas; `anon` não tem acesso a nenhuma.
- Permissões via funções `SECURITY DEFINER` com `search_path` vazio (`is_business_member`, `has_business_role`, `shares_business_with`).
- FKs compostas `(id, business_id)` impedem vincular contato/conversa/mensagem de outra empresa.
- `business_id` é imutável (trigger); `profiles.email` e `businesses.created_by` não são editáveis pelo usuário (grants por coluna).
- Ninguém vira `owner` pela API (policy + índice de proprietário único); admin só gerencia `agent`.
- `subscriptions` e `usage_events`: somente leitura para membros; escrita futura só no servidor.
- Cookies de sessão `HttpOnly`, `Secure` (produção), `SameSite=Lax`. O navegador nunca recebe chave do Supabase (toda auth roda no servidor).
- Validação com Zod no servidor; redirecionamento `next` só aceita caminhos internos; recuperação de senha não revela se o e-mail existe.
- Headers de segurança em `next.config.mjs`.

## Testar pelo celular (Android)
1. Faça deploy na Vercel (ou `npm run dev -- -H 0.0.0.0` e abra `http://IP-DO-PC:3000` no Wi‑Fi; nesse caso ponha esse endereço em `NEXT_PUBLIC_SITE_URL` e nas Redirect URLs).
2. Abra `/cadastro` no Chrome do celular, crie a conta → cai em `/confirmar-email`.
3. Abra o e-mail e toque no link → deve ir para `/dashboard` já logado, mostrando sua empresa como "Proprietário".
4. Toque em **Sair** → volta ao `/login`. Tente abrir `/dashboard` deslogado → redireciona ao login.
5. Feche e reabra o Chrome: a sessão deve persistir.
6. `/recuperar-senha` → toque no link do e-mail → `/redefinir-senha` → nova senha → `/dashboard`.
7. Teste de isolamento: crie uma segunda conta (outro e-mail) e confirme que ela só vê a própria empresa.
