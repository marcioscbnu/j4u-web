"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Categoria, Oferta } from "@/types/marketplace";
import {
  subscribeCategorias,
  subscribeOfertas,
  registrarCliqueOferta,
} from "@/services/marketplaceService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { CategoryBar } from "@/components/CategoryBar";
import { OfferCard } from "@/components/OfferCard";
import { AdminPanel } from "@/components/AdminPanel";
import { LoginModal } from "@/components/LoginModal";
import { filtrarOfertasVitrine } from "@/utils/offerRules";

export default function HomePage() {
  const { isAdmin } = useAuth();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("todos");
  const [view, setView] = useState<"home" | "admin" | "campanha">("home");
  const [campanhaAtual, setCampanhaAtual] = useState<string>("");
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const unsubCat = subscribeCategorias(setCategorias);
    const unsubOf = subscribeOfertas(setOfertas);

    return () => {
      unsubCat();
      unsubOf();
    };
  }, []);

  const handleOpenOffer = async (oferta: Oferta) => {
    if (oferta.id) {
      await registrarCliqueOferta(oferta.id);
    }
    window.open(oferta.url, "_blank", "noopener,noreferrer");
  };

  const ofertasExibidas = filtrarOfertasVitrine(ofertas, selectedCat);

  const getNomeCategoria = (id: string) =>
    categorias.find((c) => c.id === id)?.nome || "Oferta";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentView={view}
        onNavigate={(nextView, campaign) => {
          setView(nextView);
          if (campaign) setCampanhaAtual(campaign);
        }}
        onOpenLogin={() => setLoginOpen(true)}
      />

      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 text-amber-300 text-xs flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Configure suas chaves do Supabase no arquivo <strong>.env.local</strong> para carregar as ofertas.
          </span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {view === "admin" && isAdmin ? (
          <AdminPanel categorias={categorias} ofertas={ofertas} />
        ) : (
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600/20 via-slate-900 to-amber-500/10 border border-slate-800 p-8 sm:p-12">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 px-3.5 py-1 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {view === "campanha"
                      ? `Campanha Especial: ${campanhaAtual}`
                      : "Curadoria Diária Shopee & Mercado Livre"}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {view === "campanha"
                    ? `Seleção Oficial ${campanhaAtual}`
                    : "As melhores ofertas do dia, garimpadas para você."}
                </h1>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Economize tempo e compre com segurança. Nossa equipe monitora preços diariamente e seleciona apenas oportunidades reais.
                </p>
              </div>
            </section>

            <CategoryBar
              categorias={categorias}
              selectedId={selectedCat}
              onSelect={setSelectedCat}
            />

            {ofertasExibidas.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-3xl">
                <p className="text-slate-400 font-medium">
                  Nenhuma oferta ativa encontrada nesta seleção no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ofertasExibidas.map((oferta) => (
                  <OfferCard
                    key={oferta.id}
                    oferta={oferta}
                    categoriaNome={getNomeCategoria(oferta.categoriaId)}
                    onClickOferta={handleOpenOffer}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} J4U Marketplace (@j4umarketplace) • Portal de curadoria de ofertas.
        </p>
      </footer>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          setView("admin");
        }}
      />
    </div>
  );
}
