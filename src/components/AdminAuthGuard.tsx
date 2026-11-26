"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_EMAIL,
  garantirConfiguracaoSupabase,
  supabase,
} from "@/lib/supabaseClient";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [senha, setSenha] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const avaliarUsuario = useCallback((emailSessao?: string | null) => {
    const ok = emailSessao?.trim().toLowerCase() === ADMIN_EMAIL;
    setAutorizado(ok);
    if (!ok && emailSessao) {
      setErro("Acesso restrito ao administrador autorizado.");
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function checarSessaoInicial() {
      try {
        garantirConfiguracaoSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (!ativo) return;
        if (error) {
          setAutorizado(false);
        } else {
          avaliarUsuario(data.session?.user?.email);
        }
      } catch (err: unknown) {
        if (!ativo) return;
        setErro(
          err instanceof Error ? err.message : "Erro ao verificar sessão."
        );
      } finally {
        if (ativo) setVerificandoSessao(false);
      }
    }

    checarSessaoInicial();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!ativo) return;
        avaliarUsuario(session?.user?.email);
        setVerificandoSessao(false);
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, [avaliarUsuario]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim().toLowerCase();
    if (emailLimpo !== ADMIN_EMAIL) {
      setErro(`Somente ${ADMIN_EMAIL} tem acesso administrativo.`);
      return;
    }

    if (!senha.trim()) {
      setErro("Informe a senha do administrador.");
      return;
    }

    setEntrando(true);
    try {
      garantirConfiguracaoSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senha,
      });

      if (error) throw error;

      avaliarUsuario(data.user?.email ?? data.session?.user?.email);
      setSenha("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Falha ao autenticar no painel.";
      if (msg.toLowerCase().includes("invalid login credentials")) {
        setErro("Usuário ou senha inválidos.");
      } else {
        setErro(msg);
      }
    } finally {
      setEntrando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm font-medium text-slate-600">
          Verificando acesso administrativo...
        </p>
      </div>
    );
  }

  if (autorizado) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xs border border-violet-200 p-7 shadow-md space-y-5">
        <div className="space-y-1.5">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-900 border border-violet-200">
            Administração
          </span>
          <h1 className="text-xl font-bold text-slate-800">
            Acesso Restrito — J4UMarketPlace
          </h1>
          <p className="text-sm text-slate-600">
            Entre com o usuário e senha do administrador.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Usuário (E-mail)
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
            />
          </div>

          <button
            type="submit"
            disabled={entrando}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-200 hover:bg-sky-300/90 border border-sky-300 font-bold text-sm text-sky-950 disabled:opacity-50 transition"
          >
            {entrando ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>

        {erro && <p className="text-sm font-medium text-rose-700">{erro}</p>}
      </div>
    </div>
  );
}