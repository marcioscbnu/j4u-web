import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J4UMarketPlace — Vitrine de Ofertas",
  description:
    "Curadoria diária de ofertas com visualização em vídeo local em tema escuro de alto contraste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark bg-black">
      <body className="min-h-screen bg-black text-white antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
