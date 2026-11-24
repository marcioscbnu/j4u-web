"use client";

import { useEffect, useState } from "react";
import { ADMIN_EMAIL, supabase } from "@/lib/supabaseClient";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [etapaCodigo, setEtapaCodigo] = useState(false);
  const [token, setToken] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase();

      if (email === ADMIN_EMAIL) {
        setAutorizado(true);
      } else {
        if (data.session) {
          await supabase.auth.signOut();
        }
        setAutorizado(false);
      }
      setCarregando(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const email = session?.user?.email?.toLowerCase();
      if (email === ADMIN_EMAIL) {
        setAutorizado(true);
      } else {
        if (session) {
          await supabase.auth.signOut();
        }
        setAutorizado(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleEnviarCodigo() {
    setEnviando(true);
    setErro(null);
    setMensagem(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: {
        shouldCreateUser: false,
      },
    });

    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setEtapaCodigo(true);
    setMensagem(`Código de verificação enviado para ${ADMIN_EMAIL}.`);
  }

  async function handleVerificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const { data, error } = await supabase.auth.verifyOtp({
      email: ADMIN_EMAIL,
      token: token.trim(),
      type: "email",
    });

    setEnviando(false);

    if (error) {
      setErro("Código inválido ou expirado.");
      return;
    }

    const emailAutenticado = data.user?.email?.toLowerCase();
    if (emailAutenticado !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setErro("Acesso não autorizado.");
      return;
    }

    setAutorizado(true);
  }

  async function handleSair() {
    await supabase.auth.signOut();
    setAutorizado(false);
    setEtapaCodigo(false);
    setToken("");
  }

  if (carregando) {
    return <p>Verificando permissões de acesso...</p>;
  }

  if (!autorizado) {
    return (
      <div className="max-w-md mx-auto p-6 border rounded-lg space-y-4">
        <h2 className="text-xl font-bold">Acesso Restrito — Administração</h2>
        <p className="text-sm text-gray-600">
          Acesso exclusivo mediante código de verificação enviado ao e-mail
          administrativo autorizado.
        </p>

        {!etapaCodigo ? (
          <button
            type="button"
            onClick={handleEnviarCodigo}
            disabled={enviando}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded"
          >
            {enviando ? "Enviando código..." : "Enviar código de acesso"}
          </button>
        ) : (
          <form onSubmit={handleVerificarCodigo} className="space-y-3">
            <div>
              <label htmlFor="codigo-otp" className="block text-sm font-medium">
                Código recebido por e-mail
              </label>
              <input
                id="codigo-otp"
                type="text"
                inputMode="numeric"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Digite o código"
                className="w-full mt-1 p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="w-full py-2 px-4 bg-green-600 text-white rounded"
            >
              {enviando ? "Validando..." : "Confirmar e acessar painel"}
            </button>
            <button
              type="button"
              onClick={handleEnviarCodigo}
              disabled={enviando}
              className="w-full py-1 text-sm underline"
            >
              Reenviar código
            </button>
          </form>
        )}

        {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end p-2">
        <button
          type="button"
          onClick={handleSair}
          className="text-sm px-3 py-1 border rounded"
        >
          Sair do Admin
        </button>
      </div>
      {children}
    </div>
  );
}
