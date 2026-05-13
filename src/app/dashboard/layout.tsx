"use client";

import React, { useState } from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Map, 
  ShoppingBag, 
  Bike, 
  Users, 
  Headset, 
  MessageSquare, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Search,
  Bell,
  Menu,
  ChevronDown,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";

import { createClient } from "@/lib/supabase/browser";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tenantName, setTenantName] = useState("Carregando...");
  const supabase = createClient();

  useEffect(() => {
    const fetchTenant = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        
        if (profile?.tenant_id) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("name")
            .eq("id", profile.tenant_id)
            .single();
          if (tenant) setTenantName(tenant.name);
        }
      }
    };
    fetchTenant();
  }, []);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Bike size={20} />
          </div>
          <span>MotoDelivery SaaS</span>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="#" className={styles.navItem}>
            <Map size={20} /> Mapa ao vivo
          </Link>
          <Link href="#" className={styles.navItem}>
            <ShoppingBag size={20} /> Pedidos
            <span className={styles.navBadge}>24</span>
          </Link>
          <Link href="/dashboard/whatsapp" className={styles.navItem}>
            <MessageSquare size={20} /> WhatsApp
          </Link>
          <Link href="#" className={styles.navItem}>
            <Bike size={20} /> Motoboys
          </Link>
          <Link href="#" className={styles.navItem}>
            <Users size={20} /> Clientes
          </Link>
          <Link href="#" className={styles.navItem}>
            <Headset size={20} /> Atendimento
            <span className={styles.navBadgeGreen}>3</span>
          </Link>
          <Link href="#" className={styles.navItem}>
            <MessageSquare size={20} /> Mensagens
            <span className={styles.navBadge} style={{backgroundColor: "var(--accent-color)"}}>NOVO</span>
          </Link>
          <Link href="#" className={styles.navItem}>
            <Wallet size={20} /> Financeiro
          </Link>
          <Link href="#" className={styles.navItem}>
            <CreditCard size={20} /> Assinatura
          </Link>
          <Link href="#" className={styles.navItem}>
            <BarChart3 size={20} /> Relatórios
          </Link>
          <Link href="#" className={styles.navItem}>
            <Settings size={20} /> Configurações
          </Link>
          <Link href="#" className={styles.navItem}>
            <HelpCircle size={20} /> Ajuda
          </Link>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.planCard}>
            <h4><CheckCircle2 size={16} color="var(--success-color)" /> Plano Profissional</h4>
            <p>Ativo até 11/06/2026</p>
            <button className={styles.planBtn}>Gerenciar plano</button>
          </div>
          
          <div className={styles.userProfile} style={{marginTop: "1rem"}}>
            <Image src="https://i.pravatar.cc/150?img=11" alt="Avatar" width={36} height={36} className={styles.avatar} />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{tenantName}</span>
              <span className={styles.userRole}>ID: #12568</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
            <div className={styles.restaurantSelector}>
              {tenantName} <ChevronDown size={16} color="var(--text-secondary)" />
            </div>
            <div className={styles.onlineStatus}>
              <div className={styles.onlineDot}></div>
              Online
            </div>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.searchBar}>
              <Search size={18} color="var(--text-muted)" />
              <input type="text" placeholder="Buscar (pedido, cliente, motoboy...)" />
            </div>

            <button className={styles.iconBtn}>
              <MessageSquare size={20} />
              <span className={styles.notificationDot} style={{backgroundColor: "var(--success-color)"}}>12</span>
            </button>

            <button className={styles.iconBtn}>
              <Bell size={20} />
              <span className={styles.notificationDot}>8</span>
            </button>

            <div className={styles.userProfile}>
              <Image src="https://i.pravatar.cc/150?img=11" alt="Avatar" width={36} height={36} className={styles.avatar} />
              <div className={styles.userInfo}>
                <span className={styles.userName}>João Silva</span>
                <span className={styles.userRole}>Administrador</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>
    </div>
  );
}
