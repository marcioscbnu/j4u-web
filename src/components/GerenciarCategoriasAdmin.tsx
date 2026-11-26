"use client";

import { useCallback, useEffect, useState } from "react";
import { Categoria } from "@/types/marketplace";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
} from "@/services/categoriaService";

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface GerenciarCategoriasAdminProps {
  onCategoriasAlteradas?: () => void;
}

export function GerenciarCategoriasAdmin({
  onCategoriasAlteradas,
}: GerenciarCategoriasAdminProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [icone, setIcone] = useState("🏷️");
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarCategorias();
      setCategorias(lista);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao listar categorias.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setSlug("");
    setIcone("🏷️");
    setAtivo(true);
  }

  function iniciarEdicao(c: Categoria) {
    setEditandoId(c.id);
    setNome(c.nome);
    setSlug(c.slug);
    setIcone(c.icone || "🏷️");
    setAtivo(c.ativo);
    setMensagem(null);
    setErro(null);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!nome.trim()) {
      setErro("Informe o nome da categoria.");
      return;
    }

    const slugFinal = gerarSlug(slug || nome);
    if (!slugFinal) {
      setErro("Informe um slug válido.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        slug: slugFinal,
        icone: icone.trim() || "🏷️",
        ativo,
      };

      if (editandoId) {
        await atualizarCategoria(editandoId, payload);
        setMensagem("Categoria atualizada com sucesso.");
      } else {
        await criarCategoria(payload);
        setMensagem("Categoria cadastrada com sucesso.");
      }

      limparFormulario();
      await carregar();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar categoria.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarStatus(c: Categoria) {
    setErro(null);
    setMensagem(null);
    try {
      await atualizarCategoria(c.id, { ativo: !c.ativo });
      setMensagem(
        `Categoria "${c.nome}" ${!c.ativo ? "ativada" : "desativada"}.`,
      );
      await carregar();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao alterar status.");
    }
  }

  async function handleExcluir(c: Categoria) {
    const ok = window.confirm(
      `Excluir a categoria "${c.nome}"? As ofertas vinculadas ficarão sem categoria até serem reclassificadas.`,
    );
    if (!ok) return;

    setErro(null);
    setMensagem(null);
    try {
      await excluirCategoria(c.id);
      if (editandoId === c.id) limparFormulario();
      setMensagem("Categoria excluída.");
      await carregar();
      onCategoriasAlteradas?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir categoria.",
      );
    }
  }

  function alternarStatus(categoria: Categoria): void {
    throw new Error("Function not implemented.");
  }

  return (
    <section className="rounded-2xl bg-white/90 backdrop-blur-xs border border-emerald-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editandoId ? "Editar Categoria" : "Categorias de Produtos"}
          </h2>
          <p className="text-xs text-slate-500">
            Organize as ofertas do portal por departamento (Ferramentas, Beleza,
            Perfumaria, Casa, Eletrônicos etc.).
          </p>
        </div>

        {editandoId && (
          <button
            type="button"
            onClick={limparFormulario}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <form
        onSubmit={handleSalvar}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nome da Categoria
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (!editandoId) setSlug(gerarSlug(e.target.value));
            }}
            placeholder="Ex.: Ferramentas"
            className="w-full px-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Slug
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(gerarSlug(e.target.value))}
            placeholder="ferramentas"
            className="w-full px-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Ícone / Emoji
          </label>
          <input
            type="text"
            maxLength={8}
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="🛠️"
            className="w-full px-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
            />
            Ativa
          </label>

          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-2 rounded-xl bg-emerald-200 hover:bg-emerald-300/90 border border-emerald-300 font-bold text-sm text-emerald-950 disabled:opacity-50 transition"
          >
            {salvando ? "Salvando..." : editandoId ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </form>

      {mensagem && (
        <p className="text-sm font-medium text-emerald-700">{mensagem}</p>
      )}
      {erro && <p className="text-sm font-medium text-rose-700">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando categorias...</p>
      ) : categorias.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma categoria cadastrada. Cadastre acima.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50/40 border border-emerald-200/90"
            >
              {/* Lado esquerdo: Ícone + Nome da categoria */}
              <div className="flex items-center gap-2 min-w-0 px-3 py-1 rounded-full bg-white border border-emerald-200/80 shadow-2xs">
                <span className="shrink-0">{categoria.icone || "🏷️"}</span>
                <span className="text-xs font-bold text-slate-800 truncate">
                  {categoria.nome}
                </span>
              </div>

              {/* Lado direito: Status e ações alinhados verticalmente */}
              <div className="flex items-center gap-3 shrink-0 text-xs">
                <span
                  className={
                    categoria.ativo
                      ? "font-medium text-slate-600"
                      : "font-medium text-slate-400"
                  }
                >
                  {categoria.ativo ? "Ativa" : "Inativa"}
                </span>

                <button
                  type="button"
                  onClick={() => iniciarEdicao(categoria)}
                  className="font-semibold text-slate-700 hover:text-slate-950 transition"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => alternarStatus(categoria)}
                  className="font-semibold text-sky-700 hover:text-sky-900 transition"
                >
                  {categoria.ativo ? "Desativar" : "Ativar"}
                </button>

                <button
                  type="button"
                  onClick={() => handleExcluir(categoria)}
                  className="font-semibold text-rose-600 hover:text-rose-800 transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
