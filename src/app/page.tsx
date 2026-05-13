"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import LogoutButton from "@/components/LogoutButton";

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <div className={styles.container}>
      <header style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "1.5rem 2rem",
        display: "flex",
        justifyContent: "flex-end"
      }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Olá, <strong>{user.email}</strong>
            </span>
            <LogoutButton />
          </div>
        ) : (
          <Link href="/login" className="btn-primary" style={{ textDecoration: "none" }}>
            Fazer Login
          </Link>
        )}
      </header>

      <main className={`${styles.main} animate-fade-in`}>
        <div className={styles.hero}>
          <h1 className="text-gradient">MotoDelivery SaaS</h1>
          <p>
            Plataforma premium para gestão de frota própria, rastreamento em tempo real e automação via WhatsApp.
          </p>
        </div>

        <div className={styles.cards}>
          <Link href="/admin-master" className={`${styles.card} glass-panel`}>
            <div className={styles.cardIcon}>🛡️</div>
            <h2>Admin Master</h2>
            <p>Painel de controle do dono do SaaS. Gerencie planos, empresas e MRR.</p>
          </Link>

          <Link href="/dashboard" className={`${styles.card} glass-panel`}>
            <div className={styles.cardIcon}>🏢</div>
            <h2>Estabelecimento</h2>
            <p>Dashboard da empresa. Acompanhe motoboys no mapa e gerencie pedidos.</p>
          </Link>

          <Link href="/motoboy" className={`${styles.card} glass-panel`}>
            <div className={styles.cardIcon}>🏍️</div>
            <h2>Motoboy App</h2>
            <p>Aplicativo PWA para entregadores aceitarem rotas e transmitirem GPS.</p>
          </Link>
          
          <Link href="/tracking/demo" className={`${styles.card} glass-panel`}>
            <div className={styles.cardIcon}>📍</div>
            <h2>Live Tracking</h2>
            <p>Página do cliente final com mapa em tempo real e tempo estimado.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
