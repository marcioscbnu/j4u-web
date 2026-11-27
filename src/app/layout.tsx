import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J4UMarketPlace — Curadoria Oficial & Ofertas Black Friday",
  description:
    "Portal curado de ofertas selecionadas nos melhores fornecedores com revisão real em foto e vídeo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen w-full overflow-x-hidden bg-[#09090b] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
