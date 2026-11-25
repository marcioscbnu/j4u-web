"use client";

import { useState } from "react";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { GerenciarOfertasAdmin } from "@/components/GerenciarOfertasAdmin";
import { GerenciarFornecedoresAdmin } from "@/components/GerenciarFornecedoresAdmin";

export default function AdminPage() {
  const [versaoFornecedores, setVersaoFornecedores] = useState(0);

  return (
    <AdminAuthGuard>
      <main className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto space-y-8">
        <header className="space-y-1.5 border-b border-zinc-800 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Painel Administrativo — J4UMarketPlace
          </h1>
          <p className="text-sm text-zinc-400">
            Gestão de fornecedores vinculados e ofertas com vídeo local (
            <code className="text-zinc-300">/video/video0001.mp4</code>).
          </p>
        </header>

        <GerenciarFornecedoresAdmin
          onFornecedoresAlterados={() =>
            setVersaoFornecedores((prev) => prev + 1)
          }
        />

        <GerenciarOfertasAdmin key={versaoFornecedores} />
      </main>
    </AdminAuthGuard>
  );
}
