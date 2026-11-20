"use client";

import React from "react";
import { ExternalLink, Clock, Award, Sparkles, TrendingUp } from "lucide-react";
import { Oferta } from "@/types/marketplace";

interface OfferCardProps {
  oferta: Oferta;
  categoriaNome: string;
  onClickOferta: (oferta: Oferta) => void;
}

export function OfferCard({ oferta, categoriaNome, onClickOferta }: OfferCardProps) {
  const isML = oferta.fornecedor === "mercadolivre";

  return (
    <article className="group bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10">
      <div className="relative h-52 w-full bg-slate-950 overflow-hidden">
        <img
          src={oferta.imagemUrl}
          alt={oferta.cta}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        <span
          className={`absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md ${
            isML
              ? "bg-yellow-400 text-slate-950"
              : "bg-orange-600 text-white"
          }`}
        >
          {isML ? "Mercado Livre" : "Shopee"}
        </span>

        {oferta.status !== "novo" && (
          <span className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 uppercase">
            {oferta.status === "campeao" ? <Award className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {oferta.status}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="bg-slate-800/90 text-slate-300 px-2.5 py-0.5 rounded-lg font-medium">
              {categoriaNome}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              Expira: {oferta.expiracao}
            </span>
          </div>

          <h3 className="font-bold text-lg text-white leading-snug group-hover:text-orange-400 transition-colors">
            {oferta.cta}
          </h3>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Publicado em {oferta.cadastro}</span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {oferta.cliques} interessados
            </span>
          </div>

          <button
            onClick={() => onClickOferta(oferta)}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-slate-950 font-extrabold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>VER OFERTA</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
