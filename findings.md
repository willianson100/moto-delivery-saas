# findings.md — Relatório de Auditoria Completa
**Protocolo:** V.L.A.E.G.
**Tipo:** Auditoria de Segurança, Arquitetura e Funcionalidade
**Data:** 2026-05-12
**Auditor:** Antigravity (Piloto do Sistema)

> ⚠️ **Nenhuma alteração de código foi feita. Este é um relatório de diagnóstico puro.**

---

## SUMÁRIO EXECUTIVO

O projeto MotoDelivery SaaS é um **MVP visual bem estruturado** com UI de qualidade, mas com **graves deficiências de segurança e funcionalidade**. O sistema está essencialmente operando como um protótipo de demonstração — tudo funciona na aparência, mas **nada está conectado a dados reais ou protegido**. Está impróprio para uso em produção.

| Dimensão | Status | Nota |
|----------|--------|------|
| UI / Design | ✅ Bom | Premium, dark mode, responsivo |
| Autenticação | 🔴 Crítico | Simulada, sem segurança real |
| Autorização / Permissões | 🔴 Crítico | Nenhuma proteção de rota |
| Banco de dados | 🟡 Parcial | Schema básico, mas incompleto |
| RLS / Multi-tenant | 🟡 Parcial | Políticas incompletas |
| GPS / Rastreamento | 🟡 Parcial | API do browser ok, sem persistência |
| Fluxo de pedidos | 🔴 Crítico | Tudo hardcoded, sem backend |
| WhatsApp / Automação | 🟡 UI apenas | Backend não implementado |
| Mapa | 🔴 Ausente | Placeholder texto |
| Logs e Auditoria | 🔴 Ausente | Zero rastreabilidade |
| Deploy / Produção | 🟡 Não testado | Faltam variáveis server-side |

---

## PARTE 1 — O QUE ESTÁ FUNCIONANDO ✅

### 1.1 Estrutura de Projeto
- Next.js 16 com App Router corretamente configurado
- Separação de rotas: `/dashboard`, `/admin-master`, `/motoboy`, `/tracking/[id]`, `/login`
- Layout por segmento: Dashboard tem seu próprio layout com sidebar; Motoboy tem layout mobile
- TypeScript configurado com tsconfig correto
- Módulos CSS por componente (sem conflitos de estilo)

### 1.2 Design e UI
- Dark mode consistente com variáveis CSS globais
- KPI cards, listas de pedidos, painel de motoboys, feed de WhatsApp — visualmente coerentes
- Sidebar do dashboard com 12 itens de navegação (maioria `href="#"` mas corretamente estruturada)
- Layout do motoboy simulando PWA mobile com bottom navigation
- Página de tracking `/tracking/[id]` com timeline de status bem estruturada
- Animações e micro-interações presentes via CSS

