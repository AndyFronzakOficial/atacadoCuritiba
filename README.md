# Atacadão Curitiba — loja virtual

Aplicação de loja virtual feita com **React + TypeScript + Vite**, **Tailwind CSS**, **Supabase** (opcional no modo demonstração) e pronta para **GitHub/Vercel**. Interface em português e identidade visual baseada na logo enviada: preto, branco, amarelo e laranja.

## O que já está implementado

- Catálogo com busca por nome, código ou descrição, categorias, ordenação por nome/preço, etiquetas de desconto e controle de estoque.
- Carrinho lateral com alteração de quantidade, remoção e totalização.
- Checkout/cadastro completo: nome, e-mail, telefone, CPF, CEP, endereço, número, complemento, bairro, cidade, UF e senha.
- Ao concluir, o pedido recebe um número, fica salvo no painel e o WhatsApp é aberto com número do pedido, cliente, itens, quantidade, valor unitário/subtotal e total. O CPF, endereço e senha não são incluídos na mensagem.
- Painel administrativo com indicadores, gráfico de vendas, pedidos, atualização/cancelamento/exclusão de pedidos, atalho de WhatsApp, busca e CRUD de produtos.
- Sem credenciais Supabase, funciona em **modo demonstração** e persiste catálogo, carrinho e pedidos no `localStorage` do navegador.
- Com Supabase configurado, usa Auth, tabelas/RLS, leitura/gravação do catálogo, pedidos e itens; a RPC `create_customer_order` valida estoque e grava o pedido em transação.

> **Importante:** modo demonstração serve para apresentar e testar a interface; os dados ficam apenas naquele navegador e não são apropriados para operação real. Antes de vender, conecte o Supabase, configure as políticas e teste o fluxo de cadastro/pedido.

## Rodar localmente

```bash
npm install
npm run dev
```

O Vite mostrará a URL de desenvolvimento. Para conferir o build de produção:

```bash
npm run build
npm run preview
```

## Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Abra **SQL Editor** e execute `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local` e informe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (a chave pública/anon, nunca a `service_role`).
4. Reinicie o servidor. O catálogo inicial é inserido pelo SQL.
5. Para o pedido ser criado imediatamente após cadastro, configure **Authentication → Providers → Email** conforme a operação desejada. Com confirmação de e-mail habilitada, o cliente precisa confirmar e entrar novamente antes de concluir o pedido; para fluxo sem pausa, desabilite a confirmação em ambiente de teste/produção somente após avaliar seu processo de segurança.
6. Cadastre uma conta pelo checkout e promova-a como administrador no SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'seu-email@dominio.com';
```

7. Entre no **Painel admin** com esse e-mail e senha. A aplicação não usa chave `service_role` no navegador; RLS protege pedidos, perfis e operações administrativas.

**LGPD/segurança:** CPF, telefone e endereço são dados pessoais. Restrinja o acesso ao painel, use senha forte, configure políticas de backup/retenção, publique política de privacidade e valide seus processos jurídicos/contábeis antes de operar. O CPF e a senha nunca são enviados pelo link de WhatsApp.

## Publicar na Vercel + GitHub

1. Crie um repositório GitHub e envie os arquivos (`.env.local` está no `.gitignore`).
2. Na Vercel, importe o repositório; o preset Vite e os comandos `npm run build` / `dist` são detectados automaticamente.
3. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Preview/Production.
4. Faça deploy e inclua o domínio publicado em **Supabase → Authentication → URL Configuration** (Site URL e Redirect URLs).
5. O `vercel.json` envia rotas de página única para o `index.html`.

## Personalização inicial

- WhatsApp da loja: `src/lib/format.ts` (`whatsappUrl`), atualmente configurado para **+55 41 98746-3669**.
- Catálogo demonstrativo: `src/lib/demo-data.ts`.
- Logo e arte: `public/logo.png` e `public/hero-products.png`.
- Cores: `src/index.css` e `tailwind.config.js`.
