"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Bike, User, Phone, LogOut } from "lucide-react";
import styles from "../page.module.css";

export default function MotoboyProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className={styles.main}>
      <h2 className={styles.sectionTitle}>Meu Perfil</h2>
      
      <div style={{
        background: "#1e293b",
        borderRadius: "20px",
        padding: "1.5rem",
        marginBottom: "1rem",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ width: "64px", height: "64px", background: "#334155", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={32} color="#6366f1" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{profile?.name}</h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.85rem" }}>Motoboy Parceiro</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Phone size={18} color="#64748b" />
            <span>{profile?.phone || "Telefone não informado"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Bike size={18} color="#64748b" />
            <span>{profile?.vehicle_model || "Veículo não informado"} ({profile?.vehicle_plate || "S/ Placa"})</span>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "1rem",
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "12px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem"
        }}
      >
        <LogOut size={18} /> SAIR DA CONTA
      </button>
    </div>
  );
}
