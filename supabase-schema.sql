-- ============================================================
-- SCHEMA MOTODELIVERY SAAS — V2.0 (Fase L - Completo)
-- Protocolo V.L.A.E.G.
-- ============================================================
-- ATENÇÃO: Execute este script no SQL Editor do Supabase.
-- Este script é idempotente — pode ser rodado mais de uma vez.
-- ============================================================

-- Extensão necessária para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA: tenants (Empresas/Restaurantes)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,                              -- URL amigável (ex: pizzaria-napoli)
  tax_id TEXT UNIQUE,                            -- CNPJ ou CPF para evitar múltiplos trials
  registration_ip TEXT,                          -- IP de cadastro para segurança
  -- Endereço Físico
  cep TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'basic', 'professional')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('active', 'trial', 'expired', 'blocked')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '45 days'),
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  whatsapp_number TEXT,
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA: user_profiles (Perfis vinculados ao Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- NULL para admin_master
  role TEXT NOT NULL CHECK (role IN ('admin_master', 'tenant_admin', 'motoboy')),
  name TEXT NOT NULL,
  phone TEXT,
  -- Campos específicos para motoboys
  vehicle_model TEXT,
  vehicle_plate TEXT,
  bag_capacity INTEGER DEFAULT 3,
  -- Status operacional e GPS
  is_online BOOLEAN DEFAULT FALSE,
  is_at_restaurant BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA: orders (Pedidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT NOT NULL,
  restaurant_address TEXT,                      -- Ponto de coleta
  items JSONB,                                  -- [{name, qty, price}]
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'buscando', 'em_entrega', 'entregue', 'cancelado')),
  total_value DECIMAL(10, 2),
  delivery_fee DECIMAL(10, 2),
  motoboy_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  estimated_delivery_minutes INTEGER,
  notes TEXT,                                   -- Observações gerais
  pickup_notes TEXT,                            -- Instruções de coleta
  route_color_tag TEXT,                         -- blue, green, yellow, etc
  delivery_zone TEXT,                           -- ex: Zona Norte
  distance_km DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA: motoboy_locations (GPS em Tempo Real)
-- ============================================================
CREATE TABLE IF NOT EXISTS motoboy_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motoboy_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy FLOAT,
  heading FLOAT,                                -- Direção em graus (0-360)
  speed FLOAT,                                  -- Velocidade em m/s
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas rápidas por motoboy
CREATE UNIQUE INDEX IF NOT EXISTS idx_motoboy_locations_motoboy_id
  ON motoboy_locations(motoboy_id);

-- ============================================================
-- 5. TABELA: order_status_log (Trilha de Auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA: motoboy_active_orders (Fila de entrega atual)
-- ============================================================
CREATE TABLE IF NOT EXISTS motoboy_active_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  motoboy_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  sequence_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(motoboy_id, order_id)
);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) — O coração do Multi-tenant
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoboy_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoboy_active_orders ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: tenants
-- ──────────────────────────────────────────────────────────

-- admin_master vê todos os tenants
DROP POLICY IF EXISTS "admin_master can view all tenants" ON tenants;
CREATE POLICY "admin_master can view all tenants" ON tenants
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_master'
  );

-- tenant_admin e motoboy veem apenas seu próprio tenant
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT USING (
    id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- Apenas admin_master pode criar tenants
DROP POLICY IF EXISTS "admin_master can insert tenants" ON tenants;
CREATE POLICY "admin_master can insert tenants" ON tenants
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_master'
  );

-- Apenas admin_master pode atualizar tenants
DROP POLICY IF EXISTS "admin_master can update tenants" ON tenants;
CREATE POLICY "admin_master can update tenants" ON tenants
  FOR UPDATE USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_master'
  );

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: user_profiles
-- ──────────────────────────────────────────────────────────

-- Usuário vê o próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- admin_master vê todos os perfis
DROP POLICY IF EXISTS "admin_master can view all profiles" ON user_profiles;
CREATE POLICY "admin_master can view all profiles" ON user_profiles
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_master'
  );

-- tenant_admin vê motoboys do seu tenant
DROP POLICY IF EXISTS "tenant_admin can view their motoboys" ON user_profiles;
CREATE POLICY "tenant_admin can view their motoboys" ON user_profiles
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'tenant_admin'
  );

-- tenant_admin pode criar motoboys no seu tenant
DROP POLICY IF EXISTS "tenant_admin can insert motoboys" ON user_profiles;
CREATE POLICY "tenant_admin can insert motoboys" ON user_profiles
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'tenant_admin'
    AND role = 'motoboy' -- só pode criar motoboys, não outros admins
  );

-- Usuário pode atualizar o próprio perfil (ex: foto, veículo)
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: orders
-- ──────────────────────────────────────────────────────────

-- tenant_admin vê pedidos do seu tenant
DROP POLICY IF EXISTS "tenant_admin can view their orders" ON orders;
CREATE POLICY "tenant_admin can view their orders" ON orders
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'tenant_admin'
  );