### 1.3 Supabase
- Cliente Supabase corretamente inicializado em `src/lib/supabase.ts`
- URL e ANON_KEY corretamente carregadas via variáveis de ambiente
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` presentes no `.env.local`
- Schema SQL definido (mesmo que incompleto) em `supabase-schema.sql`
- RLS habilitado nas 3 tabelas principais

### 1.4 GPS do Motoboy (Parcialmente)
- `navigator.geolocation.watchPosition()` corretamente implementado
- Limpeza do watcher no `useEffect` de unmount (evita memory leak)
- Tratamento de erro de permissão GPS com mensagem clara ao usuário
- Obrigatoriedade de GPS para ficar "Online" — boa UX e lógica correta
- `enableHighAccuracy: true` configurado

### 1.5 WhatsApp (UI)
- Dois métodos de conexão: QR Code e Código de Emparelhamento
- Preview de mensagem automática bem formatado
- Toggles de automação funcionais (estado local)
- Referência à "Evolution API" identificada no código

### 1.6 Dependências
- `@supabase/supabase-js ^2.105.4` — versão moderna e correta
- `recharts ^3.8.1` — instalado para gráficos (mesmo que não implementado)
- `lucide-react ^1.14.0` — ícones bem utilizados
- TypeScript + ESLint configurados

---

## PARTE 2 — O QUE ESTÁ ERRADO 🔴

### 2.1 [CRÍTICO] Autenticação Completamente Falsa

**Arquivo:** `src/app/login/page.tsx`  
**Linhas:** 14–19

```tsx
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  // Simulação de login - No futuro conectaremos ao Supabase Auth aqui
  console.log("Login com", email);
  router.push("/dashboard"); // ← QUALQUER USUÁRIO ENTRA SEM VALIDAÇÃO
};
```

**Problema:** O botão "Entrar" não chama `supabase.auth.signInWithPassword()`. Qualquer pessoa que digitar qualquer email e senha é redirecionada para o dashboard. **Não há autenticação.**

**Risco:** Acesso irrestrito a todos os painéis.

---

### 2.2 [CRÍTICO] Todas as Rotas São Públicas

**Arquivo ausente:** `src/middleware.ts`

O projeto não tem nenhum `middleware.ts`. Isso significa:
- `/dashboard` — Qualquer pessoa acessa sem login
- `/admin-master` — Qualquer pessoa acessa, incluindo dados de todos os tenants
- `/motoboy` — Qualquer pessoa pode ficar "online" como motoboy

**Risco:** Uma pessoa não autenticada pode acessar qualquer painel diretamente pela URL.

---

### 2.3 [CRÍTICO] GPS Não é Persistido no Banco

**Arquivo:** `src/app/motoboy/page.tsx`  
**Linhas:** 57–63

```tsx
/* CÓDIGO REAL DE TRANSMISSÃO (Descomentaremos depois)
supabase.from('user_profiles').update({
  latitude: lat,
  longitude: lng,
  ...
}).eq('id', 'ID_DO_MOTOBOY_LOGADO'); // ← 'ID_DO_MOTOBOY_LOGADO' = HARDCODED STRING
*/
```

**Problema duplo:**
1. O código está comentado — GPS não vai para o banco
2. Mesmo se descomentado, usa `'ID_DO_MOTOBOY_LOGADO'` como string literal — nunca funciona
3. A tabela correta para GPS seria uma tabela separada `motoboy_locations`, não `user_profiles`
4. `user_profiles` não tem colunas `latitude`, `longitude`, `last_location_update`

**Risco:** O mapa ao vivo nunca mostrará posições reais de nenhum motoboy.

---

### 2.4 [CRÍTICO] Admin Master Sem Proteção por Role

**Arquivo:** `src/app/admin-master/page.tsx`

O painel Admin Master é acessível por qualquer usuário autenticado (ou mesmo não autenticado). Não há verificação de `role === 'admin_master'`. Um `tenant_admin` ou `motoboy` pode acessar e ver dados de todos os tenants.

---

### 2.5 [ALTO] Dashboard com 100% de Dados Fictícios

**Arquivo:** `src/app/dashboard/page.tsx`

Todos os dados do dashboard são arrays hardcoded no JSX:
- KPIs (128 pedidos, R$ 3.258,40) — fictícios
- Lista de entregas (João Pereira, Maria Oliveira) — fictícios
- Motoboys online (Carlos Silva, Rafael Lima) — fictícios
- Pedidos recentes — fictícios
- Dados financeiros — fictícios

Não há nenhuma chamada ao Supabase. O dashboard não exibe dados reais.

---

### 2.6 [ALTO] Schema SQL Incompleto

**Arquivo:** `supabase-schema.sql`

**Tabelas que faltam:**
1. `motoboy_locations` — Essencial para GPS em tempo real
2. `order_status_log` — Essencial para auditoria e rastreabilidade
3. `subscriptions` — Necessária para o modelo SaaS (planos, trial, vencimento)
4. `whatsapp_connections` — Para persistir estado de conexão WhatsApp por tenant

**Colunas ausentes em tabelas existentes:**
- `orders` não tem `items` (o que foi pedido?), `restaurant_address` (ponto de coleta), `estimated_delivery_time`
- `user_profiles` não tem `phone`, `vehicle_plate`, `vehicle_model` (necessário para motoboys)
- `tenants` não tem `plan`, `trial_ends_at`, `subscription_status`

---

### 2.7 [ALTO] Políticas RLS Incompletas

**Arquivo:** `supabase-schema.sql`

**Políticas existentes:** Apenas SELECT para `user_profiles` e `orders`

**Políticas ausentes:**
- `orders` → INSERT (sem isso, ninguém pode criar pedido via app)
- `orders` → UPDATE (sem isso, motoboy não pode atualizar status)
- `orders` → DELETE
- `tenants` → qualquer política (a tabela não tem nenhuma RLS policy definida!)
- `user_profiles` → INSERT (como criar motoboys/admins?)
- `user_profiles` → UPDATE
- `motoboy_locations` → todas as políticas

**Risco:** A tabela `tenants` com RLS ativado mas sem policies = **ninguém consegue ler tenants pelo app**, causando erros silenciosos.

---

### 2.8 [ALTO] Imagem de Supabase — Chave Anon em Modo Inseguro

**Arquivo:** `src/lib/supabase.ts`

O cliente Supabase é um **único cliente compartilhado** para toda a aplicação, incluindo operações server-side e client-side. No Next.js com App Router, a prática correta é:
- `createBrowserClient()` para componentes client-side
- `createServerClient()` para Server Components, API Routes e Middleware

Usar um único `createClient()` universal causa problemas de segurança e pode vazar sessões entre usuários em ambientes SSR.

---

### 2.9 [MÉDIO] Mapa é um Placeholder de Texto

**Arquivos:** `src/app/dashboard/page.tsx` (linha 109), `src/app/motoboy/page.tsx` (linha 135), `src/app/tracking/[id]/page.tsx` (linha 21)

Em todos os 3 lugares onde deve aparecer um mapa:
```tsx
<span>Integração com Google Maps API aqui</span>
```

Não há integração com Google Maps, Mapbox ou qualquer biblioteca de mapas.

---

### 2.10 [MÉDIO] Recharts Não Implementado

**Arquivo:** `src/app/dashboard/page.tsx`  
**Linhas:** 233, 243

```tsx
<div className={styles.chartPlaceholder}>
  (Gráfico de linha Recharts)
