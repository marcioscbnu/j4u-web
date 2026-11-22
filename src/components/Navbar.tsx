"use client";

import React from "react";
import { Lock, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  currentView: "home" | "admin" | "campanha";
  onNavigate: (view: "home" | "admin" | "campanha", campaignName?: string) => void;
  onOpenLogin: () => void;
}

export function Navbar({ currentView, onNavigate, onOpenLogin }: NavbarProps) {
  const { isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 text-left group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
            J4U
          </div>
          <div>
            <span className="block font-black text-lg tracking-tight text-white">
              J4U Marketplace
            </span>
            <span className="block text-xs text-slate-400">
              @j4umarketplace • Curadoria Oficial
            </span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate("home")}
            className={`transition hover:text-orange-400 ${
              currentView === "home" ? "text-orange-400 font-bold" : ""
            }`}
          >
            Início
          </button>
          <button
            onClick={() => onNavigate("campanha", "Black November")}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Black November</span>
          </button>
          <button
            onClick={() => onNavigate("campanha", "Especial de Natal")}
            className="hover:text-orange-400 transition"
          >
            Natal
          </button>
          <button
            onClick={() => onNavigate("campanha", "Volta às Aulas")}
            className="hover:text-orange-400 transition"
          >
            Volta às Aulas
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <button
                onClick={() => onNavigate(currentView === "admin" ? "home" : "admin")}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-orange-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{currentView === "admin" ? "Voltar à Vitrine" : "Painel Admin"}</span>
              </button>
              <button
                onClick={() => void signOut()}
                title="Sair do modo administrador"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
