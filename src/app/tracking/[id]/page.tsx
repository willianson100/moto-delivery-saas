"use client";

import styles from "./page.module.css";
import Image from "next/image";
import { Check, MapPin, Navigation, MessageCircle, Utensils } from "lucide-react";
import { useParams } from "next/navigation";

export default function TrackingPage() {
  const params = useParams();
  const orderId = params?.id || "12577";

  return (
    <div className={styles.container}>
      
      {/* Fake Map Area */}
      <div className={styles.mapArea}>
        <div className={styles.liveBadge}>
          <div className={styles.pulseDot}></div>
          Rastreamento ao Vivo
        </div>
        <span style={{color: "var(--text-muted)", fontSize: "0.9rem"}}>Integração Google Maps (Moto movendo)</span>
      </div>

      {/* Tracking Details */}
      <div className={styles.trackingInfo}>
        <div className={styles.header}>
          <div className={styles.restaurantName}>Hamburgueria Texas</div>
          <h1 className={styles.statusTitle}>O motoboy está a caminho!</h1>
          <div className={styles.eta}>Chega em ~12 min</div>
        </div>

        {/* Timeline */}
        <div className={styles.timeline}>
          <div className={`${styles.timelineItem} ${styles.completed}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}>
              <Check size={14} />
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Pedido Aceito</div>
              <div className={styles.timelineTime}>19:42</div>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles.completed}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}>
              <Utensils size={14} />
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Saindo do restaurante</div>
              <div className={styles.timelineTime}>19:55</div>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles.active}`}>
            <div className={styles.timelineLine}></div>
            <div className={styles.timelineIcon}>
              <Navigation size={12} />
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Em rota de entrega</div>
              <div className={styles.timelineTime}>Agora</div>
            </div>
          </div>

          <div className={styles.timelineItem}>
            <div className={styles.timelineIcon}>
              <MapPin size={12} />
            </div>
            <div className={styles.timelineContent}>
              <div className={styles.timelineTitle}>Pedido Entregue</div>
              <div className={styles.timelineTime}>Previsão 20:10</div>
            </div>
          </div>
        </div>

        {/* Motoboy Profile Card */}
        <div className={styles.driverCard}>
          <div className={styles.driverInfo}>
            <Image 
              src="https://i.pravatar.cc/150?img=11" 
              alt="Carlos Silva" 
              width={48} 
              height={48} 
              className={styles.driverAvatar} 
            />
            <div>
              <div className={styles.driverName}>Carlos Silva</div>
              <div className={styles.driverVehicle}>Honda CG 160 • ABC-1234</div>
            </div>
          </div>
          <button className={styles.contactBtn} aria-label="Falar no WhatsApp">
            <MessageCircle size={22} />
          </button>
        </div>
      </div>

    </div>
  );
}