</div>
```

A dependência `recharts` está instalada no `package.json` mas nunca é importada ou utilizada. Os gráficos financeiro e de status da operação são placeholders de texto.

---

### 2.11 [MÉDIO] WhatsApp Sem Backend

**Arquivo:** `src/app/dashboard/whatsapp/page.tsx`

O "pairing code" `A1B2-C3D4` é uma string hardcoded. O QR Code é apenas o ícone SVG do Lucide, não um QR real. O botão "Simular Conexão Concluída" define `setIsConnected(true)` sem chamada a nenhuma API.

A Evolution API é mencionada mas não há:
- URL configurada em `.env.local`
- Chave da API configurada
- Nenhuma API Route no Next.js para fazer proxy das chamadas

---

### 2.12 [MÉDIO] Supabase Import Comentado no Motoboy

**Arquivo:** `src/app/motoboy/page.tsx`  
**Linha:** 7–8

```tsx
// Import do supabase comentado provisoriamente para evitar erros
// import { supabase } from "@/lib/supabase";
```

O import está comentado. Nenhuma chamada ao Supabase é possível nessa página.

---

### 2.13 [BAIXO] Links de Navegação Não Funcionais

**Arquivo:** `src/app/dashboard/layout.tsx`

10 dos 12 itens do menu lateral apontam para `href="#"`. Apenas Dashboard e WhatsApp têm rotas reais. Isso inclui: Mapa ao vivo, Pedidos, Motoboys, Clientes, Atendimento, Mensagens, Financeiro, Assinatura, Relatórios, Configurações.

---

### 2.14 [BAIXO] Dados Hardcoded de Motoboy no Tracking

**Arquivo:** `src/app/tracking/[id]/page.tsx`

O `orderId` é lido via `useParams()`, mas nunca é usado para buscar dados. Todos os dados (nome do motoboy, horários, restaurante, veículo) são hardcoded. A página não é dinâmica.

---

### 2.15 [BAIXO] Imagens Externas de Terceiros como Avatares

**Arquivos:** Múltiplos  
O sistema usa `https://i.pravatar.cc/150?img=N` para todos os avatares. Isso é:
- Dependência externa não controlada
- Não representa usuários reais
- Pode causar erros se o serviço ficar fora do ar

