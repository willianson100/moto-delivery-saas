"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Clock, CheckCircle, MapPin } from "lucide-react";
import styles from "../page.module.css";

export default function MotoboyHistory() {
  const supabase = createClient();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("motoboy_id", user.id)
          .eq("status", "entregue")
          .order("created_at", { ascending: false });
        setHistory(data || []);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) return <div className={styles.loading}>Carregando Histórico...</div>;

  return (
    <div className={styles.main}>
      <h2 className={styles.sectionTitle}>Histórico de Entregas</h2>
      
      {history.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={48} />
          <p>Você ainda não realizou entregas.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {history.map((order) => (
            <div key={order.id} style={{
              background: "#1e293b",
              borderRadius: "16px",
              padding: "1rem",
              border: "1px solid rgba(255, 255, 255, 0.03)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 700 }}>
                  <CheckCircle size={12} style={{ display: "inline", marginRight: 4 }} />
                  ENTREGUE
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: "0 0 0.5rem 0", fontWeight: 600 }}>{order.customer_name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                <MapPin size={14} />
                <span>{order.delivery_address || order.address}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
