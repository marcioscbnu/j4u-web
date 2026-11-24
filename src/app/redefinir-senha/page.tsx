"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RedefinirSenhaPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessaoValida, setSessaoValida] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setSessaoValida(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessaoValida(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSalvarNovaSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setStatus(null);

    if (password.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setStatus("Senha atualizada com sucesso. Você já pode acessar o painel.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Criar nova senha</h1>
      {!sessaoValida && (
        <p className="text-sm text-amber-600">
          Abra o link enviado para o seu e-mail para validar a redefinição de
          senha.
        </p>
      )}
      <form onSubmit={handleSalvarNovaSenha} className="space-y-3">
        <div>
          <label htmlFor="nova-senha" className="block text-sm font-medium">
            Nova senha
          </label>
          <input
            id="nova-senha"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>

        <div>
          <label
            htmlFor="confirmar-senha"
            className="block text-sm font-medium"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmar-senha"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={salvando || !sessaoValida}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar nova senha"}
        </button>

        {status && <p className="text-sm text-green-600">{status}</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </form>
    </main>
  );
}
