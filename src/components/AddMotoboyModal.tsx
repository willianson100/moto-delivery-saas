"use client";

import { useState } from "react";
import { X, User, Mail, Lock, Loader2, CheckCircle } from "lucide-react";

interface AddMotoboyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMotoboyModal({ isOpen, onClose }: AddMotoboyModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/motoboys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar motoboy");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName("");
        setEmail("");
        setPassword("");
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div style={{
        background: "#1e293b",
        width: "100%",
        maxWidth: "450px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{
          padding: "1.25rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>Cadastrar Novo Motoboy</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ background: "rgba(34, 197, 94, 0.1)", width: "64px", height: "64px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <CheckCircle size={32} color="#22c55e" />
              </div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Motoboy Cadastrado!</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>O acesso já está liberado para o entregador.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Nome Completo</label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                      background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px", color: "#fff", outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>E-mail de Login</label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@teste.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                      background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px", color: "#fff", outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Senha Temporária</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%", padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                      background: "rgba(15, 23, 42, 0.5)", border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px", color: "#fff", outline: "none"
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "0.5rem", padding: "0.85rem", background: "#3b82f6",
                  color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                {loading ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Cadastrando...</> : "Criar Conta de Motoboy"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
