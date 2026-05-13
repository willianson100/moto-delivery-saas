"use client";

import styles from "./page.module.css";
import { 
  ShoppingCart, Map, Users, Clock, AlertCircle, Banknote,
  Navigation, CheckCircle2, AlertTriangle, MessageCircle,
  PlusCircle, UserPlus, Send, ClipboardList, Settings
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import AddMotoboyModal from "@/components/AddMotoboyModal";
import AddOrderModal from "@/components/AddOrderModal";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [isAddMotoboyOpen, setIsAddMotoboyOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [motoboys, setMotoboys] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    inDelivery: 0,
    onlineMotoboys: 0,
    totalRevenue: 0,
    avgTime: "30 min",
    delayedCount: 0
  });

  const fetchData = async () => {
    // 1. Motoboys
    const { data: motoboysData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "motoboy");
    
    if (motoboysData) {
      setMotoboys(motoboysData);
      setStats(prev => ({
        ...prev,
        onlineMotoboys: motoboysData.filter(m => m.is_online).length
      }));
    }

    // 2. Pedidos do dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData);
      const inDeliveryCount = ordersData.filter(o => o.status === "em_entrega" || o.status === "buscando").length;
      const revenue = ordersData.reduce((acc, o) => acc + Number(o.total_value || 0), 0);
      
      setStats(prev => ({
        ...prev,
        todayOrders: ordersData.length,
        inDelivery: inDeliveryCount,
        totalRevenue: revenue
      }));
    }
  };

  useEffect(() => {
    fetchData();

    const motoboyChannel = supabase
      .channel("motoboy_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_profiles" }, () => fetchData())
      .subscribe();

    const orderChannel = supabase
      .channel("order_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(motoboyChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  return (
    <div className={styles.dashboard}>
      <AddMotoboyModal isOpen={isAddMotoboyOpen} onClose={() => setIsAddMotoboyOpen(false)} />
      <AddOrderModal isOpen={isAddOrderOpen} onClose={() => setIsAddOrderOpen(false)} />

      {/* 1. KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "var(--accent-color)"}}>
            <ShoppingCart size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Pedidos hoje</span>
            <span className={styles.kpiValue}>{stats.todayOrders}</span>
            <span className={`${styles.kpiSub} ${styles.neutral}`}>Atualizado agora</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "#3B82F6"}}>
            <Map size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Em entrega</span>
            <span className={styles.kpiValue}>{stats.inDelivery}</span>
            <span className={`${styles.kpiSub} ${styles.neutral}`}>Tempo real</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "var(--success-color)"}}>
            <Users size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Motoboys online</span>
            <span className={styles.kpiValue}>{stats.onlineMotoboys}</span>
            <span className={`${styles.kpiSub} ${styles.neutral}`}>de {motoboys.length}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "var(--warning-color)"}}>
            <Clock size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Tempo médio</span>
            <span className={styles.kpiValue}>{stats.avgTime}</span>
            <span className={`${styles.kpiSub} ${styles.neutral}`}>Média diária</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "var(--error-color)"}}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Atrasados</span>
            <span className={styles.kpiValue}>{stats.delayedCount}</span>
            <span className={`${styles.kpiSub} ${styles.neutral}`}>Alerta crítico</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{backgroundColor: "#059669"}}>
            <Banknote size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Faturamento</span>
            <span className={styles.kpiValue}>R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            <span className={`${styles.kpiSub} ${styles.up}`}>Vendas brutas</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Grid */}
      <div className={styles.mainGrid}>
        
        {/* Mapa Ao Vivo */}
        <div className={`${styles.panel} ${styles.mapPanel}`}>
          <div className={styles.mapHeader}>
            <div className={styles.mapTitleBadge}>
              Mapa ao vivo
              <div className={styles.statusDot} style={{backgroundColor: "var(--success-color)", boxShadow: "0 0 5px var(--success-color)"}}></div>
            </div>
            <button className={styles.mapViewRoutes}>Ver rotas</button>
          </div>
          <div style={{width: "100%", height: "100%", background: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center"}}>
             <div style={{textAlign: "center"}}>
                <Navigation size={48} color="var(--accent-color)" style={{marginBottom: "1rem", opacity: 0.5}} />
                <p style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>Visualizando {stats.onlineMotoboys} motoboys ativos</p>
             </div>
          </div>
        </div>

        {/* Entregas em andamento */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Entregas em andamento</span>
            <button className={styles.panelAction}>Ver todas</button>
          </div>
          <div className={styles.list}>
            {orders.filter(o => o.status !== "entregue").length === 0 ? (
              <div style={{textAlign: "center", padding: "2rem", color: "var(--text-muted)"}}>Sem entregas agora</div>
            ) : (
              orders.filter(o => o.status !== "entregue").map((order) => (
                <div className={styles.listItem} key={order.id}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>Pedido #{order.id.toString().slice(0, 5)}</span>
                    <span className={styles.itemDesc}>{order.customer_name}</span>
                    <div className={styles.itemStatus}>
                      <div className={styles.statusDot} style={{backgroundColor: "var(--accent-color)"}}></div>
                      <span style={{color: "var(--accent-color)"}}>{order.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <button className={styles.btnPrimary}>Rota</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WhatsApp */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Atendimento</span>
            <div className={styles.statusDot} style={{backgroundColor: "var(--success-color)"}}></div>
          </div>
          <div className={styles.chatTabs}>
            <span className={`${styles.chatTab} ${styles.active}`}>Todas</span>
            <span className={styles.chatTab}>Não lidas</span>
          </div>
          <div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", opacity: 0.5}}>
             <MessageCircle size={40} />
             <p style={{fontSize: "0.85rem"}}>Conecte seu WhatsApp</p>
          </div>
          <button className={styles.btnPrimary} onClick={() => router.push("/dashboard/whatsapp")}>Ir para WhatsApp</button>
        </div>
      </div>

      {/* 3. Bottom Grid */}
      <div className={styles.mainGrid}>
        
        {/* Pedidos recentes */}
        <div className={styles.panel}>
           <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Pedidos recentes</span>
          </div>
          <div className={styles.list}>
            {orders.length === 0 ? (
              <div style={{textAlign: "center", padding: "2rem", color: "var(--text-muted)"}}>Nenhum pedido hoje</div>
            ) : (
              orders.slice(0, 4).map((p) => (
                 <div className={styles.listItem} key={p.id} style={{justifyContent: "space-between"}}>
                    <div style={{display: "flex", flexDirection: "column"}}>
                      <span className={styles.itemName}>{p.customer_name}</span>
                      <span className={styles.itemDesc}>{p.delivery_address}</span>
                    </div>
                    <span className={styles.itemName}>R$ {Number(p.total_value).toFixed(2)}</span>
                 </div>
              ))
            )}
          </div>
        </div>

        {/* Motoboys online */}
        <div className={styles.panel}>
           <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Status dos Motoboys</span>
          </div>
          <div className={styles.list}>
            {motoboys.length === 0 ? (
              <div style={{textAlign: "center", padding: "2rem", color: "var(--text-muted)"}}>Sem motoboys cadastrados</div>
            ) : (
              motoboys.map((m) => (
                <div className={styles.listItem} key={m.id}>
                  <Image src={m.avatar_url || `https://i.pravatar.cc/150?u=${m.id}`} alt="Avatar" width={40} height={40} className={styles.itemAvatar} />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{m.name}</span>
                    <div className={styles.itemStatus}>
                      <div className={styles.statusDot} style={{backgroundColor: m.is_online ? "var(--success-color)" : "var(--text-muted)"}}></div>
                      <span style={{color: m.is_online ? "var(--success-color)" : "var(--text-muted)"}}>
                        {m.is_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <div style={{fontSize: "0.75rem", color: "var(--text-muted)"}}>
                    {m.bag_capacity || "8"} unid.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financeiro */}
        <div className={styles.panel} style={{gridColumn: "span 2"}}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Resumo Financeiro</span>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem"}}>
             <div>
                <p style={{fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem"}}>Faturamento hoje</p>
                <h3 style={{fontSize: "1.8rem", color: "var(--success-color)"}}>R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</h3>
             </div>
             <div className={styles.chartPlaceholder} style={{height: "100px", marginTop: 0}}>
                (Gráfico de Tendência)
             </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bottom Bar */}
      <div className={styles.quickActions}>
        <button className={`${styles.quickActionBtn} ${styles.primaryAction}`} onClick={() => setOrderModalOpen(true)}>
          <PlusCircle /> <span>Novo pedido</span>
        </button>
        <button className={styles.quickActionBtn} onClick={() => setMotoboyModalOpen(true)}>
          <UserPlus /> <span>Novo motoboy</span>
        </button>
        <button className={styles.quickActionBtn} onClick={() => window.location.href = '/dashboard/whatsapp'}>
          <Send /> <span>Mensagem</span>
        </button>
        <button className={styles.quickActionBtn} onClick={() => alert('Relatório em desenvolvimento')}>
          <ClipboardList /> <span>Relatório</span>
        </button>
        <button className={styles.quickActionBtn} onClick={() => alert('Configurações em desenvolvimento')}>
          <Settings /> <span>Ajustes</span>
        </button>
      </div>
    </div>
  );
}
