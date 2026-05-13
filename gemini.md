# gemini.md — Constituição do Projeto MotoDelivery SaaS
**Protocolo:** V.L.A.E.G.
**Versão:** 1.0 (Auditoria Inicial)
**Última atualização:** 2026-05-12

> ⚠️ Este arquivo é a LEI do projeto. Alterá-lo requer revisão explícita.

---

## 1. Identidade do Sistema

**Nome:** MotoDelivery SaaS  
**Objetivo:** Plataforma multi-tenant para gestão de frota própria de delivery, rastreamento GPS em tempo real e automação de comunicação via WhatsApp.  
**Stack:** Next.js 16, React 19, Supabase (Auth + DB + Realtime), TypeScript

---

## 2. Modelo Multi-Tenant

O sistema suporta 3 níveis de usuários:

| Role | Acesso | Tenant |
|------|--------|--------|
| `admin_master` | Global — todos os tenants | NULL (sem tenant) |
| `tenant_admin` | Apenas seu próprio tenant | Obrigatório |
| `motoboy` | Apenas pedidos do seu tenant | Obrigatório |

**Invariante:** Um `tenant_admin` jamais pode ver dados de outro tenant.  
**Invariante:** Um `motoboy` jamais pode aceitar pedidos fora do seu tenant.  
**Invariante:** O `admin_master` é o único que pode criar/bloquear tenants.

---

## 3. Esquema de Dados (Data Schema)

### 3.1 Tabelas Existentes (definidas em supabase-schema.sql)

#### `tenants`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name TEXT NOT NULL
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `user_profiles`
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
tenant_id UUID REFERENCES tenants(id)  -- NULL para admin_master
role TEXT NOT NULL CHECK (role IN ('admin_master', 'tenant_admin', 'motoboy'))
name TEXT NOT NULL
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `orders`
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
tenant_id UUID NOT NULL REFERENCES tenants(id)
customer_name TEXT NOT NULL
customer_phone TEXT
delivery_address TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'pendente'
  -- Valores: 'pendente', 'buscando', 'em_entrega', 'entregue', 'cancelado'
total_value DECIMAL(10, 2)
motoboy_id UUID REFERENCES user_profiles(id)
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### 3.2 Tabelas AUSENTES (precisam ser criadas)

#### `motoboy_locations` (FALTANTE — BLOQUEADOR)
```sql
-- Necessária para GPS em tempo real
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
motoboy_id UUID NOT NULL REFERENCES user_profiles(id)
tenant_id UUID NOT NULL REFERENCES tenants(id)
latitude DECIMAL(10, 8) NOT NULL
longitude DECIMAL(11, 8) NOT NULL
accuracy FLOAT
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `order_status_log` (FALTANTE — IMPORTANTE)
```sql
-- Audit trail do ciclo de vida de cada pedido
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
order_id UUID NOT NULL REFERENCES orders(id)
old_status TEXT
new_status TEXT NOT NULL
changed_by UUID REFERENCES user_profiles(id)
changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
notes TEXT
```

#### `subscriptions` (FALTANTE — NECESSÁRIO PARA SAAS)
```sql
-- Controle de assinaturas por tenant
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
tenant_id UUID NOT NULL REFERENCES tenants(id)
plan TEXT NOT NULL CHECK (plan IN ('trial', 'basic', 'professional'))
status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'expired', 'blocked'))
trial_ends_at TIMESTAMP WITH TIME ZONE
expires_at TIMESTAMP WITH TIME ZONE
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

---

## 4. Fluxo de Pedido (Máquina de Estados)

```
pendente → buscando → em_entrega → entregue
                ↓
            cancelado
```

**Transições permitidas:**
- `pendente` → `buscando` (motoboy aceita pedido)
- `buscando` → `em_entrega` (motoboy coletou no restaurante)
- `em_entrega` → `entregue` (motoboy confirma entrega)
- Qualquer estado → `cancelado` (apenas tenant_admin ou admin_master)

---

## 5. Regras de Autenticação e Autorização

### RLS Policies (Supabase Row Level Security)

**Políticas existentes:**
- `user_profiles` → SELECT: usuário vê apenas seu próprio perfil
- `orders` → SELECT: tenant_admin e motoboy veem apenas pedidos do seu tenant

**Políticas AUSENTES (bloqueadores críticos):**
- `orders` → INSERT: apenas `tenant_admin` pode criar pedidos
- `orders` → UPDATE: apenas `tenant_admin` ou o `motoboy` responsável pode atualizar
- `tenants` → SELECT/INSERT/UPDATE: apenas `admin_master`
- `user_profiles` → INSERT: apenas `admin_master` ou `tenant_admin` do mesmo tenant
- `motoboy_locations` → INSERT/UPDATE: apenas o próprio motoboy
- `motoboy_locations` → SELECT: tenant_admin do mesmo tenant

### Rotas Protegidas (Middleware ausente)
| Rota | Role Necessária | Status |
|------|----------------|--------|
| `/dashboard` | `tenant_admin` | 🔴 Desprotegida |
| `/admin-master` | `admin_master` | 🔴 Desprotegida |
| `/motoboy` | `motoboy` | 🔴 Desprotegida |
| `/tracking/[id]` | Pública | ✅ Correto |
| `/login` | Pública | ✅ Correto |

---

## 6. Invariantes Arquiteturais

1. **Nunca armazenar dados sensíveis no cliente** — apenas `NEXT_PUBLIC_*` no frontend
2. **RLS é obrigatório em todas as tabelas** — nunca desabilitar
3. **GPS só pode ser transmitido se o motoboy estiver autenticado**
4. **O ID do motoboy logado deve vir do Supabase Auth (`auth.uid()`)**, nunca hardcoded
5. **WhatsApp/Evolution API nunca deve ser chamada direto do frontend** — deve ser via API route do Next.js
6. **Tokens e chaves de APIs externas (Evolution API, Google Maps) devem estar somente em variáveis server-side** (sem prefixo `NEXT_PUBLIC_`)

---

## 7. Integrações Externas

| Serviço | Status | Variável de Ambiente |
|---------|--------|----------------------|
| Supabase Auth + DB | ✅ Configurado (chave ANON) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Evolution API (WhatsApp) | ❌ Não configurado | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` (faltam) |
| Google Maps | ❌ Não configurado | `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (falta) |
| Supabase Realtime | ❌ Não implementado | Usa o mesmo cliente Supabase |

---

## 8. Log de Manutenção

| Data | Alteração | Responsável |
|------|-----------|-------------|
| 2026-05-12 | Documento criado — auditoria inicial | Antigravity (V.L.A.E.G.) |
