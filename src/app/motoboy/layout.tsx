"use client";

import React from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { Home, History, Wallet, User } from "lucide-react";

export default function MotoboyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", justifyContent: "center"}}>
      <div className={styles.mobileLayout}>
        <main className={styles.mainContent}>
          {children}
        </main>
        
        {/* Bottom Navigation */}
        <nav className={styles.bottomNav}>
          <Link href="/motoboy" className={`${styles.navItem} ${styles.active}`}>
            <Home size={24} />
            <span>Início</span>
          </Link>
          <Link href="#" className={styles.navItem}>
            <History size={24} />
            <span>Histórico</span>
          </Link>
          <Link href="#" className={styles.navItem}>
            <Wallet size={24} />
            <span>Ganhos</span>
          </Link>
          <Link href="#" className={styles.navItem}>
            <User size={24} />
            <span>Perfil</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
