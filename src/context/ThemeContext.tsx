'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TemaTela } from '@/types/marketplace';

interface ThemeContextValue {
  tema: TemaTela;
  temaResolvido: 'light' | 'dark';
  setTema: (novoTema: TemaTela) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  tema: 'dark',
  temaResolvido: 'dark',
  setTema: () => {},
});

const STORAGE_KEY = 'j4u-tema-tela';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<TemaTela>('dark');
  const [temaResolvido, setTemaResolvido] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const salvo = (typeof window !== 'undefined' &&
      window.localStorage.getItem(STORAGE_KEY)) as TemaTela | null;
    if (salvo === 'light' || salvo === 'system' || salvo === 'dark') {
      setTemaState(salvo);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, tema);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const aplicar = () => {
      const efetivo: 'light' | 'dark' =
        tema === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : tema;
      setTemaResolvido(efetivo);

      const root = document.documentElement;
      if (efetivo === 'dark') {
        root.classList.add('dark');
        root.style.backgroundColor = '#000000';
      } else {
        root.classList.remove('dark');
        root.style.backgroundColor = '#eef4ff';
      }
    };

    aplicar();

    if (tema === 'system') {
      mediaQuery.addEventListener('change', aplicar);
      return () => mediaQuery.removeEventListener('change', aplicar);
    }
  }, [tema]);

  const setTema = (novoTema: TemaTela) => {
    setTemaState(novoTema);
  };

  return (
    <ThemeContext.Provider value={{ tema, temaResolvido, setTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
