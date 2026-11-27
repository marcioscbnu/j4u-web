"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import { GerenciarOfertasAdmin } from "@/components/GerenciarOfertasAdmin";
import { GerenciarFornecedoresAdmin } from "@/components/GerenciarFornecedoresAdmin";
import { GerenciarCategoriasAdmin } from "@/components/GerenciarCategoriasAdmin";

export default function AdminPage() {
  const [versaoTaxonomias, setVersaoTaxonomias] = useState(0);

  async function handleSair() {
    await supabase.auth.signOut();
  }

  return (
    <AdminAuthGuard>
      <main className="min-h-screen w-full overflow-x-hidden bg-[#09090b] text-zinc-100 px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#141418] border border-amber-500/40 p-5 sm:p-6 shadow-xl shadow-black/50">
          <div className="space-y-1 min-w-0">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40">
              Área Administrativa • Black Friday v5.0.2
            </span>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Painel Administrativo — J4UMarketPlace
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Edição completa de produtos, controle de expiração, faxina por
              categoria/data e gestão de vídeos locais (
              <code className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-yellow-300 font-medium">
                /video/video0001.mp4
              </code>
              ).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-extrabold text-zinc-950 shadow-xs transition"
            >
              Ver Vitrine Pública →
            </Link>

            <button
              type="button"
              onClick={handleSair}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition"
            >
              Sair
            </button>
          </div>
        </header>

        <GerenciarCategoriasAdmin
          onCategoriasAlteradas={() =>
            setVersaoTaxonomias((prev) => prev + 1)
          }
        />

        <GerenciarFornecedoresAdmin
          onFornecedoresAlterados={() =>
            setVersaoTaxonomias((prev) => prev + 1)
          }
        />

        <GerenciarOfertasAdmin key={versaoTaxonomias} />
      </main>
    </AdminAuthGuard>
  );
}
