"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Categoria, Fornecedor, Oferta } from "@/types/marketplace";
import { listarFornecedores } from "@/services/fornecedorService";
import { listarCategorias } from "@/services/categoriaService";
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [preco, setPreco] = useState("");
  const [urlAfiliado, setUrlAfiliado] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [videoArquivo, setVideoArquivo] = useState(VIDEO_PADRAO);
  const [legendaVideo, setLegendaVideo] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((f) => f.ativo),
    [fornecedores]
  );

  const categoriasAtivas = useMemo(
    () => categorias.filter((c) => c.ativo),
    [categorias]
  );

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [listaOfertas, listaFornecedores, listaCategorias] =
        await Promise.all([
          listarOfertasAdmin(),
          listarFornecedores(),
          listarCategorias(),
        ]);
      setOfertas(listaOfertas);
      setFornecedores(listaFornecedores);
      setCategorias(listaCategorias);

      const primeiroFornecedorAtivo = listaFornecedores.find((f) => f.ativo);
      setFornecedorId((atual) => atual || primeiroFornecedorAtivo?.id || "");
    } catch (err: unknown) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar ofertas, categorias e fornecedores."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function limparFormulario() {
    setEditandoId(null);
    setTitulo("");
    setPreco("");
    setUrlAfiliado("");
    setImagemUrl("");
    setVideoArquivo(VIDEO_PADRAO);
    setLegendaVideo("");
    setAtivo(true);
    setFornecedorId(fornecedoresAtivos[0]?.id ?? "");
    setCategoriaId("");
  }

  function iniciarEdicao(oferta: Oferta) {
    setEditandoId(oferta.id);
    setTitulo(oferta.titulo);
    setFornecedorId(oferta.fornecedor_id);
    setCategoriaId(oferta.categoria_id ?? "");
    setPreco(String(oferta.preco));
    setUrlAfiliado(oferta.url_afiliado);
    setImagemUrl(oferta.imagem_url ?? "");
    setVideoArquivo(oferta.video_arquivo || VIDEO_PADRAO);
    setLegendaVideo(oferta.legenda_video ?? "");
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
        categoria_id: categoriaId || null,
        preco: precoNumerico,
        url_afiliado: urlAfiliado.trim(),
        imagem_url: imagemUrl.trim() || null,
        video_arquivo: arquivoFinal,
        legenda_video: legendaVideo.trim() || titulo.trim(),
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
    <section className="rounded-2xl bg-white/90 backdrop-blur-xs border border-rose-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {editandoId ? "Editar Oferta" : "Cadastrar Nova Oferta"}
          </h2>
          <p className="text-xs text-slate-500">
            Vincule a categoria e o fornecedor, informe a foto na íntegra, o
            vídeo local em{" "}
            <code className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-900 font-medium">
              public/video/
            </code>{" "}
            e a legenda inicial.
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Categoria
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
              >
                <option value="">Sem categoria</option>
                {categoriasAtivas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icone} {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Fornecedor ativo
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
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
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Título da oferta
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Secador de Cabelos Travel Mondial 1200W"
              className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                URL da foto do produto (exibida na íntegra)
              </label>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                URL de afiliado
              </label>
              <input
                type="url"
                required
                value={urlAfiliado}
                onChange={(e) => setUrlAfiliado(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Arquivo MP4 local (em /video/)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={videoArquivo}
                  onChange={(e) => setVideoArquivo(e.target.value)}
                  placeholder="video0001.mp4"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
                />
                <button
                  type="button"
                  onClick={() => setVideoArquivo(VIDEO_PADRAO)}
                  className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-100/80 text-xs font-bold text-amber-900 hover:bg-amber-200/70"
                >
                  Padrão
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Legenda inicial no mockup do celular
              </label>
              <input
                type="text"
                value={legendaVideo}
                onChange={(e) => setLegendaVideo(e.target.value)}
                placeholder="Se vazio, usa o título da oferta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200 text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-violet-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="h-4 w-4 rounded border-violet-300 text-violet-600"
              />
              Exibir oferta imediatamente na vitrine pública
            </label>

            <button
              type="submit"
              disabled={salvando || fornecedoresAtivos.length === 0}
              className="px-5 py-2.5 rounded-xl bg-violet-200 hover:bg-violet-300/90 border border-violet-300 font-bold text-sm text-violet-950 disabled:opacity-50 shadow-2xs transition"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                ? "Salvar alterações"
                : "Publicar oferta"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-rose-50/60 to-sky-50/60 border border-violet-100 p-3.5 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Prévia da foto na íntegra
            </span>
            <div className="h-32 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
              {imagemUrl.trim() ? (
                <img
                  src={imagemUrl.trim()}
                  alt="Prévia do produto"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">
                  Cole a URL da foto ao lado
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Prévia do vídeo</span>
              <code className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                {previewVideoSrc}
              </code>
            </div>
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
              <video
                key={previewVideoSrc}
                src={previewVideoSrc}
                controls
                muted
                preload="metadata"
                playsInline
                className="w-full h-full object-contain bg-slate-900"
              />
            </div>
          </div>
        </div>
      </form>

      {mensagem && (
        <p className="text-sm font-medium text-emerald-700">{mensagem}</p>
      )}
      {erro && <p className="text-sm font-medium text-rose-700">{erro}</p>}

      <div className="space-y-3 pt-4 border-t border-rose-100">
        <h3 className="text-base font-bold text-slate-800">
          Ofertas Cadastradas ({ofertas.length})
        </h3>

        {carregando ? (
          <p className="text-sm text-slate-500">Carregando ofertas...</p>
        ) : ofertas.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma oferta cadastrada até o momento.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
            {ofertas.map((oferta) => (
              <div
                key={oferta.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-rose-50/25 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                    {oferta.imagem_url ? (
                      <img
                        src={oferta.imagem_url}
                        alt={oferta.titulo}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Sem foto</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-900 border border-white"
                        style={{
                          backgroundColor:
                            oferta.fornecedor?.cor_badge || "#BAE6FD",
                        }}
                      >
                        {oferta.fornecedor?.nome || "Fornecedor"}
                      </span>

                      {oferta.categoria && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100/80 border border-amber-200 text-amber-900 font-semibold">
                          {oferta.categoria.icone} {oferta.categoria.nome}
                        </span>
                      )}

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          oferta.ativo
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {oferta.ativo ? "Ativa" : "Inativa"}
                      </span>

                      <span className="text-xs text-slate-500">
                        /video/{oferta.video_arquivo || VIDEO_PADRAO}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800">{oferta.titulo}</p>
                    <p className="text-sm font-extrabold text-emerald-700">
                      R$ {Number(oferta.preco).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAlternarStatus(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-xs font-bold text-sky-900 hover:bg-sky-100"
                  >
                    {oferta.ativo ? "Pausar" : "Ativar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExcluir(oferta)}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-800 hover:bg-rose-100"
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