-- motoboy vê apenas pedidos atribuídos a ele
DROP POLICY IF EXISTS "motoboy can view assigned orders" ON orders;
CREATE POLICY "motoboy can view assigned orders" ON orders
  FOR SELECT USING (
    motoboy_id = auth.uid()
    OR (
      tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
      AND status = 'pendente'
      AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'motoboy'
    )
  );

-- admin_master vê todos os pedidos
DROP POLICY IF EXISTS "admin_master can view all orders" ON orders;
CREATE POLICY "admin_master can view all orders" ON orders
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin_master'
  );

-- tenant_admin pode criar pedidos no seu tenant
DROP POLICY IF EXISTS "tenant_admin can insert orders" ON orders;
CREATE POLICY "tenant_admin can insert orders" ON orders
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'tenant_admin'
  );

-- tenant_admin pode atualizar qualquer pedido do seu tenant
DROP POLICY IF EXISTS "tenant_admin can update their orders" ON orders;
CREATE POLICY "tenant_admin can update their orders" ON orders
  FOR UPDATE USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'tenant_admin'
  );

-- motoboy pode atualizar status do pedido atribuído a ele
DROP POLICY IF EXISTS "motoboy can update assigned order status" ON orders;
CREATE POLICY "motoboy can update assigned order status" ON orders
  FOR UPDATE USING (
    motoboy_id = auth.uid()
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'motoboy'
  );

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: motoboy_locations
-- ──────────────────────────────────────────────────────────

-- Motoboy só escreve a própria localização
DROP POLICY IF EXISTS "motoboy can upsert own location" ON motoboy_locations;
CREATE POLICY "motoboy can upsert own location" ON motoboy_locations
  FOR ALL USING (motoboy_id = auth.uid());

-- tenant_admin lê localização dos motoboys do seu tenant
DROP POLICY IF EXISTS "tenant_admin can view motoboy locations" ON motoboy_locations;
CREATE POLICY "tenant_admin can view motoboy locations" ON motoboy_locations
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    AND (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('tenant_admin', 'admin_master')
  );

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: motoboy_active_orders
-- ──────────────────────────────────────────────────────────

-- Motoboy vê seus próprios pedidos ativos
DROP POLICY IF EXISTS "motoboy can view own active orders" ON motoboy_active_orders;
CREATE POLICY "motoboy can view own active orders" ON motoboy_active_orders
  FOR SELECT USING (motoboy_id = auth.uid());

-- tenant_admin vê todos os pedidos ativos do tenant
DROP POLICY IF EXISTS "tenant_admin can view all active orders" ON motoboy_active_orders;
CREATE POLICY "tenant_admin can view all active orders" ON motoboy_active_orders
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- Motoboy pode inserir (aceitar) pedidos
DROP POLICY IF EXISTS "motoboy can accept orders" ON motoboy_active_orders;
CREATE POLICY "motoboy can accept orders" ON motoboy_active_orders
  FOR INSERT WITH CHECK (motoboy_id = auth.uid());

-- ──────────────────────────────────────────────────────────
-- POLÍTICAS: order_status_log
-- ──────────────────────────────────────────────────────────

-- Apenas leitura para tenant_admin (auditoria)
DROP POLICY IF EXISTS "tenant_admin can view order logs" ON order_status_log;
CREATE POLICY "tenant_admin can view order logs" ON order_status_log
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- Sistema insere logs automaticamente via trigger
DROP POLICY IF EXISTS "System can insert order logs" ON order_status_log;
CREATE POLICY "System can insert order logs" ON order_status_log
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 7. TRIGGER: Criar user_profile ao registrar usuário
-- ============================================================
-- Permite criar o perfil automaticamente via metadata do signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant_admin'),
    (NEW.raw_user_meta_data->>'tenant_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 8. TRIGGER: Log automático de mudança de status de pedido
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_log (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_status_changed ON orders;
CREATE TRIGGER on_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE public.log_order_status_change();

-- ============================================================
-- 9. HABILITAR REALTIME nas tabelas críticas
-- ============================================================
-- Execute estas linhas no painel do Supabase → Database → Replication
-- ou via SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE motoboy_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE motoboy_active_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- ============================================================
-- 10. USUÁRIO DE TESTE (admin_master)
-- ============================================================
-- INSTRUÇÃO: Crie o usuário abaixo manualmente no painel:
-- Supabase → Authentication → Users → Add user
-- Email: admin@motodelivery.com
-- Password: Admin@123456
-- Metadata (JSON): {"name": "Admin Master", "role": "admin_master"}
--
-- Ou via API:
-- curl -X POST 'https://SEU_PROJETO.supabase.co/auth/v1/admin/users' \
--   -H 'apikey: SUA_SERVICE_ROLE_KEY' \
--   -H 'Authorization: Bearer SUA_SERVICE_ROLE_KEY' \
--   -H 'Content-Type: application/json' \
--   -d '{"email":"admin@motodelivery.com","password":"Admin@123456","user_metadata":{"name":"Admin Master","role":"admin_master"}}'
