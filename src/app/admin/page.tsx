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
      <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/85 backdrop-blur-sm border border-violet-200/80 p-6 shadow-sm">
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
              Área Administrativa
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
              Painel Administrativo — J4UMarketPlace
            </h1>
            <p className="text-sm text-slate-600">
              Gestão de categorias, fornecedores, fotos na íntegra e vídeos
              locais (
              <code className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 font-medium">
                /video/video0001.mp4
              </code>
              ) com legendas.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-100 hover:bg-sky-200/80 text-xs font-bold text-sky-900 shadow-xs transition"
            >
              Ver Vitrine Pública →
            </Link>

            <button
              type="button"
              onClick={handleSair}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-100 hover:bg-rose-200/80 text-xs font-bold text-rose-900 shadow-xs transition"
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