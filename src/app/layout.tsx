import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotoDelivery SaaS | Controle Total",
  description: "Plataforma Premium de Gestão de Delivery Próprio e Rastreamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
