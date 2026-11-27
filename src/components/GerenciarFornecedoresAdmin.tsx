"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface FornecedorAdmin {
  id: string;
  nome: string;
  slug?: string | null;
  url_base?: string | null;
  cor_badge?: string | null;
  ativo?: boolean | null;
}

interface GerenciarFornecedoresAdminProps {
  onFornecedoresAlterados?: () => void;
}

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GerenciarFornecedoresAdmin({
  onFornecedoresAlterados,
}: GerenciarFornecedoresAdminProps) {
  const [fornecedores, setFornecedores] = useState<FornecedorAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [urlBase, setUrlBase] = useState("");
  const [corBadge, setCorBadge] = useState("#f59e0b");
  const [ativo, setAtivo] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarFornecedores = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setFornecedores((data || []) as FornecedorAdmin[]);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar fornecedores."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFornecedores();
  }, [carregarFornecedores]);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setSlug("");
    setUrlBase("");
    setCorBadge("#f59e0b");
    setAtivo(true);
  }

  function iniciarEdicao(forn: FornecedorAdmin) {
    setErro(null);
    setMensagem(null);
    setEditandoId(forn.id);
    setNome(forn.nome || "");
    setSlug(forn.slug || gerarSlug(forn.nome || ""));
    setUrlBase(forn.url_base || "");
    setCorBadge(forn.cor_badge || "#f59e0b");
    setAtivo(forn.ativo !== false);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome do fornecedor.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nomeLimpo,
        slug: (slug.trim() || gerarSlug(nomeLimpo)).toLowerCase(),
        url_base: urlBase.trim() || null,
        cor_badge: corBadge || "#f59e0b",
        ativo,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("fornecedores")
          .update(payload)
          .eq("id", editandoId);
        if (error) throw error;
        setMensagem("Fornecedor atualizado com sucesso.");
      } else {
        const { error } = await supabase.from("fornecedores").insert(payload);
        if (error) throw error;
        setMensagem("Fornecedor incluído com sucesso.");
      }

      limparFormulario();
      await carregarFornecedores();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar fornecedor."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(forn: FornecedorAdmin) {
    setErro(null);
    setMensagem(null);
    try {
      const novoStatus = forn.ativo === false ? true : false;
      const { error } = await supabase
        .from("fornecedores")
        .update({ ativo: novoStatus })
        .eq("id", forn.id);
      if (error) throw error;
      await carregarFornecedores();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao alterar status."
      );
    }
  }

  async function excluirFornecedor(forn: FornecedorAdmin) {
    setErro(null);
    setMensagem(null);
    try {
      const { error } = await supabase
        .from("fornecedores")
        .delete()
        .eq("id", forn.id);
      if (error) throw error;
      if (editandoId === forn.id) limparFormulario();
      setMensagem("Fornecedor removido.");
      await carregarFornecedores();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir fornecedor."
      );
    }
  }

  return (
    <section className="rounded-2xl bg-[#141418] border border-zinc-800 p-5 sm:p-6 shadow-xl shadow-black/50 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Parceiros
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
            Fornecedores Parceiros
          </h2>
          <p className="text-xs text-zinc-400">
            Cadastre e ative os parceiros disponíveis para vincular às ofertas.
          </p>
        </div>
        <span className="text-xs font-bold text-zinc-400">
          Total: {fornecedores.length}
        </span>
      </div>

      <form
        onSubmit={handleSalvar}
        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => {
              const val = e.target.value;
              setNome(val);
              if (!editandoId) setSlug(gerarSlug(val));
            }}
            placeholder="Ex.: Shopee, Diversos..."
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="shopee"
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            URL Base (Opcional)
          </label>
          <input
            type="url"
            value={urlBase}
            onChange={(e) => setUrlBase(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Destaque
            </label>
            <input
              type="color"
              value={corBadge}
              onChange={(e) => setCorBadge(e.target.value)}
              className="h-9 w-12 rounded-lg bg-zinc-900 border border-zinc-700 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-4">
            <input
              id="forn-ativo"
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 accent-emerald-500 rounded"
            />
            <label
              htmlFor="forn-ativo"
              className="text-xs font-bold text-zinc-200"
            >
              Ativo
            </label>
          </div>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wide disabled:opacity-50 transition"
          >
            {salvando ? "Salvando..." : editandoId ? "Salvar" : "Adicionar"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <p className="text-sm font-semibold text-rose-400">{erro}</p>}
      {mensagem && (
        <p className="text-sm font-semibold text-emerald-400">{mensagem}</p>
      )}

      {carregando ? (
        <p className="text-sm text-zinc-400">Carregando fornecedores...</p>
      ) : fornecedores.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum fornecedor cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fornecedores.map((forn) => {
            const estaAtivo = forn.ativo !== false;
            return (
              <div
                key={forn.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: forn.cor_badge || "#f59e0b" }}
                  />
                  <span className="text-xs font-extrabold text-zinc-100 truncate">
                    {forn.nome}
                  </span>
                  {forn.slug && (
                    <span className="text-[11px] text-zinc-500 truncate">
                      ({forn.slug})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span
                    className={
                      estaAtivo
                        ? "font-bold text-emerald-400"
                        : "font-semibold text-zinc-500"
                    }
                  >
                    {estaAtivo ? "Ativo" : "Inativo"}
                  </span>

                  <button
                    type="button"
                    onClick={() => iniciarEdicao(forn)}
                    className="font-semibold text-amber-300 hover:text-amber-200 transition"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarStatus(forn)}
                    className="font-semibold text-zinc-300 hover:text-white transition"
                  >
                    {estaAtivo ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirFornecedor(forn)}
                    className="font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
