# task_plan.md — MotoDelivery SaaS
**Protocolo:** V.L.A.E.G.
**Status Geral:** 🔴 FASE INICIAL — Auditoria em andamento

---

## Fase Atual: Protocolo 0 — Inicialização + Auditoria

### Checklist de Arquivos de Memória
- [x] `task_plan.md` criado
- [x] `findings.md` criado
- [x] `progress.md` criado
- [x] `gemini.md` criado

---

## Blueprint: Fases do Projeto

### FASE V — Visão (Definição do que o sistema deve fazer)
- [ ] Definir os 5 fluxos principais (pedido → aceito → em entrega → entregue → notificação)
- [ ] Mapear todas as integrações necessárias (Supabase, Maps, WhatsApp/Evolution API)
- [ ] Validar o modelo multi-tenant
- [ ] Confirmar esquema de dados em `gemini.md`

### FASE L — Link (Conectividade e credenciais)
- [ ] Testar conexão com Supabase (URL + ANON_KEY)
- [ ] Verificar se as tabelas do schema SQL foram aplicadas no Supabase
- [ ] Testar se RLS está ativo e funcionando
- [ ] Verificar se a Evolution API (WhatsApp) está configurada
- [ ] Verificar integração Google Maps

### FASE A — Arquitetura (O que precisa ser construído)
- [ ] Implementar autenticação real com Supabase Auth
- [ ] Implementar guards de rota (proteger /dashboard, /admin-master, /motoboy)
- [ ] Conectar Dashboard ao banco de dados (substituir dados falsos)
- [ ] Conectar App do Motoboy ao Supabase (GPS real)
- [ ] Implementar Realtime (WebSockets) para pedidos
- [ ] Implementar Admin Master com dados reais
- [ ] Criar tabela `locations` para GPS dos motoboys
- [ ] Criar sistema de logs de auditoria

### FASE E — Estilo (Refinamento)
- [ ] Implementar mapa real (Google Maps ou Mapbox)
- [ ] Implementar gráficos com Recharts (atualmente são placeholders)
- [ ] PWA manifest para App Motoboy
- [ ] Responsividade mobile revisada

### FASE G — Gatilho (Deploy)
- [ ] Configurar variáveis de ambiente em produção
- [ ] Deploy no Vercel ou similar
- [ ] Configurar domínio customizado
- [ ] Configurar webhooks e automações WhatsApp

---

## Prioridade Imediata (Bloqueadores Críticos)
1. 🔴 Login não tem autenticação real — qualquer email/senha concede acesso
2. 🔴 Todas as rotas são públicas e desprotegidas
3. 🔴 GPS do motoboy apenas loga no console — não salva no banco
4. 🔴 Dashboard com dados 100% hardcoded (fictícios)
5. 🔴 Admin Master sem proteção — acessível por qualquer usuário
6. 🟡 Schema SQL incompleto (falta tabela `locations` para GPS)
7. 🟡 Chave Supabase ANON exposta no .env.local sem configuração SSR
