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
  const [isAtRestaurant, setIsAtRestaurant] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DeliveryOrder[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // 1. Carregar Usuário e Perfil
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profile);
        setIsAtRestaurant(profile?.is_at_restaurant || false);
      }
    };
    loadUser();
  }, []);

  // 2. Carregar Pedidos Reais
  const fetchOrders = async () => {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });

    if (ordersData) {
      setOrders(ordersData as any);
    }

    // Carregar pedidos aceitos por este motoboy
    if (user) {
      const { data: activeData } = await supabase
        .from("motoboy_active_orders")
        .select("*, order:orders(*)")
        .eq("motoboy_id", user.id)
        .eq("status", "active");

      if (activeData) {
        setActiveOrders(activeData.map((a: any) => ({ ...a.order, status: "aceito" })) as any);
      }
    }
  };

  useEffect(() => {
    if (user) fetchOrders();

    // Inscrição Realtime para novos pedidos
    const channel = supabase
      .channel("orders_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // GPS Toggle
  const handleToggleOnline = async () => {
    if (isOnline) {
      setIsOnline(false);
      setIsAtRestaurant(false);
      setGpsError(null);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta GPS.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        setIsOnline(true);
        setGpsError(null);
        // Atualizar localização no banco
        if (user) {
          await supabase.from("user_profiles").update({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            last_location_update: new Date().toISOString()
          }).eq("id", user.id);
        }
      },
      (error) => {
        setIsOnline(false);
        setGpsError("Erro no GPS. Verifique as permissões.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    watchIdRef.current = id;
  };

  const handleAccept = async (orderId: string) => {
    if (!user) return;
    
    // 1. Criar registro na tabela de pedidos ativos
    const { error } = await supabase.from("motoboy_active_orders").insert({
      motoboy_id: user.id,
      order_id: orderId,
      status: "active"
    });

    if (!error) {
      // 2. Atualizar status do pedido para 'aceito'
      await supabase.from("orders").update({ status: "aceito" }).eq("id", orderId);
      fetchOrders();
    }
  };

  const handleReject = async (orderId: string) => {
    // Apenas remove da visualização local por enquanto
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const pendingOrders = orders.filter(o => o.status === "pendente");

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", paddingBottom: "5rem", color: "#f1f5f9" }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1rem 1.25rem", background: "#1e293b", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Image src={user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?img=11"} alt="Avatar" width={44} height={44}
            style={{ borderRadius: "50%", border: "2px solid #334155" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{profile?.name || "Entregador"}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Moto Ativa</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8" }}>
            <Package size={13} />
            <span>{activeOrders.length}/{profile?.bag_capacity || 3} pedidos</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: isOnline ? "#22c55e" : "#64748b", fontWeight: 600 }}>
              {isOnline ? "Online" : "Offline"}
            </span>
            <div onClick={handleToggleOnline} style={{
              width: 42, height: 24, borderRadius: "12px", cursor: "pointer",
              background: isOnline ? "#22c55e" : "#334155", position: "relative",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "white",
                position: "absolute", top: 3, left: isOnline ? 21 : 3, transition: "0.2s"
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div style={{ padding: "1rem 1.25rem" }}>
        {isOnline && (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.04)", borderRadius: "12px",
              padding: "0.75rem 1rem", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#22c55e" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                Transmitindo GPS
              </div>
              <button
                onClick={async () => {
                  const newVal = !isAtRestaurant;
                  setIsAtRestaurant(newVal);
                  if (user) await supabase.from("user_profiles").update({ is_at_restaurant: newVal }).eq("id", user.id);
                }}
                style={{
                  padding: "0.35rem 0.75rem", borderRadius: "8px",
                  background: isAtRestaurant ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
                  color: isAtRestaurant ? "#4ade80" : "#94a3b8",
                  fontSize: "0.78rem", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <Store size={13} style={{ marginRight: 4 }} />
                {isAtRestaurant ? "No restaurante ✓" : "No restaurante?"}
              </button>
            </div>

            {/* Pedidos na Bag */}
            {activeOrders.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  <Bike size={13} style={{ marginRight: 6 }} /> Na sua bag
                </h2>
                {activeOrders.map((order, i) => (
                  <div key={order.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6rem 0.85rem", marginBottom: "0.4rem",
                    background: "rgba(34,197,94,0.1)", borderRadius: "10px",
                  }}>
                    <span style={{ background: "#22c55e", color: "#0f172a", width: 20, height: 20, borderRadius: "50%", textAlign: "center", fontSize: "0.75rem", fontWeight: 700 }}>{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{order.customer_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{order.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pedidos Disponíveis */}
            {isAtRestaurant ? (
              <div>
                <h2 style={{ fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  <Package size={13} style={{ marginRight: 6 }} /> Pedidos disponíveis ({pendingOrders.length})
                </h2>
                {pendingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    myId={user?.id}
                    currentRouteColor={activeOrders[0]?.route_color_tag ?? null}
                    activeCount={activeOrders.length}
                    bagCapacity={profile?.bag_capacity || 3}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", background: "rgba(255,255,255,0.03)", borderRadius: "14px" }}>
                <h3 style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Você está em rota</h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b" }}>Toque em "No restaurante?" ao chegar.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav Inferior */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#1e293b", display: "flex", padding: "0.6rem 0" }}>
        <div style={{ flex: 1, textAlign: "center", color: "#3b82f6", fontSize: "0.7rem" }}><Navigation size={20} /><br/>Início</div>
        <div style={{ flex: 1, textAlign: "center", color: "#64748b", fontSize: "0.7rem" }}><Package size={20} /><br/>Histórico</div>
        <div style={{ flex: 1, textAlign: "center", color: "#64748b", fontSize: "0.7rem" }}><ToggleLeft size={20} /><br/>Perfil</div>
      </nav>
    </div>
  );
}