---

## PARTE 3 — O QUE PRECISA SER CORRIGIDO PRIMEIRO (Prioridade)

### 🔴 BLOQUEADORES — Fase L (Link): Nada funciona sem isso

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 1 | Autenticação real com Supabase Auth | Sistema inteiro inseguro | `login/page.tsx` |
| 2 | Middleware de proteção de rotas | Qualquer um acessa tudo | `middleware.ts` (criar) |
| 3 | Separar cliente Supabase (SSR vs Client) | Segurança e sessões | `lib/supabase.ts` |
| 4 | Aplicar schema SQL no Supabase | DB pode não existir ainda | `supabase-schema.sql` |
| 5 | Completar políticas RLS (INSERT, UPDATE) | Nenhuma escrita funciona | `supabase-schema.sql` |

### 🟡 ESSENCIAIS — Fase A (Arquitetura): O sistema fica funcional com isso

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 6 | Criar tabela `motoboy_locations` | GPS não persiste | `supabase-schema.sql` |
| 7 | Descomentear e corrigir GPS do Motoboy | Rastreio ao vivo impossível | `motoboy/page.tsx` |
| 8 | Conectar Dashboard ao Supabase | Dados reais no painel | `dashboard/page.tsx` |
| 9 | Criar tabela `order_status_log` | Sem rastreabilidade | `supabase-schema.sql` |
| 10 | Criar tabela `subscriptions` | Modelo SaaS quebrado | `supabase-schema.sql` |
| 11 | Proteger `/admin-master` por role | Violação de segurança | `admin-master/page.tsx` |
| 12 | Conectar Tracking ao Supabase Realtime | Tracking não é real | `tracking/[id]/page.tsx` |

### 🟢 IMPORTANTES — Fase E/G (Estilo e Deploy): Qualidade do produto

| # | Problema | Impacto | Arquivo(s) |
|---|----------|---------|------------|
| 13 | Integrar Google Maps ou Mapbox | Mapa é texto estático | Dashboard, Motoboy, Tracking |
| 14 | Implementar gráficos Recharts | Financeiro sem dados | `dashboard/page.tsx` |
| 15 | Backend Evolution API (WhatsApp) | Automação não funciona | API Route (criar) + `.env.local` |
| 16 | Adicionar colunas ao schema | Dados incompletos | `supabase-schema.sql` |
| 17 | PWA Manifest para Motoboy | Não instala no celular | `public/manifest.json` (criar) |
| 18 | Ativar links de navegação | UX quebrada | `dashboard/layout.tsx` |

---

## PARTE 4 — QUAIS ARQUIVOS SERIAM ALTERADOS

### Alterações (arquivos existentes)
| Arquivo | Tipo de Alteração | Prioridade |
|---------|-------------------|------------|
| `src/app/login/page.tsx` | Conectar ao `supabase.auth.signInWithPassword()` | 🔴 CRÍTICO |
| `src/lib/supabase.ts` | Separar em `supabase-browser.ts` e `supabase-server.ts` | 🔴 CRÍTICO |
| `src/app/motoboy/page.tsx` | Descomentar Supabase, corrigir GPS, usar `auth.uid()` | 🔴 CRÍTICO |
| `supabase-schema.sql` | Adicionar tabelas, colunas e políticas RLS faltantes | 🔴 CRÍTICO |
| `src/app/dashboard/page.tsx` | Substituir dados fictícios por queries Supabase | 🟡 ALTO |
| `src/app/dashboard/layout.tsx` | Adicionar verificação de sessão, corrigir links | 🟡 ALTO |
| `src/app/admin-master/page.tsx` | Adicionar guard de role `admin_master` | 🟡 ALTO |
| `src/app/tracking/[id]/page.tsx` | Buscar pedido real via Supabase com Realtime | 🟡 ALTO |
| `src/app/dashboard/whatsapp/page.tsx` | Integrar com Evolution API via API Route | 🟢 MÉDIO |
| `.env.local` | Adicionar variáveis: Evolution API, Google Maps | 🟢 MÉDIO |
| `next.config.ts` | Configurar rewrites/headers de segurança | 🟢 MÉDIO |

