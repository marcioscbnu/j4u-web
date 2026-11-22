'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

const FALLBACK_ADMINS = ['j4umarketplace@gmail.com'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const verificarAdmin = async (currentUser: User | null) => {
    if (!currentUser || !currentUser.email) {
      setIsAdmin(false);
      return;
    }

    const emailLower = currentUser.email.toLowerCase();
    if (FALLBACK_ADMINS.includes(emailLower)) {
      setIsAdmin(true);
      return;
    }

    if (!supabase) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', emailLower)
      .maybeSingle();

    setIsAdmin(Boolean(data));
  };

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      await verificarAdmin(currentUser);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await verificarAdmin(currentUser);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado no .env.local.');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
