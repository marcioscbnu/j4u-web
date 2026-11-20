"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "j4umarketplace@gmail.com";

interface AuthContextData {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAdmin = async (email: string, pass: string) => {
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Este e-mail não possui permissão de administrador.");
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) {
      throw new Error(error.message);
    }
  };

  const logoutAdmin = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = Boolean(user && user.email?.toLowerCase() === ADMIN_EMAIL);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
