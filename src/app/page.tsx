'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  SlidersHorizontal,
  Flame,
  Zap,
  Gift,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Categoria, Oferta } from '@/types/marketplace';
import {
  subscribeCategorias,
  subscribeOfertas,
} from '@/services/marketplaceService';
import OfferCard from '@/components/OfferCard';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const PILL_GRADIENTS = [
  'from-pink-500 via-rose-500 to-amber-500 text-white shadow-pink-500/40',
  'from-cyan-400 via-sky-500 to-indigo-500 text-slate-950 shadow-cyan-500/40',
  'from-amber-400 via-orange-500 to-red-500 text-slate-950 shadow-orange-500/40',
  'from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 shadow-emerald-500/40',
  'from-fuchsia-500 via-purple-500 to-indigo-500 text-white shadow-fuchsia-500/40',
];

export default function HomePage() {
  const { isAdmin } = useAuth();
  const { temaResolvido } = useTheme();
  const isDark = temaResolvido === 'dark';

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string>('todos');
  const [mostrarExpiradas, setMostrarExpiradas] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const unsubCat = subscribeCategorias((cats) => {
      setCategorias(cats);
      setLoading(false);
    });

    const unsubOf = subscribeOfertas((ofs) => {
      setOfertas(ofs);
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubOf();
    };
  }, []);

  const mapaCategorias = useMemo(() => {
    const map: Record<string, string> = {};
    categorias.forEach((c) => {
      map[c.id] = c.nome;
    });
    return map;
  }, [categorias]);

  const hojeIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  const ofertasFiltradas = useMemo(() => {
    return ofertas.filter((of) => {
      if (of.status === 'arquivado') return false;

      if (!mostrarExpiradas && of.expiracaoIso && of.expiracaoIso < hojeIso) {
        return false;
      }

      if (
        categoriaSelecionada !== 'todas' &&
        of.categoriaId !== categoriaSelecionada
      ) {
        return false;
      }

      if (
        fornecedorSelecionado !== 'todos' &&
        of.fornecedor !== fornecedorSelecionado
      ) {
        return false;
      }

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const catNome = (mapaCategorias[of.categoriaId] || '').toLowerCase();
        const matchCta = of.cta.toLowerCase().includes(termo);
        const matchCat = catNome.includes(termo);
        if (!matchCta && !matchCat) return false;
      }

      return true;
    });
  }, [
    ofertas,
    mostrarExpiradas,
    hojeIso,
    categoriaSelecionada,
    fornecedorSelecionado,
    busca,
    mapaCategorias,
  ]);

  return (
    <div
      className={`relative min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-black text-white'
          : 'bg-[#eef4ff] text-slate-900'
      }`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-24 w-96 h-96 rounded-full blur-3xl animate-float-glow ${
            isDark ? 'bg-sky-500/20' : 'bg-blue-400/20'
          }`}
        />
        <div
          className={`absolute top-1/4 -right-28 w-[28rem] h-[28rem] rounded-full blur-3xl animate-float-glow ${
            isDark ? 'bg-fuchsia-500/15' : 'bg-pink-400/20'
          }`}
        />
        <div
          className={`absolute bottom-0 left-1/3 w-[30rem] h-[30rem] rounded-full blur-3xl animate-float-glow ${
            isDark ? 'bg-amber-400/10' : 'bg-amber-300/25'
          }`}
        />
      </div>

      <div className="relative z-30 bg-gradient-to-r from-sky-500 via-fuchsia-500 to-amber-400 animate-aurora text-slate-950 text-center py-1.5 px-3 text-xs font-black tracking-wide shadow-md">
        <span className="inline-flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 fill-current" />
          ACHADOS RELÂMPAGO ATUALIZADOS HOJE • MERCADO LIVRE & SHOPEE
          <Zap className="w-3.5 h-3.5 fill-current" />
        </span>
      </div>

      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl shadow-md transition-colors ${
          isDark
            ? 'border-sky-400/20 bg-[#081938]/85'
            : 'border-blue-200 bg-white/85'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-cyan-400 animate-aurora flex items-center justify-center font-black text-slate-950 text-lg shadow-lg ring-2 ring-white/40">
              J4U
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                J4U Marketplace
              </h1>
              <p
                className={`text-xs font-semibold ${
                  isDark ? 'text-sky-200/80' : 'text-slate-600'
                }`}
              >
                Achados selecionados só para você ✨
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-[220px] max-w-md relative">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-sky-300' : 'text-blue-600'
              }`}
            />
            <input
              type="text"
              placeholder="Buscar oferta ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full rounded-2xl border pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? 'border-sky-400/35 bg-[#0c2249]/90 text-white placeholder:text-sky-200/50 focus:border-amber-400 focus:ring-amber-400/30'
                  : 'border-blue-200 bg-blue-50/70 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-400/30'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ThemeSwitcher />

            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-xs font-extrabold shadow transition-all ${
                isDark
                  ? 'bg-[#0e2856] hover:bg-[#153978] border-sky-400/30 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              {isAdmin ? 'Admin' : 'Área Admin'}
            </Link>
          </div>
        </div>
      </header>

      <section
        className={`relative z-10 border-b transition-colors ${
          isDark
            ? 'border-sky-400/20 bg-gradient-to-br from-[#0b234d]/95 via-[#071836]/95 to-[#0d1b42]/95'
            : 'border-blue-200 bg-gradient-to-br from-blue-100/90 via-white/90 to-indigo-100/90'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-7 sm:py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-black mb-3 ${
                isDark
                  ? 'bg-sky-400/15 border-sky-400/40 text-amber-300'
                  : 'bg-blue-600/10 border-blue-600/30 text-blue-800'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-pink-500" /> CURADORIA DE OFERTAS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ofertas que chamam atenção{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                à primeira vista!
              </span>
            </h2>
            <p
              className={`text-sm sm:text-base mt-2 ${
                isDark ? 'text-sky-100/80' : 'text-slate-700'
              }`}
            >
              Assista aos vídeos em formato de celular com legendas e acesse links verificados do Mercado Livre e Shopee.
            </p>
          </div>

          <div
            className={`flex items-center gap-2 flex-wrap p-2.5 rounded-2xl border shadow-lg ${
              isDark
                ? 'bg-[#071733]/85 border-sky-400/25'
                : 'bg-white/90 border-blue-200'
            }`}
          >
            <span
              className={`text-xs font-bold flex items-center gap-1 px-2 ${
                isDark ? 'text-sky-200' : 'text-slate-700'
              }`}
            >
              <Store className="w-4 h-4 text-cyan-400" /> Loja:
            </span>
            <button
              type="button"
              onClick={() => setFornecedorSelecionado('todos')}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                fornecedorSelecionado === 'todos'
                  ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 text-slate-950 shadow scale-105'
                  : isDark
                  ? 'bg-[#0d244c] text-sky-200 hover:bg-[#133369]'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              🌈 Todas
            </button>
            <button
              type="button"
              onClick={() => setFornecedorSelecionado('mercadolivre')}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                fornecedorSelecionado === 'mercadolivre'
                  ? 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-950 shadow scale-105'
                  : isDark
                  ? 'bg-[#0d244c] text-yellow-300 hover:bg-[#133369]'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              ⚡ Mercado Livre
            </button>
            <button
              type="button"
              onClick={() => setFornecedorSelecionado('shopee')}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                fornecedorSelecionado === 'shopee'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow scale-105'
                  : isDark
                  ? 'bg-[#0d244c] text-orange-300 hover:bg-[#133369]'
                  : 'bg-orange-100 text-orange-900 hover:bg-orange-200'
              }`}
            >
              🔥 Shopee
            </button>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 pt-6">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategoriaSelecionada('todas')}
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-black transition-all cursor-pointer ${
              categoriaSelecionada === 'todas'
                ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 text-slate-950 shadow-lg scale-105'
                : isDark
                ? 'bg-[#0c2249] border border-sky-400/25 text-sky-100 hover:border-amber-400/60'
                : 'bg-white border border-blue-200 text-slate-800 hover:border-blue-400'
            }`}
          >
            ✨ Todas as Categorias
          </button>

          {categorias.map((cat, idx) => {
            const activeGradient = PILL_GRADIENTS[idx % PILL_GRADIENTS.length];
            const isSelected = categoriaSelecionada === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaSelecionada(cat.id)}
                className={`shrink-0 rounded-full px-5 py-2 text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? `bg-gradient-to-r ${activeGradient} shadow-lg scale-105`
                    : isDark
                    ? 'bg-[#0c2249] border border-sky-400/25 text-sky-100 hover:border-cyan-400/60'
                    : 'bg-white border border-blue-200 text-slate-800 hover:border-blue-400'
                }`}
              >
                {cat.nome}
              </button>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <p
            className={`text-xs font-bold flex items-center gap-1.5 ${
              isDark ? 'text-sky-200' : 'text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Exibindo{' '}
            <span
              className={`rounded-md px-2 py-0.5 font-black ${
                isDark
                  ? 'bg-sky-500/20 border border-sky-400/40 text-amber-300'
                  : 'bg-blue-100 border border-blue-300 text-blue-900'
              }`}
            >
              {ofertasFiltradas.length}
            </span>{' '}
            {ofertasFiltradas.length === 1 ? 'oferta' : 'ofertas'}
          </p>

          <label
            className={`inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
              isDark ? 'text-sky-200/80' : 'text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="checkbox"
              checked={mostrarExpiradas}
              onChange={(e) => setMostrarExpiradas(e.target.checked)}
              className="rounded border-sky-600 bg-sky-950 text-pink-500"
            />
            Mostrar expiradas
          </label>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-96 rounded-3xl border animate-pulse ${
                  isDark
                    ? 'border-sky-400/20 bg-[#0b224a]/70'
                    : 'border-blue-200 bg-white/70'
                }`}
              />
            ))}
          </div>
        ) : ofertasFiltradas.length === 0 ? (
          <div
            className={`rounded-3xl border p-12 text-center space-y-2 shadow-xl ${
              isDark
                ? 'border-sky-400/25 bg-[#0b224a]/85'
                : 'border-blue-200 bg-white'
            }`}
          >
            <p className="text-lg font-black text-amber-400">
              Nenhuma oferta encontrada com esses filtros.
            </p>
            <p
              className={`text-xs ${
                isDark ? 'text-sky-200/80' : 'text-slate-600'
              }`}
            >
              Tente limpar a busca ou cadastrar novas ofertas no Painel Admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ofertasFiltradas.map((oferta) => (
              <OfferCard
                key={oferta.id}
                oferta={oferta}
                categoriaNome={mapaCategorias[oferta.categoriaId]}
              />
            ))}
          </div>
        )}
      </main>

      <footer
        className={`relative z-10 border-t py-6 text-center text-xs transition-colors ${
          isDark
            ? 'border-sky-400/20 bg-[#051024]/95 text-sky-200/75'
            : 'border-blue-200 bg-white/90 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <span className="font-black text-amber-400">J4U Marketplace</span> • Curadoria de ofertas Shopee & Mercado Livre. Como afiliado, podemos receber comissão por compras qualificadas sem custo adicional para você.
        </div>
      </footer>
    </div>
  );
}
