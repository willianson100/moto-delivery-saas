"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import styles from "./page.module.css";
import Image from "next/image";
import { Check, MapPin, Navigation, MessageCircle, Utensils, Bike, Clock } from "lucide-react";

export default function TrackingPage() {
  const params = useParams();
  const orderId = params?.id;
  const supabase = createClient();

  const [order, setOrder] = useState<any>(null);
  const [motoboy, setMotoboy] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchData = async () => {
      // 1. Buscar Pedido
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (!orderData) {
        setLoading(false);
        return;
      }
      setOrder(orderData);

      // 2. Buscar Empresa (Tenant)
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", orderData.tenant_id)
        .single();
      setTenant(tenantData);

      // 3. Buscar Motoboy se houver
      if (orderData.motoboy_id) {
        const { data: motoboyData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", orderData.motoboy_id)
          .single();
        setMotoboy(motoboyData);

        // 4. Buscar Localização
        const { data: locData } = await supabase
          .from("motoboy_locations")
          .select("*")
          .eq("motoboy_id", orderData.motoboy_id)
          .single();
        setLocation(locData);
      }
      setLoading(false);
    };

    fetchData();

    // Realtime para Status e Localização
    const channel = supabase
      .channel(`tracking_${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "motoboy_locations" }, (payload) => {
        if (order?.motoboy_id && payload.new.motoboy_id === order.motoboy_id) {
          setLocation(payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId, order?.motoboy_id]);

  if (loading) return <div className={styles.loading}>Carregando rastreio...</div>;
  if (!order) return <div className={styles.error}>Pedido não encontrado.</div>;

  const getStatusInfo = () => {
    switch(order.status) {
      case "pendente": return { title: "Aguardando confirmação", color: "#f59e0b", icon: <Clock /> };
      case "aceito": return { title: "Preparando seu pedido", color: "#6366f1", icon: <Utensils /> };
      case "em_entrega": return { title: "O motoboy está a caminho!", color: "#22c55e", icon: <Bike /> };
      case "entregue": return { title: "Pedido entregue!", color: "#10b981", icon: <Check /> };
      default: return { title: "Em processamento", color: "#94a3b8", icon: <Clock /> };
    }
  };

  const status = getStatusInfo();

  return (
    <div className={styles.container}>
      
      {/* Map Area */}
      <div className={styles.mapArea}>
        <div className={styles.liveBadge}>
          <div className={styles.pulseDot}></div>
          Rastreamento ao Vivo
        </div>
        {location ? (
          <div className={styles.mapOverlay}>
            <div className={styles.locationMarker}>
              <Bike size={32} color="white" />
              <div className={styles.accuracyCircle} style={{ width: location.accuracy, height: location.accuracy }}></div>
            </div>
            <p style={{marginTop: "2rem", color: "white", fontSize: "0.8rem"}}>
              Latitude: {location.latitude.toFixed(5)} | Longitude: {location.longitude.toFixed(5)}
            </p>
          </div>
        ) : (
          <span style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>
            Aguardando sinal GPS do motoboy...
          </span>
        )}
      </div>

      {/* Tracking Details */}
      <div className={styles.trackingInfo}>
        <div className={styles.header}>
          <div className={styles.restaurantName}>{tenant?.name || "Restaurante"}</div>
          <h1 className={styles.statusTitle} style={{color: status.color}}>{status.title}</h1>
          <div className={styles.eta}>
            {order.status === "em_entrega" ? "Chega em ~10-15 min" : "Previsão de entrega: 20-30 min"}
          </div>
        </div>

        {/* Timeline Simplificada */}
        <div className={styles.timeline}>
          <div className={`${styles.timelineItem} ${["aceito", "em_entrega", "entregue"].includes(order.status) ? styles.completed : styles.active}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}><Check size={14} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Pedido Confirmado</div>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${["em_entrega", "entregue"].includes(order.status) ? styles.completed : (order.status === "aceito" ? styles.active : "")}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}><Utensils size={14} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Saindo para Entrega</div>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${order.status === "entregue" ? styles.completed : (order.status === "em_entrega" ? styles.active : "")}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}><Navigation size={12} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Em Rota</div>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${order.status === "entregue" ? styles.active : ""}`}>
            <div className={styles.timelineIcon}><MapPin size={12} /></div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Entregue</div>
            </div>
          </div>
        </div>

        {/* Motoboy Profile Card */}
        {motoboy && (
          <div className={styles.driverCard}>
            <div className={styles.driverInfo}>
              <div className={styles.driverAvatar}>
                <Bike size={24} color="#6366f1" />
              </div>
              <div>
                <div className={styles.driverName}>{motoboy.name}</div>
                <div className={styles.driverVehicle}>
                  {motoboy.vehicle_model || "Veículo de Entrega"} • {motoboy.vehicle_plate || "Sem Placa"}
                </div>
              </div>
            </div>
            {motoboy.phone && (
              <a 
                href={`https://wa.me/${motoboy.phone.replace(/\D/g, '')}`} 
                target="_blank" 
                className={styles.contactBtn}
              >
                <MessageCircle size={22} />
              </a>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
