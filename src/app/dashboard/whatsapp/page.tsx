"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import { QrCode, Smartphone, AlertCircle, CheckCircle2, MessageSquare, Zap } from "lucide-react";

export default function WhatsAppSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [autoStatus, setAutoStatus] = useState(true);
  const [method, setMethod] = useState<'qr' | 'code'>('qr');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <MessageSquare color="#25D366" />
          Integração WhatsApp
        </h1>
        <p className={styles.subtitle}>Conecte o número do seu restaurante para disparar mensagens automáticas aos clientes.</p>
      </div>

      <div className={styles.content}>
        
        {/* Painel de Conexão QR Code */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Status da Conexão</h2>
          
          <div className={styles.qrContainer}>
            {!isConnected ? (
              <>
                <div className={`${styles.statusBadge} ${styles.disconnected}`}>
                  <AlertCircle size={16} /> Desconectado
                </div>
                
                <div className={styles.methodTabs}>
                  <div 
                    className={`${styles.methodTab} ${method === 'qr' ? styles.active : ''}`}
                    onClick={() => setMethod('qr')}
                  >
                    Usar Computador (QR)
                  </div>
                  <div 
                    className={`${styles.methodTab} ${method === 'code' ? styles.active : ''}`}
                    onClick={() => setMethod('code')}
                  >
                    Usar só o Celular (Código)
                  </div>
                </div>

                {method === 'qr' ? (
                  <>
                    {/* Mock do QR Code */}
                    <div className={styles.qrPlaceholder}>
                      <QrCode size={180} color="#111" />
                    </div>
                    <p style={{textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "300px"}}>
                      Abra o WhatsApp no celular do restaurante, vá em "Aparelhos Conectados" e aponte a câmera para o QR Code acima.
                    </p>
                  </>
                ) : (
                  <>
                    <div className={styles.pairingCodeBox}>
                      A1B2-C3D4
                    </div>
                    <p style={{textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "320px"}}>
                      1. Copie o código acima.<br/>
                      2. Clique no botão abaixo para abrir o WhatsApp.<br/>
                      3. Cole o código quando o WhatsApp solicitar.
                    </p>
                    <button style={{marginTop: "0.5rem", backgroundColor: "#25D366", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem"}}>
                      <Smartphone size={16} /> Abrir WhatsApp
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setIsConnected(true)} 
                  style={{marginTop: "1rem", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer"}}
                >
                  (Simular Conexão Concluída)
                </button>
              </>
            ) : (
              <>
                <div className={`${styles.statusBadge} ${styles.connected}`}>
                  <CheckCircle2 size={16} /> Conectado (Motor Evolution API)
                </div>

                <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "1rem"}}>
                  <div style={{width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(37, 211, 102, 0.4)"}}>
                    <Smartphone size={40} color="white" />
                  </div>
                  <div style={{textAlign: "center"}}>
                    <h3 style={{color: "var(--text-primary)", fontWeight: 600}}>Restaurante Conectado</h3>
                    <p style={{color: "var(--text-secondary)", fontSize: "0.9rem"}}>+55 11 99999-9999</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConnected(false)} 
                  style={{marginTop: "2rem", backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "none", padding: "0.6rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600}}
                >
                  Desconectar Aparelho
                </button>
              </>
            )}
          </div>
        </div>

        {/* Painel de Automações */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Regras de Automação</h2>
          
          <div className={styles.settingsList}>
            
            <div className={styles.settingItem}>
              <div className={styles.settingText}>
                <span className={styles.settingLabel}>Link de Rastreio Automático</span>
                <span className={styles.settingDesc}>Envia o link de Live Tracking assim que o motoboy aceitar a corrida.</span>
              </div>
              <div 
                className={`${styles.toggle} ${autoDispatch ? styles.active : ""}`}
                onClick={() => setAutoDispatch(!autoDispatch)}
              >
                <div className={styles.toggleKnob}></div>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingText}>
                <span className={styles.settingLabel}>Aviso de Conclusão</span>
                <span className={styles.settingDesc}>Envia mensagem agradecendo quando o motoboy finaliza a entrega.</span>
              </div>
              <div 
                className={`${styles.toggle} ${autoStatus ? styles.active : ""}`}
                onClick={() => setAutoStatus(!autoStatus)}
              >
                <div className={styles.toggleKnob}></div>
              </div>
            </div>

          </div>

          <div style={{marginTop: "1rem"}}>
            <h3 style={{fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem"}}>
              <Zap size={14} color="var(--accent-color)" /> Preview da Mensagem
            </h3>
            
            <div className={styles.messagePreview}>
              <div className={styles.messageBubble}>
                Olá, *Ana*! 👋
                <br/><br/>
                Seu pedido no restaurante *Sabor Caseiro* acabou de sair para entrega.
                <br/><br/>
                Acompanhe o trajeto do *Carlos (Moto Honda CG)* em tempo real pelo link abaixo:
                <br/><br/>
                <span className={styles.messageHighlight}>https://motodelivery.com/tracking/12577</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
