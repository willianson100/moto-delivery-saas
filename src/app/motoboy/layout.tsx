"use client";

import React from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { Home, History, User } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MotoboyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", justifyContent: "center"}}>
      <div className={styles.mobileLayout}>
        <main className={styles.mainContent}>
          {children}
        </main>
        
        {/* Bottom Navigation */}
        <nav className={styles.bottomNav}>
          <Link href="/motoboy" className={`${styles.navItem} ${pathname === "/motoboy" ? styles.active : ""}`}>
            <Home size={24} />
            <span>Início</span>
          </Link>
          <Link href="/motoboy/history" className={`${styles.navItem} ${pathname === "/motoboy/history" ? styles.active : ""}`}>
            <History size={24} />
            <span>Histórico</span>
          </Link>
          <Link href="/motoboy/profile" className={`${styles.navItem} ${pathname === "/motoboy/profile" ? styles.active : ""}`}>
            <User size={24} />
            <span>Perfil</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
