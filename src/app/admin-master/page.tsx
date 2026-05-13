"use client";

import styles from "./page.module.css";
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Store, 
  Clock, 
  AlertTriangle,
  CheckCircle
} from "lucide-react";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function AdminMaster() {
  const supabase = createClient();
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState({
    mrr: 0,
    activeTenants: 0,
    totalMotoboys: 0,
    trialTenants: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Buscar Tenants
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      
      setTenants(tenantData || []);

      // 2. Buscar Contagem de Motoboys
      const { count: motoboyCount } = await supabase
        .from("user_profiles")
        .select("*", { count: 'exact', head: true })
        .eq("role", "motoboy");

      // 3. Calcular Stats (Simulado por enquanto com base nos dados reais)
      const active = tenantData?.filter(t => t.subscription_status === "active").length || 0;
      const trial = tenantData?.filter(t => t.subscription_status === "trial").length || 0;
      
      setStats({
        mrr: active * 249.90, // Exemplo de valor por plano
        activeTenants: active,
        totalMotoboys: motoboyCount || 0,
        trialTenants: trial
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className={styles.dashboard}>Carregando dados mestre...</div>;

  return (
    <div className={styles.dashboard}>
      
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel Master (SaaS)</h1>
          <p className={styles.subtitle}>Visão global de todos os estabelecimentos, assinaturas e faturamento.</p>
        </div>
        <button className={styles.actionBtn} style={{backgroundColor: "var(--accent-color)", color: "white", border: "none", padding: "0.8rem 1.5rem", fontSize: "0.95rem"}}>
          + Nova Empresa
        </button>
      </div>

      {/* KPIs Gerais do SaaS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Receita Mensal (MRR)</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "var(--success-color)"}}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className={`${styles.kpiSub} ${styles.up}`}>↑ Baseado em {stats.activeTenants} ativos</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Empresas Ativas</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "var(--accent-color)"}}>
              <Building2 size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.activeTenants}</div>
          <div className={`${styles.kpiSub} ${styles.up}`}>+ {stats.trialTenants} em trial</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Total de Motoboys</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "#3B82F6"}}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.totalMotoboys}</div>
          <div className={styles.kpiSub} style={{color: "var(--text-muted)"}}>Em toda a plataforma</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Trial Ativos</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "var(--warning-color)"}}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{stats.trialTenants}</div>
          <div className={`${styles.kpiSub} ${styles.down}`}>Convertendo em breve</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Lista de Empresas (Tenants) */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Estabelecimentos Cadastrados</h2>
            <button className={styles.actionBtn}>Ver todos</button>
          </div>
          
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa / Documento</th>
                <th>Endereço / IP</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div style={{display: "flex", alignItems: "center", gap: "0.8rem"}}>
                      <div style={{width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                        <Store size={16} color="var(--text-secondary)" />
                      </div>
                      <div>
                        <div style={{fontWeight: 600}}>{tenant.name}</div>
                        <div style={{fontSize: "0.7rem", color: "var(--text-muted)"}}>{tenant.tax_id || "Sem documento"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{fontSize: "0.85rem", color: "var(--text-secondary)"}}>
                      {tenant.street ? `${tenant.street}, ${tenant.number}` : "Sem endereço"}
                      <div style={{fontSize: "0.7rem", opacity: 0.6}}>IP: {tenant.registration_ip || "Desconhecido"}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[tenant.subscription_status || 'trial']}`}>
                      {tenant.subscription_status === 'active' ? 'Ativo' : (tenant.subscription_status === 'trial' ? 'Teste' : (tenant.subscription_status === 'blocked' ? 'Bloqueado' : 'Expirado'))}
                    </span>
                  </td>
                  <td>{tenant.plan || 'Trial'}</td>
                  <td>{new Date(tenant.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{display: "flex", gap: "0.5rem"}}>
                      <button className={styles.actionBtn}>Gerenciar</button>
                      <button className={styles.actionBtn} style={{backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "none"}}>Bloquear</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo de Status */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Resumo de Operação</h2>
          </div>

          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                <div className={styles.kpiIcon} style={{backgroundColor: "var(--success-bg)", color: "var(--success-color)", width: "36px", height: "36px"}}>
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div style={{fontWeight: 600, color: "var(--text-primary)"}}>{stats.activeTenants} Empresas</div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>Assinaturas pagas</div>
                </div>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                <div className={styles.kpiIcon} style={{backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--accent-color)", width: "36px", height: "36px"}}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{fontWeight: 600, color: "var(--text-primary)"}}>{stats.trialTenants} Empresas</div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>Em teste gratuito</div>
                </div>
              </div>
            </div>
          </div>
          
          <button className={styles.actionBtn} style={{width: "100%", marginTop: "1.5rem", padding: "0.8rem"}}>
            Configurar Planos e Preços
          </button>
        </div>
      </div>
    </div>
  );
}

