"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface CategoriaAdmin {
  id: string;
  nome: string;
  slug?: string | null;
  icone?: string | null;
  ordem?: number | null;
  ativa?: boolean | null;
}

interface GerenciarCategoriasAdminProps {
  onCategoriasAlteradas?: () => void;
}

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function GerenciarCategoriasAdmin({
  onCategoriasAlteradas,
}: GerenciarCategoriasAdminProps) {
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("🏷️");
  const [ativa, setAtiva] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarCategorias = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setCategorias((data || []) as CategoriaAdmin[]);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao carregar categorias."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setIcone("🏷️");
    setAtiva(true);
  }

  function iniciarEdicao(cat: CategoriaAdmin) {
    setErro(null);
    setMensagem(null);
    setEditandoId(cat.id);
    setNome(cat.nome || "");
    setIcone(cat.icone || "🏷️");
    setAtiva(cat.ativa !== false);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Informe o nome da categoria.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nomeLimpo,
        slug: gerarSlug(nomeLimpo),
        icone: (icone || "🏷️").trim(),
        ativa,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("categorias")
          .update(payload)
          .eq("id", editandoId);
        if (error) throw error;
        setMensagem("Categoria atualizada com sucesso.");
      } else {
        const { error } = await supabase.from("categorias").insert(payload);
        if (error) throw error;
        setMensagem("Categoria incluída com sucesso.");
      }

      limparFormulario();
      await carregarCategorias();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar categoria."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(cat: CategoriaAdmin) {
    setErro(null);
    setMensagem(null);
    try {
      const novoStatus = cat.ativa === false ? true : false;
      const { error } = await supabase
        .from("categorias")
        .update({ ativa: novoStatus })
        .eq("id", cat.id);
      if (error) throw error;
      await carregarCategorias();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao alterar status."
      );
    }
  }

  async function excluirCategoria(cat: CategoriaAdmin) {
    setErro(null);
    setMensagem(null);
    try {
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", cat.id);
      if (error) throw error;
      if (editandoId === cat.id) limparFormulario();
      setMensagem("Categoria removida.");
      await carregarCategorias();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir categoria."
      );
    }
  }

  return (
    <section className="rounded-2xl bg-[#141418] border border-zinc-800 p-5 sm:p-6 shadow-xl shadow-black/50 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Taxonomia
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
            Categorias da Vitrine
          </h2>
        </div>
        <span className="text-xs font-bold text-zinc-400">
          Total: {categorias.length}
        </span>
      </div>

      <form
        onSubmit={handleSalvar}
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Ícone
          </label>
          <input
            type="text"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Nome da Categoria
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Eletrônicos, Casa & Cozinha..."
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2 py-2">
          <input
            id="cat-ativa"
            type="checkbox"
            checked={ativa}
            onChange={(e) => setAtiva(e.target.checked)}
            className="h-4 w-4 accent-emerald-500 rounded"
          />
          <label
            htmlFor="cat-ativa"
            className="text-xs font-bold text-zinc-200"
          >
            Ativa
          </label>
        </div>

        <div className="sm:col-span-2 flex gap-2">
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
        <p className="text-sm text-zinc-400">Carregando categorias...</p>
      ) : categorias.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categorias.map((cat) => {
            const estaAtiva = cat.ativa !== false;
            return (
              <div
                key={cat.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition"
              >
                <div className="flex items-center gap-2 min-w-0 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-700/80 self-start sm:self-auto max-w-full">
                  <span className="shrink-0">{cat.icone || "🏷️"}</span>
                  <span className="text-xs font-bold text-zinc-100 truncate">
                    {cat.nome}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span
                    className={
                      estaAtiva
                        ? "font-bold text-emerald-400"
                        : "font-semibold text-zinc-500"
                    }
                  >
                    {estaAtiva ? "Ativa" : "Inativa"}
                  </span>

                  <button
                    type="button"
                    onClick={() => iniciarEdicao(cat)}
                    className="font-semibold text-amber-300 hover:text-amber-200 transition"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarStatus(cat)}
                    className="font-semibold text-zinc-300 hover:text-white transition"
                  >
                    {estaAtiva ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirCategoria(cat)}
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
