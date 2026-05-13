"use client";

import styles from "./page.module.css";
import { CreditCard, AlertTriangle, CheckCircle, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} color="#f59e0b" />
        </div>
        <h1 className={styles.title}>Seu período de teste expirou</h1>
        <p className={styles.subtitle}>
          Os 45 dias grátis acabaram, mas sua operação não precisa parar. <br/>
          Escolha um plano abaixo para reativar seu painel e as entregas.
        </p>
      </div>

      <div className={styles.plansGrid}>
        {/* Plano Básico */}
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <h3>Plano Essencial</h3>
            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <span className={styles.amount}>149</span>
              <span className={styles.period}>/mês</span>
            </div>
          </div>
          <ul className={styles.features}>
            <li><CheckCircle size={16} /> Até 5 motoboys ativos</li>
            <li><CheckCircle size={16} /> Rastreamento ao vivo</li>
            <li><CheckCircle size={16} /> Dashboard gerencial</li>
            <li><CheckCircle size={16} /> Suporte via chat</li>
          </ul>
          <button className={styles.planBtn}>Começar agora <ArrowRight size={18} /></button>
        </div>

        {/* Plano Profissional */}
        <div className={`${styles.planCard} ${styles.featured}`}>
          <div className={styles.featuredBadge}>MAIS POPULAR</div>
          <div className={styles.planHeader}>
            <h3>Plano Profissional</h3>
            <div className={styles.price}>
              <span className={styles.currency}>R$</span>
              <span className={styles.amount}>249</span>
              <span className={styles.period}>/mês</span>
            </div>
          </div>
          <ul className={styles.features}>
            <li><CheckCircle size={16} /> Motoboys ilimitados</li>
            <li><CheckCircle size={16} /> Integração WhatsApp</li>
            <li><CheckCircle size={16} /> Automações de status</li>
            <li><CheckCircle size={16} /> Suporte Prioritário 24/7</li>
            <li><CheckCircle size={16} /> Relatórios Financeiros</li>
          </ul>
          <button className={styles.planBtnFeatured}>Assinar Plano Pro <Zap size={18} /></button>
        </div>
      </div>

      <div className={styles.securityInfo}>
        <ShieldCheck size={20} />
        Pagamento 100% seguro processado por Stripe. Sem fidelidade, cancele quando quiser.
      </div>

      <div style={{marginTop: "2rem", textAlign: "center"}}>
        <Link href="/login" className={styles.logoutLink}>Sair da conta</Link>
      </div>
    </div>
  );
}