### Novos arquivos (criar)
| Arquivo | Finalidade | Prioridade |
|---------|-----------|------------|
| `src/middleware.ts` | Proteção global de rotas com Supabase Auth | 🔴 CRÍTICO |
| `src/lib/supabase-browser.ts` | Cliente Supabase para componentes Client | 🔴 CRÍTICO |
| `src/lib/supabase-server.ts` | Cliente Supabase para Server Components | 🔴 CRÍTICO |
| `src/app/api/whatsapp/connect/route.ts` | Proxy seguro para Evolution API | 🟡 ALTO |
| `src/app/api/orders/route.ts` | CRUD de pedidos com autenticação server-side | 🟡 ALTO |
| `src/app/api/locations/route.ts` | Receber e persistir GPS do motoboy | 🟡 ALTO |
| `public/manifest.json` | PWA para o App do Motoboy | 🟢 MÉDIO |

---

## PARTE 5 — RISCOS

### 🔴 Riscos Críticos (Produção = Desastre)

| Risco | Descrição | Probabilidade | Impacto |
|-------|-----------|---------------|---------|
| **Acesso não autorizado** | Qualquer pessoa pode acessar `/admin-master` e ver dados de todos os tenants | Certa | Catastrófico |
| **Violação de multi-tenancy** | Sem proteção de rotas, tenant A pode ver dados do tenant B | Certa | Catastrófico |
| **Phishing de credenciais** | Login falso dá falsa sensação de segurança; pode ser explorado para coletar emails/senhas de usuários que pensam estar logando no sistema real | Alta | Alto |
| **GPS nunca funciona em produção** | Motoboys ficam "online" mas o sistema não sabe onde estão | Certa | Alto |

### 🟡 Riscos Operacionais

| Risco | Descrição | Probabilidade | Impacto |
|-------|-----------|---------------|---------|
| **Sem trilha de auditoria** | Nenhum log de quem alterou status de pedidos | Certa (se nada mudar) | Médio |
| **Dashboard engana operador** | Gerente vê dados fictícios (128 pedidos, R$ 3.258) e toma decisões erradas | Alta | Alto |
| **WhatsApp desconecta silenciosamente** | Sem persistência de estado, a conexão nunca sobrevive a um reload | Certa | Médio |
| **RLS bloqueando operações legítimas** | Tabela `tenants` com RLS sem policies = erros silenciosos ao tentar criar tenants | Alta | Médio |

### 🟢 Riscos de Qualidade/UX

| Risco | Descrição | Probabilidade | Impacto |
|-------|-----------|---------------|---------|
| **App motoboy sem PWA** | Motoboys precisam de atalho no celular; sem manifest.json, não é instalável | Alta | Médio |
| **Dependência de i.pravatar.cc** | Se o serviço sair do ar, todos os avatares quebram | Baixa | Baixo |
| **Next.js versão** | `package.json` declara Next.js `16.2.6` e React `19.2.4` — versões muito recentes que podem ter breaking changes não documentados | Média | Médio |

---

## CONCLUSÃO

O projeto MotoDelivery SaaS tem uma **excelente base visual e arquitetural** — as rotas estão bem pensadas, o design é premium, e a estrutura de componentes é limpa. Porém, está essencialmente em **estágio de wireframe interativo**, não de produto funcional.

Os 5 bloqueadores críticos listados na Parte 3 devem ser resolvidos **antes de qualquer dado real ser colocado no sistema** ou qualquer usuário real ser cadastrado. Especialmente a autenticação e o middleware de proteção de rotas, que são vulnerabilidades de segurança graves.

**Ordem recomendada de execução (aguardando aprovação):**
1. Autenticação real → Middleware de rotas → RLS completo → GPS persistente → Dashboard com dados reais
