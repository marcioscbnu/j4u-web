"use client";

import React from "react";
import {
  Home,
  Sprout,
  Cpu,
  Sparkles,
  Wrench,
  ShoppingBag,
  Flame,
  Tag,
  Smartphone,
  Gift,
  LayoutGrid,
} from "lucide-react";
import { Categoria } from "@/types/marketplace";

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  home: <Home className="w-4 h-4" />,
  sprout: <Sprout className="w-4 h-4" />,
  cpu: <Cpu className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  wrench: <Wrench className="w-4 h-4" />,
  "shopping-bag": <ShoppingBag className="w-4 h-4" />,
  smartphone: <Smartphone className="w-4 h-4" />,
  gift: <Gift className="w-4 h-4" />,
  tag: <Tag className="w-4 h-4" />,
};

interface CategoryBarProps {
  categorias: Categoria[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryBar({ categorias, selectedId, onSelect }: CategoryBarProps) {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelect("todos")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border ${
          selectedId === "todos"
            ? "bg-orange-500 text-slate-950 border-orange-400 shadow-lg shadow-orange-500/25"
            : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Todas as Ofertas</span>
      </button>

      <button
        onClick={() => onSelect("mais-clicados")}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border ${
          selectedId === "mais-clicados"
            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25"
            : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
        }`}
      >
        <Flame className="w-4 h-4 text-orange-400" />
        <span>Mais Clicados</span>
      </button>

      {categorias.map((cat) => {
        const iconElement = CATEGORY_ICONS[cat.icone] || <Tag className="w-4 h-4" />;
        const active = selectedId === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border ${
              active
                ? "bg-orange-500 text-slate-950 border-orange-400 shadow-lg shadow-orange-500/25"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
            }`}
          >
            {iconElement}
            <span>{cat.nome}</span>
          </button>
        );
      })}
    </div>
  );
}
