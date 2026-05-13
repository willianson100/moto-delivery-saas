"use client";

import styles from "./page.module.css";
import { Bike, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError("Email ou senha inválidos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    const role = profile?.role;

    if (role === "admin_master") {
      window.location.href = "/admin-master";
    } else if (role === "motoboy") {
      window.location.href = "/motoboy";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Registro básico para demonstração do trial de 45 dias
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError || !authData.user) {
      setError("Erro ao criar conta: " + authError?.message);
      setLoading(false);
      return;
    }

    // Por padrão, novos cadastros via site são do tipo 'estabelecimento'
    await supabase.from("user_profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      role: "estabelecimento"
    });

    alert("Conta criada! Aproveite seus 45 dias grátis. Você será redirecionado.");
    window.location.href = "/dashboard";
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow}></div>
      
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Bike size={32} />
          </div>
          <h1 className={styles.title}>
            {isRegistering ? "Comece agora" : "Bem-vindo de volta"}
          </h1>
          <p className={styles.subtitle}>
            {isRegistering 
              ? "Crie sua conta e aproveite 45 dias grátis!" 
              : "Gerencie suas entregas em tempo real"}
          </p>
        </div>

        {isRegistering && (
          <div className={styles.trialBadge}>
            ✨ Período de teste de 45 dias ativado
          </div>
        )}

        <form className={styles.form} onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <div className={styles.inputGroup}>
              <label htmlFor="fullName">Nome completo ou Empresa</label>
              <div className={styles.inputWrapper}>
                <Bike size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  id="fullName" 
                  className={styles.input} 
                  placeholder="Seu nome ou nome da loja"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                id="email" 
                className={styles.input} 
                placeholder="contato@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <label htmlFor="password">Senha</label>
              {!isRegistering && <Link href="/forgot-password" className={styles.link} style={{fontSize: "0.85rem"}}>Esqueceu?</Link>}
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
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className={styles.spinner} />
            ) : (
              isRegistering ? "Criar Conta Grátis" : "Entrar no Painel"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          {isRegistering ? (
            <>Já tem uma conta? <button onClick={() => setIsRegistering(false)} className={styles.textBtn}>Fazer Login</button></>
          ) : (
            <>Não tem uma conta? <button onClick={() => setIsRegistering(true)} className={styles.textBtn}>Testar 45 dias grátis</button></>
          )}
        </div>
      </div>
    </div>
  );
}
