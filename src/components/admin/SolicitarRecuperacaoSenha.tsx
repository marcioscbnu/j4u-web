"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function SolicitarRecuperacaoSenha() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleEnviarLink(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);
    setErro(null);

    const redirectTo = `${window.location.origin}/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setMensagem(
      "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha."
    );
  }

  return (
    <form onSubmit={handleEnviarLink} className="space-y-3 max-w-md">
      <label htmlFor="email-recuperacao" className="block text-sm font-medium">
        E-mail para recuperação
      </label>
      <input
        id="email-recuperacao"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="j4umarketplace@gmail.com"
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        disabled={carregando}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded"
      >
        {carregando ? "Enviando..." : "Enviar link de recuperação"}
      </button>
      {mensagem && <p className="text-sm text-green-600">{mensagem}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </form>
  );
}
