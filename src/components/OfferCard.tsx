'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Play,
  Flame,
  Sparkles,
  Trophy,
  Pencil,
  Zap,
  Clock,
} from 'lucide-react';
import { Oferta } from '@/types/marketplace';
import { registrarCliqueOferta } from '@/services/marketplaceService';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import PhoneVideoModal from './PhoneVideoModal';

interface OfferCardProps {
  oferta: Oferta;
  categoriaNome?: string;
}

export default function OfferCard({ oferta, categoriaNome }: OfferCardProps) {
  const { isAdmin } = useAuth();
  const { temaResolvido } = useTheme();
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const isDark = temaResolvido === 'dark';
  const isML = oferta.fornecedor === 'mercadolivre';
  const temVideo = Boolean(oferta.videoUrl && oferta.videoUrl.trim().length > 0);

  const handleAbrirOferta = () => {
    void registrarCliqueOferta(oferta.id);
    window.open(oferta.url, '_blank', 'noopener,noreferrer');
  };

  const handleAbrirVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!temVideo) return;
    setVideoModalOpen(true);
  };

  const cardBorderGradient =
    oferta.status === 'campeao'
      ? 'from-cyan-400 via-fuchsia-500 to-amber-400'
      : oferta.status === 'destaque'
      ? 'from-amber-400 via-orange-500 to-pink-500'
      : 'from-sky-400 via-indigo-500 to-fuchsia-500';

  return (
    <>
      <div
        className={`group relative rounded-3xl p-[2px] bg-gradient-to-br ${cardBorderGradient} animate-aurora shadow-lg hover:-translate-y-1.5 transition-all duration-300`}
      >
        <article
          className={`h-full flex flex-col justify-between rounded-[22px] overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#091c3d]/95 text-white'
              : 'bg-white text-slate-900'
          }`}
        >
          <div>
            <div className="relative aspect-square w-full bg-gradient-to-br from-white via-sky-50 to-indigo-50 overflow-hidden">
              <div className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-sky-300/20 via-fuchsia-300/15 to-transparent opacity-80 group-hover:scale-110 transition-transform duration-500" />

              <img
                src={oferta.imagemUrl}
                alt={oferta.cta}
                className="relative z-10 h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              <span
                className={`absolute z-20 top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black tracking-wide shadow-lg ${
                  isML
                    ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 ring-2 ring-yellow-200/70'
                    : 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white ring-2 ring-orange-300/60'
                }`}
              >
                {isML ? '⚡ Mercado Livre' : '🔥 Shopee'}
              </span>

              {oferta.status === 'destaque' && (
                <span className="absolute z-20 top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-600 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-lg animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-current" /> DESTAQUE
                </span>
              )}
              {oferta.status === 'novo' && (
                <span className="absolute z-20 top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black shadow-lg">
                  <Sparkles className="w-3.5 h-3.5" /> NOVO
                </span>
              )}
              {oferta.status === 'campeao' && (
                <span className="absolute z-20 top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-lg">
                  <Trophy className="w-3.5 h-3.5 text-amber-300" /> CAMPEÃO
                </span>
              )}

              {isAdmin && (
                <Link
                  href={`/admin?edit=${oferta.id}`}
                  title="Editar produto"
                  className="absolute z-20 bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 text-[11px] font-black shadow-lg transition-transform hover:scale-105"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Link>
              )}

              {temVideo && (
                <button
                  type="button"
                  onClick={handleAbrirVideo}
                  title="Assistir vídeo na tela de celular"
                  className="absolute z-20 bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white px-3.5 py-1.5 text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.75)] ring-2 ring-white/40 transition-transform hover:scale-105 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Ver Vídeo
                </button>
              )}
            </div>

            <div className="p-4 pb-2">
              {categoriaNome && (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                    isDark
                      ? 'bg-sky-500/15 border border-sky-400/30 text-sky-300'
                      : 'bg-blue-100 border border-blue-200 text-blue-800'
                  }`}
                >
                  {categoriaNome}
                </span>
              )}
              <h3
                className={`text-sm sm:text-base font-extrabold line-clamp-3 leading-snug ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {oferta.cta}
              </h3>
            </div>
          </div>

          <div className="px-4 pb-4 pt-2 flex flex-col gap-2.5">
            <div
              className={`flex items-center justify-between text-[11px] font-semibold ${
                isDark ? 'text-sky-200/80' : 'text-slate-600'
              }`}
            >
              <span
                className={`inline-flex items-center gap-1 ${
                  isDark ? 'text-cyan-300' : 'text-blue-700'
                }`}
              >
                <Clock className="w-3 h-3" /> Até {oferta.expiracao}
              </span>
              <span
                className={`inline-flex items-center gap-1 ${
                  isDark ? 'text-amber-300' : 'text-orange-600'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" /> {oferta.cliques} interesses
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAbrirOferta}
                className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:via-orange-400 hover:to-pink-400 text-slate-950 font-black py-3 px-4 text-sm shadow-[0_8px_25px_rgba(249,115,22,0.45)] transition-all active:scale-95 cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-y-0 w-12 bg-white/45 blur-sm animate-shimmer" />
                <span className="relative z-10">QUERO ESTA OFERTA</span>
                <ExternalLink className="relative z-10 w-4 h-4 stroke-[2.5]" />
              </button>

              {temVideo && (
                <button
                  type="button"
                  onClick={handleAbrirVideo}
                  title="Ver vídeo no celular"
                  className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white p-3 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        </article>
      </div>

      {temVideo && oferta.videoUrl && (
        <PhoneVideoModal
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
          videoUrl={oferta.videoUrl}
          titulo={oferta.cta}
          ofertaUrl={oferta.url}
          onAbrirOferta={handleAbrirOferta}
        />
      )}
    </>
  );
}
