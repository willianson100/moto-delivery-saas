"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Navigation, Store, MapPin, CheckCircle, Clock, Package,
  AlertTriangle, XCircle, ChevronRight, Bike, ToggleLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

// ─── Tipos ─────────────────────────────────────────────────────────────────
type OrderStatus =
  | "pendente"
  | "selecionado"
  | "aceito"
  | "buscando"
  | "em_entrega"
  | "entregue"
  | "recusado";

type RouteColor = "blue" | "green" | "yellow" | "purple" | "orange" | "red";

interface DeliveryOrder {
  id: string;
  customer_name: string;
  address: string;
  pickup_address: string;
  delivery_zone: string;
  route_color_tag: RouteColor;
  pickup_notes: string | null;
  distance_km: number;
  sequence_number: number;
  status: OrderStatus;
  selected_by: string | null;
  selection_expires_at: string | null;
}

// ─── Cores de rota ─────────────────────────────────────────────────────────
const COLOR_MAP: Record<RouteColor, { bg: string; border: string; label: string; emoji: string }> = {
  blue:   { bg: "rgba(59,130,246,0.15)",  border: "#3b82f6", label: "Zona Norte",   emoji: "🔵" },
  green:  { bg: "rgba(34,197,94,0.15)",   border: "#22c55e", label: "Zona Sul",     emoji: "🟢" },
  yellow: { bg: "rgba(234,179,8,0.15)",   border: "#eab308", label: "Centro",       emoji: "🟡" },
  purple: { bg: "rgba(168,85,247,0.15)",  border: "#a855f7", label: "Zona Leste",   emoji: "🟣" },
  orange: { bg: "rgba(249,115,22,0.15)",  border: "#f97316", label: "Zona Oeste",   emoji: "🟠" },
  red:    { bg: "rgba(239,68,68,0.15)",   border: "#ef4444", label: "Zona Distante", emoji: "🔴" },
};

// ─── Componente de Countdown ────────────────────────────────────────────────
function Countdown({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const update = () => {
      const remaining = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) onExpire();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <span style={{
      fontWeight: 700,
      color: seconds <= 10 ? "#ef4444" : "#f59e0b",
      fontSize: "0.85rem",
    }}>
      <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
      {seconds}s
    </span>
  );
}

