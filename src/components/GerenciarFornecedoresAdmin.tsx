"use client";

import { useCallback, useEffect, useState } from "react";
import { Fornecedor } from "@/types/marketplace";
import {
  atualizarFornecedor,
  criarFornecedor,
  excluirFornecedor,
  listarFornecedores,
} from "@/services/fornecedorService";

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface GerenciarFornecedoresAdminProps {
  onFornecedoresAlterados?: () => void;
}

export function GerenciarFornecedoresAdmin({
  onFornecedoresAlterados,
}: GerenciarFornecedoresAdminProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [urlBase, setUrlBase] = useState("");
  const [corBadge, setCorBadge] = useState("#A5D8FF");
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarFornecedores();
      setFornecedores(lista);
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao listar fornecedores."
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
    setUrlBase("");
    setCorBadge("#A5D8FF");
    setAtivo(true);
  }

  function iniciarEdicao(f: Fornecedor) {
    setEditandoId(f.id);
    setNome(f.nome);
    setSlug(f.slug);
    setUrlBase(f.url_base ?? "");
    setCorBadge(f.cor_badge || "#A5D8FF");
    setAtivo(f.ativo);
    setMensagem(null);
    setErro(null);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!nome.trim()) {
      setErro("Informe o nome do fornecedor.");
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
        url_base: urlBase.trim() || null,
        cor_badge: corBadge || "#A5D8FF",
        ativo,
      };

      if (editandoId) {
        await atualizarFornecedor(editandoId, payload);
        setMensagem("Fornecedor atualizado com sucesso.");
      } else {
        await criarFornecedor(payload);
        setMensagem("Fornecedor cadastrado com sucesso.");
      }

      limparFormulario();
      await carregar();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar fornecedor."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarStatus(f: Fornecedor) {
    setErro(null);
    setMensagem(null);
    try {
      await atualizarFornecedor(f.id, { ativo: !f.ativo });
      setMensagem(
        `Fornecedor "${f.nome}" ${!f.ativo ? "ativado" : "desativado"}.`
      );
      await carregar();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao alterar status."
      );
    }
  }

  async function handleExcluir(f: Fornecedor) {
    const ok = window.confirm(
      `Excluir o fornecedor "${f.nome}"? (Só permitido se não houver ofertas vinculadas)`
    );
    if (!ok) return;

    setErro(null);
    setMensagem(null);
    try {
      await excluirFornecedor(f.id);
      if (editandoId === f.id) limparFormulario();
      setMensagem("Fornecedor excluído.");
      await carregar();
      onFornecedoresAlterados?.();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir fornecedor."
      );
    }
  }

  return (
    <section className="rounded-2xl bg-white/90 backdrop-blur-xs border border-sky-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editandoId ? "Editar Fornecedor" : "Fornecedores Parceiros"}
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre e ative os parceiros disponíveis para vincular às ofertas.
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Nome
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (!editandoId) setSlug(gerarSlug(e.target.value));
            }}
            placeholder="Ex.: Shopee"
            className="w-full px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-400"
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
            placeholder="shopee"
            className="w-full px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            URL Base (opcional)
          </label>
          <input
            type="url"
            value={urlBase}
            onChange={(e) => setUrlBase(e.target.value)}
            placeholder="https://shopee.com.br"
            className="w-full px-3 py-2 rounded-xl bg-sky-50/40 border border-sky-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-sky-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Cor Pastel da Badge
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={corBadge}
              onChange={(e) => setCorBadge(e.target.value)}
              className="h-9 w-12 rounded-lg bg-white border border-sky-200 cursor-pointer"
            />
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-slate-900 border border-white shadow-2xs"
              style={{ backgroundColor: corBadge }}
            >
              {nome || "Prévia"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-sky-300 text-sky-600"
            />
            Ativo
          </label>

          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-2 rounded-xl bg-sky-200 hover:bg-sky-300/90 border border-sky-300 font-bold text-sm text-sky-950 disabled:opacity-50 transition"
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
        <p className="text-sm text-slate-500">Carregando fornecedores...</p>
      ) : fornecedores.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum fornecedor cadastrado.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3 pt-2">
          {fornecedores.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-sky-50/50 border border-sky-200/80"
            >
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-900 border border-white"
                style={{ backgroundColor: f.cor_badge || "#A5D8FF" }}
              >
                {f.nome}
              </span>

              <span className="text-xs font-medium text-slate-500">
                {f.ativo ? "Ativo" : "Inativo"}
              </span>

              <button
                type="button"
                onClick={() => iniciarEdicao(f)}
                className="text-xs font-semibold text-slate-700 hover:underline"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => handleAlternarStatus(f)}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                {f.ativo ? "Desativar" : "Ativar"}
              </button>

              <button
                type="button"
                onClick={() => handleExcluir(f)}
                className="text-xs font-semibold text-rose-700 hover:underline"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
