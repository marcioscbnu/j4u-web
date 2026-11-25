"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "j4umarketplace@gmail.com";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [etapa, setEtapa] = useState<"enviar" | "verificar">("enviar");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function avaliarUsuario(email?: string | null) {
    const ok = email?.trim().toLowerCase() === ADMIN_EMAIL;
    setAutorizado(ok);
    if (!ok && email) {
      setErro("Acesso restrito à conta autorizada do administrador.");
    }
  }

  useEffect(() => {
    let ativo = true;

    async function checarSessaoInicial() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!ativo) return;
        if (error) {
          setErro(error.message);
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
  }, []);

  async function handleEnviarOtp(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setMensagem(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ADMIN_EMAIL,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setEtapa("verificar");
      setMensagem(
        `Código de verificação enviado para ${ADMIN_EMAIL}. Confira sua caixa de entrada.`
      );
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar o código OTP."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleVerificarOtp(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setMensagem(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: ADMIN_EMAIL,
        token: codigoOtp.trim(),
        type: "email",
      });

      if (error) throw error;

      avaliarUsuario(data.user?.email ?? data.session?.user?.email);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Código OTP inválido ou expirado."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (verificandoSessao) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-sm text-zinc-400">
          Verificando acesso administrativo...
        </p>
      </div>
    );
  }

  if (autorizado) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-zinc-950 border border-zinc-800 p-6 space-y-5">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white">
            Acesso Restrito — J4UMarketPlace
          </h1>
          <p className="text-sm text-zinc-400">
            Autenticação via código OTP para{" "}
            <span className="text-zinc-200 font-medium">{ADMIN_EMAIL}</span>.
          </p>
        </div>

        {etapa === "enviar" ? (
          <form onSubmit={handleEnviarOtp} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                E-mail autorizado
              </label>
              <input
                type="email"
                readOnly
                value={ADMIN_EMAIL}
                className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-800 text-zinc-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white disabled:opacity-50"
            >
              {enviando ? "Enviando código..." : "Enviar código OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarOtp} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                Código OTP recebido por e-mail
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value)}
                placeholder="Digite o código"
                className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white disabled:opacity-50"
              >
                {enviando ? "Validando..." : "Confirmar código"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEtapa("enviar");
                  setCodigoOtp("");
                  setErro(null);
                }}
                className="px-3.5 py-2.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Reenviar
              </button>
            </div>
          </form>
        )}

        {mensagem && <p className="text-sm text-emerald-400">{mensagem}</p>}
        {erro && <p className="text-sm text-red-400">{erro}</p>}
      </div>
    </div>
  );
}
