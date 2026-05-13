"use client";

import styles from "../login/page.module.css";
import { Mail, AlertCircle, Loader2, CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <Link href="/login" style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.4rem", 
          fontSize: "0.85rem", 
          color: "var(--text-muted)",
          textDecoration: "none",
          marginBottom: "-1rem"
        }}>
          <ChevronLeft size={16} /> Voltar para o login
        </Link>

        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Mail size={32} />
          </div>
          <h1 className={styles.title}>Recuperar Senha</h1>
          <p className={styles.subtitle}>Enviaremos um link para você redefinir seu acesso</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h2 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "0.5rem" }}>E-mail enviado!</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Verifique sua caixa de entrada em <strong>{email}</strong> e siga as instruções para criar uma nova senha.
            </p>
            <button 
              onClick={() => setSuccess(false)}
              className={styles.btnPrimary} 
              style={{ width: "100%", marginTop: "1.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}
            >
              Não recebi o e-mail
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleResetRequest}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Seu e-mail de acesso</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input 
                  type="email" 
                  id="email" 
                  className={styles.input} 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Enviando...</> : "Enviar Link de Recuperação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
