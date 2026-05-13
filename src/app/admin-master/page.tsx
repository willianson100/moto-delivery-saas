"use client";

import styles from "./page.module.css";
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Store, 
  Clock, 
  AlertTriangle 
} from "lucide-react";

export default function AdminMaster() {
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
          <div className={styles.kpiValue}>R$ 14.850,00</div>
          <div className={`${styles.kpiSub} ${styles.up}`}>↑ 12% este mês</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Empresas Ativas</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "var(--accent-color)"}}>
              <Building2 size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>42</div>
          <div className={`${styles.kpiSub} ${styles.up}`}>+3 novas esta semana</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Total de Motoboys</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "#3B82F6"}}>
              <Users size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>315</div>
          <div className={styles.kpiSub} style={{color: "var(--text-muted)"}}>Em toda a plataforma</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Assinaturas a Vencer</span>
            <div className={styles.kpiIcon} style={{backgroundColor: "var(--warning-color)"}}>
              <CreditCard size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>5</div>
          <div className={`${styles.kpiSub} ${styles.down}`}>Vencem em 7 dias</div>
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
                <th>Empresa</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Motoboys</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Pizzaria Napoli", status: "active", statusText: "Ativo", plan: "Profissional", drivers: 12 },
                { name: "Hamburgueria Texas", status: "active", statusText: "Ativo", plan: "Profissional", drivers: 8 },
                { name: "Açaí do Bom", status: "trial", statusText: "Teste (12 dias)", plan: "Trial", drivers: 3 },
                { name: "Sushi Express", status: "active", statusText: "Ativo", plan: "Básico", drivers: 5 },
                { name: "Distribuidora Gelada", status: "expired", statusText: "Vencido", plan: "Profissional", drivers: 15 },
              ].map((tenant, i) => (
                <tr key={i}>
                  <td>
                    <div style={{display: "flex", alignItems: "center", gap: "0.8rem"}}>
                      <div style={{width: "32px", height: "32px", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                        <Store size={16} color="var(--text-secondary)" />
                      </div>
                      <span style={{fontWeight: 500}}>{tenant.name}</span>
                    </div>
                  </td>
                  <td><span className={`${styles.badge} ${styles[tenant.status]}`}>{tenant.statusText}</span></td>
                  <td>{tenant.plan}</td>
                  <td>{tenant.drivers} cadastrados</td>
                  <td><button className={styles.actionBtn}>Gerenciar</button></td>
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
                  <div style={{fontWeight: 600, color: "var(--text-primary)"}}>35 Empresas</div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>Pagamento em dia</div>
                </div>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                <div className={styles.kpiIcon} style={{backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--accent-color)", width: "36px", height: "36px"}}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{fontWeight: 600, color: "var(--text-primary)"}}>4 Empresas</div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>Em teste gratuito (45 dias)</div>
                </div>
              </div>
            </div>

            <div className={styles.statusItem}>
              <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                <div className={styles.kpiIcon} style={{backgroundColor: "var(--error-bg)", color: "var(--error-color)", width: "36px", height: "36px"}}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{fontWeight: 600, color: "var(--text-primary)"}}>3 Empresas</div>
                  <div style={{fontSize: "0.8rem", color: "var(--text-secondary)"}}>Assinatura vencida/bloqueada</div>
                </div>
              </div>
            </div>
          </div>
          
          <button className={styles.actionBtn} style={{width: "100%", marginTop: "1.5rem", padding: "0.8rem"}}>
            Ver Relatório Financeiro Completo
          </button>
        </div>

      </div>
    </div>
  );
}

// Criando um componente de icone fake para o CheckCircle ja que nao importamos
function CheckCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
