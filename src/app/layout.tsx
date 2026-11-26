import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J4UMarketPlace — Vitrine Inteligente de Ofertas",
  description:
    "Curadoria diária por categorias e parceiros com visualização completa do produto e demonstração interativa em vídeo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-rose-50/70 via-sky-50/70 to-emerald-50/70 text-slate-700 antialiased selection:bg-violet-200 selection:text-violet-950">
        {children}
      </body>
    </html>
  );
}
