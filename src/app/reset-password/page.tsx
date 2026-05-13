"use client";

import styles from "../login/page.module.css";
import { Lock, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Verificar se temos uma sessão válida (vinda do link de recuperação)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Link de recuperação inválido ou expirado. Tente novamente.");
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <Lock size={32} />
          </div>
          <h1 className={styles.title}>Nova Senha</h1>
          <p className={styles.subtitle}>Digite sua nova senha abaixo</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.1)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <CheckCircle size={32} color="#22c55e" />
            </div>
            <h2 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "0.5rem" }}>Senha alterada!</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes...
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleUpdatePassword}>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Nova Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  id="password" 
                  className={styles.input} 
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  id="confirmPassword" 
                  className={styles.input} 
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Atualizando...</> : "Definir Nova Senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