// ─── Card de Pedido ─────────────────────────────────────────────────────────
function OrderCard({
  order,
  myId,
  currentRouteColor,
  activeCount,
  bagCapacity,
  onAccept,
  onReject,
}: {
  order: DeliveryOrder;
  myId: string;
  currentRouteColor: RouteColor | null;
  activeCount: number;
  bagCapacity: number;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const color = COLOR_MAP[order.route_color_tag || "blue"];
  const isCompatible = !currentRouteColor || currentRouteColor === order.route_color_tag;
  const isSelectedByMe = order.selected_by === myId;
  const isSelectedByOther = order.selected_by && order.selected_by !== myId;
  const isFull = activeCount >= bagCapacity;

  const statusLabel: Record<string, { label: string; color: string }> = {
    pendente:    { label: "Disponível",         color: "#22c55e" },
    selecionado: { label: isSelectedByMe ? "Você está vendo" : "Outro motoboy vendo", color: "#f59e0b" },
    aceito:      { label: "Aceito",             color: "#3b82f6" },
    entregue:    { label: "Entregue",           color: "#6b7280" },
    recusado:    { label: "Recusado",           color: "#ef4444" },
  };

  const currentStatus = order.status || "pendente";

  return (
    <div style={{
      background: color.bg,
      border: `1.5px solid ${color.border}`,
      borderRadius: "14px",
      padding: "1rem",
      marginBottom: "0.75rem",
      opacity: isSelectedByOther ? 0.65 : 1,
      transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{color.emoji}</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{order.customer_name || "Pedido s/ nome"}</span>
            <div style={{ fontSize: "0.75rem", color: color.border }}>{order.delivery_zone || color.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", color: statusLabel[currentStatus]?.color || "#22c55e", fontWeight: 600 }}>
            ● {statusLabel[currentStatus]?.label || "Disponível"}
          </span>
          {isSelectedByOther && order.selection_expires_at && (
            <Countdown expiresAt={order.selection_expires_at} onExpire={() => {}} />
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Store size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            <strong style={{ color: "#cbd5e1" }}>Coleta:</strong> {order.pickup_address || "No Restaurante"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MapPin size={14} style={{ color: color.border, flexShrink: 0 }} />
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            <strong style={{ color: "#cbd5e1" }}>Entrega:</strong> {order.address}
          </span>
        </div>
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            <Navigation size={11} style={{ display: "inline", marginRight: 3 }} />
            {order.distance_km || "0"}km
          </span>
          {!isCompatible && (
            <span style={{ fontSize: "0.78rem", color: "#f59e0b" }}>
              ⚠️ Rota diferente da sua atual
            </span>
          )}
        </div>
        {order.pickup_notes && (
          <div style={{
            fontSize: "0.78rem", color: "#f59e0b",
            background: "rgba(245,158,11,0.1)", borderRadius: "6px",
            padding: "0.35rem 0.6rem", marginTop: "0.15rem",
          }}>
            📝 {order.pickup_notes}
          </div>
        )}
      </div>

      {(currentStatus === "pendente" || isSelectedByMe) && !isSelectedByOther && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => onReject(order.id)}
            style={{
              flex: 1, padding: "0.6rem",
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "8px", color: "#f87171", fontWeight: 600, fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <XCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            Recusar
          </button>
          <button
            onClick={() => onAccept(order.id)}
            style={{
              flex: 2, padding: "0.6rem",
              background: isFull ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.25)",
              border: "1px solid rgba(34,197,94,0.5)",
              borderRadius: "8px", color: "#4ade80", fontWeight: 700, fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <CheckCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            Aceitar Pedido
            {isFull && <span style={{ fontSize: "0.7rem", opacity: 0.8 }}> (bag cheia)</span>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function MotoboyApp() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profile);
      setIsOnline(profile?.status === "online");
      fetchData(user.id);
      setLoading(false);
    };
    init();

    // Realtime para novos pedidos
    const channel = supabase
      .channel("motoboy_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (user) fetchData(user.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchData = async (userId: string) => {
    // Buscar pedidos disponíveis
    const { data: available } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    
    setOrders(available || []);

    // Buscar pedido ativo deste motoboy
    const { data: active } = await supabase
      .from("orders")
      .select("*")
      .eq("motoboy_id", userId)
      .in("status", ["aceito", "em_entrega"])
      .single();
    
    setActiveOrder(active);
  };

  const handleToggleOnline = async () => {
    const nextStatus = isOnline ? "offline" : "online";
    setIsOnline(!isOnline);
    await supabase.from("user_profiles").update({ status: nextStatus }).eq("id", user.id);
  };

  const handleAcceptOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: "aceito", 
        motoboy_id: user.id,
        accepted_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (!error) fetchData(user.id);
  };

  const handleStatusUpdate = async (nextStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", activeOrder.id);
    
    if (!error) {
      if (nextStatus === "entregue") {
        setActiveOrder(null);
      }
      fetchData(user.id);
    }
  };

  if (loading) return <div className={styles.loading}>Carregando App...</div>;

  return (
    <div className={styles.mobileContainer}>
      {/* Header Compacto */}
      <header className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            <Bike size={24} />
          </div>
          <div>
            <h2 className={styles.userName}>{profile?.full_name || "Motoboy"}</h2>
            <span className={styles.userStatus}>
              {isOnline ? "🟢 Disponível para entregas" : "⚪ Você está offline"}
            </span>
          </div>
        </div>
        <button 
          onClick={handleToggleOnline} 
          className={`${styles.onlineBtn} ${isOnline ? styles.online : ""}`}
        >
          {isOnline ? "FICAR OFFLINE" : "FICAR ONLINE"}
        </button>
      </header>

      <main className={styles.main}>
        {!isOnline ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><Bike size={48} /></div>
            <h3>Você está Offline</h3>
            <p>Fique online para começar a receber pedidos da sua região.</p>
          </div>
        ) : activeOrder ? (
          /* TELA DE ENTREGA ATIVA */
          <div className={styles.activeDelivery}>
            <div className={styles.deliveryBadge}>ENTREGA EM ANDAMENTO</div>
            
            <div className={styles.deliverySection}>
              <div className={styles.sectionLabel}><Store size={16} /> RETIRAR EM:</div>
              <p className={styles.addressText}>{activeOrder.pickup_address || "Restaurante Central"}</p>
            </div>

            <div className={styles.deliverySection}>
              <div className={styles.sectionLabel}><MapPin size={16} /> ENTREGAR EM:</div>
              <p className={styles.addressTitle}>{activeOrder.customer_name}</p>
              <p className={styles.addressText}>{activeOrder.address}</p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.address)}`}
                target="_blank"
                className={styles.gpsLink}
              >
                <Navigation size={18} /> ABRIR NO GPS
              </a>
            </div>

            <div className={styles.deliveryFooter}>
              <div className={styles.paymentInfo}>
                <span>Pagamento: {activeOrder.payment_method}</span>
                <strong>R$ {activeOrder.total_amount?.toFixed(2)}</strong>
              </div>

              {activeOrder.status === "aceito" ? (
                <button 
                  onClick={() => handleStatusUpdate("em_entrega")}
                  className={styles.actionBtnPrimary}
                >
                  <Package size={20} /> JÁ RETIREI O PEDIDO
                </button>
              ) : (
                <button 
                  onClick={() => handleStatusUpdate("entregue")}
                  className={styles.actionBtnSuccess}
                >
                  <CheckCircle size={20} /> FINALIZAR ENTREGA
                </button>
              )}
            </div>
          </div>
        ) : (
          /* LISTA DE PEDIDOS DISPONÍVEIS */
          <div className={styles.availableList}>
            <h3 className={styles.sectionTitle}>Pedidos Disponíveis ({orders.length})</h3>
            {orders.length === 0 ? (
              <div className={styles.noOrders}>
                <Clock size={32} />
                <p>Aguardando novos pedidos...</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderDist}>📍 {order.distance_km || "2.5"} km</span>
                    <span className={styles.orderValue}>R$ {order.total_amount?.toFixed(2)}</span>
                  </div>
                  <p className={styles.orderAddr}>{order.address}</p>
                  <button 
                    onClick={() => handleAcceptOrder(order.id)}
                    className={styles.acceptBtn}
                  >
                    ACEITAR ENTREGA
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
  );
}
