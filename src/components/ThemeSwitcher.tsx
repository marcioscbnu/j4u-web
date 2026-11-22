'use client';

import React from 'react';
import { Sun, Monitor, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { TemaTela } from '@/types/marketplace';

const OPCOES: { id: TemaTela; label: string; Icon: React.ElementType }[] = [
  { id: 'light', label: 'Claro', Icon: Sun },
  { id: 'system', label: 'Sistema', Icon: Monitor },
  { id: 'dark', label: 'Escuro', Icon: Moon },
];

export default function ThemeSwitcher() {
  const { tema, setTema, temaResolvido } = useTheme();

  return (
    <div
      role="group"
      aria-label="Estilo da tela"
      className={`inline-flex items-center rounded-2xl p-1 border transition-colors ${
        temaResolvido === 'dark'
          ? 'bg-[#091c3d]/90 border-sky-400/30'
          : 'bg-white/90 border-blue-200 shadow-sm'
      }`}
    >
      {OPCOES.map(({ id, label, Icon }) => {
        const ativo = tema === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTema(id)}
            title={`Estilo ${label}`}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
              ativo
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 shadow'
                : temaResolvido === 'dark'
                ? 'text-sky-200/80 hover:text-white'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
