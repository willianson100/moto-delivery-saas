"use client";

import styles from "./page.module.css";
import { Bike, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Email ou senha inválidos. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    // 2. Buscar o role do usuário para redirecionar corretamente
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = profile?.role;

    // 3. Redirecionar conforme o papel (full reload para garantir que o cookie de sessão seja lido)
    if (role === "admin_master") {
      window.location.href = "/admin-master";
    } else if (role === "motoboy") {
      window.location.href = "/motoboy";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Bike size={32} />
          </div>
          <h1 className={styles.title}>Bem-vindo de volta</h1>
          <p className={styles.subtitle}>Acesse o painel do seu estabelecimento</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email corporativo</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                id="email" 
                className={styles.input} 
                placeholder="contato@restaurante.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <label htmlFor="password">Senha</label>
              <Link href="/forgot-password" className={styles.link} style={{fontSize: "0.85rem"}}>Esqueceu a senha?</Link>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                id="password" 
                className={styles.input} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#f87171",
              fontSize: "0.875rem",
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Entrando...</> : "Entrar no Painel"}
          </button>
        </form>

        <div className={styles.footer}>
          Não tem uma conta? <span className={styles.link}>Faça o teste de 45 dias</span>
        </div>
      </div>
    </div>
  );
}
