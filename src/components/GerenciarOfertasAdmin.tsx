"use client";

import { useEffect, useMemo, useState } from "react";
import { Fornecedor, Oferta } from "@/types/marketplace";
import { listarFornecedores } from "@/services/fornecedorService";
import {
  atualizarOferta,
  criarOferta,
  excluirOferta,
  listarOfertasAdmin,
} from "@/services/ofertaService";

const VIDEO_PADRAO = "video0001.mp4";

function sanitizarNomeVideo(valor: string): string {
  const limpo = valor
    .trim()
    .replace(/^\/?video\//i, "")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  if (!limpo) return VIDEO_PADRAO;
  return limpo.toLowerCase().endsWith(".mp4") ? limpo : `${limpo}.mp4`;
}

export function GerenciarOfertasAdmin() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [preco, setPreco] = useState("");
  const [urlAfiliado, setUrlAfiliado] = useState("");
  const [videoArquivo, setVideoArquivo] = useState(VIDEO_PADRAO);
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((f) => f.ativo),
    [fornecedores]
  );

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const [listaOfertas, listaFornecedores] = await Promise.all([
        listarOfertasAdmin(),
        listarFornecedores(),
      ]);
      setOfertas(listaOfertas);
      setFornecedores(listaFornecedores);

      const primeiroAtivo = listaFornecedores.find((f) => f.ativo);
      if (!fornecedorId && primeiroAtivo) {
        setFornecedorId(primeiroAtivo.id);
      }
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar ofertas e fornecedores."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setPreco("");
    setUrlAfiliado("");
    setVideoArquivo(VIDEO_PADRAO);
    setAtivo(true);
    setFornecedorId(fornecedoresAtivos[0]?.id ?? "");
  }

  function iniciarEdicao(oferta: Oferta) {
    setEditandoId(oferta.id);
    setTitulo(oferta.titulo);
    setFornecedorId(oferta.fornecedor_id);
    setPreco(String(oferta.preco));
    setUrlAfiliado(oferta.url_afiliado);
    setVideoArquivo(oferta.video_arquivo || VIDEO_PADRAO);
    setAtivo(oferta.ativo);
    setMensagem(null);
    setErro(null);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    const precoNumerico = Number(preco.replace(",", "."));
    if (!fornecedorId) {
      setErro("Selecione um fornecedor ativo antes de salvar a oferta.");
      return;
    }
    if (!titulo.trim()) {
      setErro("Informe o título da oferta.");
      return;
    }
    if (Number.isNaN(precoNumerico) || precoNumerico <= 0) {
      setErro("Informe um preço válido maior que zero.");
      return;
    }
    if (!urlAfiliado.trim().startsWith("http")) {
      setErro(
        "Informe uma URL de afiliado válida começando com http:// ou https://."
      );
      return;
    }

    const arquivoFinal = sanitizarNomeVideo(videoArquivo);
    setSalvando(true);

    try {
      const payload = {
        titulo: titulo.trim(),
        fornecedor_id: fornecedorId,
        preco: precoNumerico,
        url_afiliado: urlAfiliado.trim(),
        video_arquivo: arquivoFinal,
        ativo,
      };

      if (editandoId) {
        await atualizarOferta(editandoId, payload);
        setMensagem("Oferta atualizada com sucesso.");
      } else {
        await criarOferta(payload);
        setMensagem("Oferta cadastrada com sucesso.");
      }

      limparFormulario();
      await carregarDados();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar a oferta."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarStatus(oferta: Oferta) {
    setErro(null);
    setMensagem(null);
    try {
      await atualizarOferta(oferta.id, { ativo: !oferta.ativo });
      setMensagem(
        `Oferta "${oferta.titulo}" ${
          !oferta.ativo ? "ativada" : "pausada"
        } na vitrine.`
      );
      await carregarDados();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao alterar status da oferta."
      );
    }
  }

  async function handleExcluir(oferta: Oferta) {
    const confirmar = window.confirm(
      `Excluir permanentemente a oferta "${oferta.titulo}"?`
    );
    if (!confirmar) return;

    setErro(null);
    setMensagem(null);
    try {
      await excluirOferta(oferta.id);
      if (editandoId === oferta.id) {
        limparFormulario();
      }
      setMensagem("Oferta excluída.");
      await carregarDados();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir a oferta."
      );
    }
  }

  const previewVideoSrc = `/video/${sanitizarNomeVideo(videoArquivo)}`;

  return (
    <section className="rounded-xl bg-zinc-950 border border-zinc-800 p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {editandoId ? "Editar Oferta" : "Cadastrar Nova Oferta"}
          </h2>
          <p className="text-xs text-zinc-400">
            Vincule um fornecedor ativo e aponte para um arquivo MP4 em{" "}
            <code className="text-zinc-200">public/video/</code> (padrão:{" "}
            <code className="text-zinc-200">/video/video0001.mp4</code>).
          </p>
        </div>

        {editandoId && (
          <button
            type="button"
            onClick={limparFormulario}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:bg-zinc-900"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <form
        onSubmit={handleSalvar}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                Fornecedor ativo
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>
                  Selecione um fornecedor...
                </option>
                {fornecedoresAtivos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
              {fornecedoresAtivos.length === 0 && !carregando && (
                <p className="text-xs text-amber-400 mt-1">
                  Nenhum fornecedor ativo cadastrado. Ative ou crie um
                  fornecedor acima.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="199.90"
                className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
              Título da oferta
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Fone Bluetooth ANC com Estojo Carregador"
              className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                URL de afiliado
              </label>
              <input
                type="url"
                required
                value={urlAfiliado}
                onChange={(e) => setUrlAfiliado(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                Arquivo MP4 local (em /video/)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={videoArquivo}
                  onChange={(e) => setVideoArquivo(e.target.value)}
                  placeholder="video0001.mp4"
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setVideoArquivo(VIDEO_PADRAO)}
                  className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  Padrão
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2.5 text-sm text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-black text-blue-600"
              />
              Exibir oferta imediatamente na vitrine pública
            </label>

            <button
              type="submit"
              disabled={salvando || fornecedoresAtivos.length === 0}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-sm text-white disabled:opacity-50 transition"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Publicar oferta"}
            </button>
          </div>
        </div>

        {/* Prévia do vídeo local */}
        <div className="rounded-xl bg-black border border-zinc-800 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Prévia local</span>
            <code className="text-zinc-300">{previewVideoSrc}</code>
          </div>

          <div className="aspect-video bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
            <video
              key={previewVideoSrc}
              src={previewVideoSrc}
              controls
              muted
              preload="metadata"
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-[11px] text-zinc-500">
            Certifique-se de que o arquivo exista em{" "}
            <code className="text-zinc-400">public{previewVideoSrc}</code>.
          </p>
        </div>
      </form>

      {mensagem && <p className="text-sm text-emerald-400">{mensagem}</p>}
      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {/* Lista de ofertas cadastradas */}
      <div className="space-y-3 pt-4 border-t border-zinc-800">
        <h3 className="text-base font-bold text-white">
          Ofertas Cadastradas ({ofertas.length})
        </h3>

        {carregando ? (
          <p className="text-sm text-zinc-400">Carregando ofertas...</p>
        ) : ofertas.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma oferta cadastrada até o momento.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-black overflow-hidden">
            {ofertas.map((oferta) => (
              <div
                key={oferta.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full text-black"
                      style={{
                        backgroundColor:
                          oferta.fornecedor?.cor_badge || "#38BDF8",
                      }}
                    >
                      {oferta.fornecedor?.nome || "Fornecedor"}
                    </span>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        oferta.ativo
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {oferta.ativo ? "Ativa" : "Inativa"}
                    </span>

                    <span className="text-xs text-zinc-400">
                      /video/{oferta.video_arquivo || VIDEO_PADRAO}
                    </span>
                  </div>

                  <p className="font-semibold text-white">{oferta.titulo}</p>
                  <p className="text-sm font-bold text-emerald-400">
                    R$ {Number(oferta.preco).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAlternarStatus(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                  >
                    {oferta.ativo ? "Pausar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExcluir(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-red-900 text-xs font-semibold text-red-400 hover:bg-red-950"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
