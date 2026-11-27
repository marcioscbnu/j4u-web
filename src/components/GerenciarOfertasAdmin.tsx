"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CategoriaOpcao {
  id: string;
  nome: string;
  icone?: string | null;
}

interface FornecedorOpcao {
  id: string;
  nome: string;
}

interface OfertaItem {
  id: string;
  titulo: string;
  preco: number;
  imagem_url: string;
  url_afiliado?: string | null;
  url?: string | null;
  video_arquivo?: string | null;
  legenda_video?: string | null;
  categoria_id?: string | null;
  fornecedor_id?: string | null;
  fornecedor?: string | null;
  ativa?: boolean | null;
  cadastro?: string | null;
  expiracao?: string | null;
  expiracao_iso?: string | null;
}

function parsePrecoBRL(texto: string) {
  const normalizado = texto.replace(/\s/g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : NaN;
}

function formatarPrecoBRL(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function formatarDataHoraBR(iso?: string | null) {
  if (!iso) return "Sem data";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

function formatarDataCurtaBR(dataYMD?: string | null) {
  if (!dataYMD) return "";
  const texto = dataYMD.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const [ano, mes, dia] = texto.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return texto;
}

function extrairDataInput(oferta: OfertaItem): string {
  const bruto = oferta.expiracao_iso || oferta.expiracao;
  if (!bruto) return "";
  const texto = bruto.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/");
    return `${ano}-${mes}-${dia}`;
  }
  const dt = new Date(texto);
  if (Number.isNaN(dt.getTime())) return "";
  const ano = dt.getFullYear();
  const mes = String(dt.getMonth() + 1).padStart(2, "0");
  const dia = String(dt.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function ofertaEstaExpirada(oferta: OfertaItem, agoraMs: number): boolean {
  const bruto = oferta.expiracao_iso || oferta.expiracao;
  if (!bruto || !bruto.trim()) return false;
  const texto = bruto.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-").map(Number);
    const fimDoDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime();
    return Number.isFinite(fimDoDia) ? agoraMs > fimDoDia : false;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    const fimDoDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime();
    return Number.isFinite(fimDoDia) ? agoraMs > fimDoDia : false;
  }

  const parsed = Date.parse(texto);
  return Number.isFinite(parsed) ? agoraMs > parsed : false;
}

function normalizarVideo(arquivo?: string | null) {
  if (!arquivo || !arquivo.trim()) return "/video/video0001.mp4";
  const limpo = arquivo.trim();
  if (limpo.startsWith("http") || limpo.startsWith("/")) return limpo;
  return `/video/${limpo}`;
}

export function GerenciarOfertasAdmin() {
  const formRef = useRef<HTMLDivElement | null>(null);

  const [categorias, setCategorias] = useState<CategoriaOpcao[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorOpcao[]>([]);
  const [ofertas, setOfertas] = useState<OfertaItem[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cadastroOriginal, setCadastroOriginal] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [precoTexto, setPrecoTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [urlAfiliado, setUrlAfiliado] = useState("");
  const [videoArquivo, setVideoArquivo] = useState("video0001.mp4");
  const [legendaVideo, setLegendaVideo] = useState("");
  const [dataExpiracao, setDataExpiracao] = useState("");
  const [ativa, setAtiva] = useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [filtroListaCategoria, setFiltroListaCategoria] = useState("todas");
  const [buscaLista, setBuscaLista] = useState("");

  const [faxinaCategoriaId, setFaxinaCategoriaId] = useState("todas");
  const [faxinaCadastradosAte, setFaxinaCadastradosAte] = useState("");
  const [confirmarFaxina, setConfirmarFaxina] = useState(false);
  const [executandoFaxina, setExecutandoFaxina] = useState(false);
  const [mensagemFaxina, setMensagemFaxina] = useState<string | null>(null);
  const [erroFaxina, setErroFaxina] = useState<string | null>(null);

  const carregarTudo = useCallback(async () => {
    const [resCats, resForns, resOfertas] = await Promise.all([
      supabase.from("categorias").select("id, nome, icone").order("nome"),
      supabase.from("fornecedores").select("id, nome").order("nome"),
      supabase
        .from("ofertas")
        .select("*")
        .order("cadastro", { ascending: false }),
    ]);

    const cats = (resCats.data || []) as CategoriaOpcao[];
    const forns = (resForns.data || []) as FornecedorOpcao[];
    const ofts = (resOfertas.data || []) as OfertaItem[];

    setCategorias(cats);
    setFornecedores(forns);
    setOfertas(ofts);

    if (!categoriaId && cats.length > 0) setCategoriaId(cats[0].id);
    if (!fornecedorId && forns.length > 0) setFornecedorId(forns[0].id);
  }, [categoriaId, fornecedorId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  function limparFormulario() {
    setEditandoId(null);
    setCadastroOriginal(null);
    setTitulo("");
    setPrecoTexto("");
    setImagemUrl("");
    setUrlAfiliado("");
    setVideoArquivo("video0001.mp4");
    setLegendaVideo("");
    setDataExpiracao("");
    setAtiva(true);
    if (categorias.length > 0) setCategoriaId(categorias[0].id);
    if (fornecedores.length > 0) setFornecedorId(fornecedores[0].id);
  }

  function iniciarEdicaoOferta(oft: OfertaItem) {
    setErro(null);
    setMensagem(null);
    setEditandoId(oft.id);
    setCadastroOriginal(oft.cadastro || null);
    setCategoriaId(oft.categoria_id || categorias[0]?.id || "");
    setFornecedorId(oft.fornecedor_id || fornecedores[0]?.id || "");
    setPrecoTexto(
      Number.isFinite(Number(oft.preco))
        ? Number(oft.preco).toFixed(2).replace(".", ",")
        : ""
    );
    setTitulo(oft.titulo || "");
    setImagemUrl(oft.imagem_url || "");
    setUrlAfiliado(oft.url_afiliado || oft.url || "");
    setVideoArquivo(oft.video_arquivo || "video0001.mp4");
    setLegendaVideo(oft.legenda_video || "");
    setDataExpiracao(extrairDataInput(oft));
    setAtiva(oft.ativa !== false);

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSalvarOferta(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    const precoNum = parsePrecoBRL(precoTexto);
    if (!categoriaId) {
      setErro("Selecione uma categoria.");
      return;
    }
    if (!fornecedorId) {
      setErro("Selecione um fornecedor.");
      return;
    }
    if (!titulo.trim()) {
      setErro("Informe o título da oferta.");
      return;
    }
    if (!Number.isFinite(precoNum) || precoNum <= 0) {
      setErro("Informe um preço válido maior que zero.");
      return;
    }
    if (!imagemUrl.trim()) {
      setErro("Informe a URL da foto do produto.");
      return;
    }

    const fornecedorSelecionado = fornecedores.find(
      (f) => f.id === fornecedorId
    );

    let expiracaoIso: string | null = null;
    let expiracaoTexto: string | null = null;
    if (dataExpiracao.trim()) {
      const [ano, mes, dia] = dataExpiracao.trim().split("-").map(Number);
      const fimDoDiaLocal = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
      if (!Number.isNaN(fimDoDiaLocal.getTime())) {
        expiracaoIso = fimDoDiaLocal.toISOString();
        expiracaoTexto = formatarDataCurtaBR(dataExpiracao.trim());
      }
    }

    setSalvando(true);
    try {
      const payload = {
        categoria_id: categoriaId,
        fornecedor_id: fornecedorId,
        fornecedor: fornecedorSelecionado?.nome || "Parceiro",
        titulo: titulo.trim(),
        preco: precoNum,
        imagem_url: imagemUrl.trim(),
        url_afiliado: urlAfiliado.trim() || null,
        url: urlAfiliado.trim() || null,
        video_arquivo: videoArquivo.trim() || "video0001.mp4",
        legenda_video: legendaVideo.trim() || null,
        expiracao: expiracaoTexto,
        expiracao_iso: expiracaoIso,
        ativa,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("ofertas")
          .update(payload)
          .eq("id", editandoId);
        if (error) throw error;
        setMensagem(
          "Oferta atualizada com sucesso (data de cadastro preservada)."
        );
      } else {
        const { error } = await supabase.from("ofertas").insert(payload);
        if (error) throw error;
        setMensagem("Oferta publicada com sucesso.");
      }

      limparFormulario();
      await carregarTudo();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao salvar oferta."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivaOferta(oft: OfertaItem) {
    setErro(null);
    setMensagem(null);
    try {
      const novoStatus = oft.ativa === false ? true : false;
      const { error } = await supabase
        .from("ofertas")
        .update({ ativa: novoStatus })
        .eq("id", oft.id);
      if (error) throw error;
      await carregarTudo();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao alterar visibilidade."
      );
    }
  }

  async function excluirOferta(id: string) {
    setErro(null);
    setMensagem(null);
    try {
      const { error } = await supabase.from("ofertas").delete().eq("id", id);
      if (error) throw error;
      if (editandoId === id) limparFormulario();
      setMensagem("Oferta excluída.");
      await carregarTudo();
    } catch (err: unknown) {
      setErro(
        err instanceof Error ? err.message : "Erro ao excluir oferta."
      );
    }
  }

  const mapaCategorias = useMemo(() => {
    const map = new Map<string, CategoriaOpcao>();
    categorias.forEach((c) => map.set(c.id, c));
    return map;
  }, [categorias]);

  const ofertasFiltradasLista = useMemo(() => {
    const termo = buscaLista.trim().toLowerCase();
    return ofertas.filter((oft) => {
      if (
        filtroListaCategoria !== "todas" &&
        oft.categoria_id !== filtroListaCategoria
      ) {
        return false;
      }
      if (!termo) return true;
      return (
        oft.titulo.toLowerCase().includes(termo) ||
        (oft.fornecedor || "").toLowerCase().includes(termo)
      );
    });
  }, [ofertas, filtroListaCategoria, buscaLista]);

  const filtroFaxinaAtivo =
    faxinaCategoriaId !== "todas" || Boolean(faxinaCadastradosAte.trim());

  const ofertasAlvoFaxina = useMemo(() => {
    if (!filtroFaxinaAtivo) return [];

    let limiteCadastroMs: number | null = null;
    if (faxinaCadastradosAte.trim()) {
      const [ano, mes, dia] = faxinaCadastradosAte
        .trim()
        .split("-")
        .map(Number);
      const fimDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime();
      if (Number.isFinite(fimDia)) limiteCadastroMs = fimDia;
    }

    return ofertas.filter((oft) => {
      if (
        faxinaCategoriaId !== "todas" &&
        oft.categoria_id !== faxinaCategoriaId
      ) {
        return false;
      }

      if (limiteCadastroMs !== null) {
        if (!oft.cadastro) return false;
        const cadMs = Date.parse(oft.cadastro);
        if (!Number.isFinite(cadMs) || cadMs > limiteCadastroMs) {
          return false;
        }
      }

      return true;
    });
  }, [ofertas, filtroFaxinaAtivo, faxinaCategoriaId, faxinaCadastradosAte]);

  async function executarFaxinaEmLote() {
    setErroFaxina(null);
    setMensagemFaxina(null);

    if (!filtroFaxinaAtivo) {
      setErroFaxina(
        "Selecione uma categoria e/ou uma data limite de cadastramento para a faxina."
      );
      return;
    }

    if (ofertasAlvoFaxina.length === 0) {
      setErroFaxina("Nenhum produto encontrado com esses critérios.");
      return;
    }

    setExecutandoFaxina(true);
    try {
      const idsParaExcluir = ofertasAlvoFaxina.map((o) => o.id);
      const { error } = await supabase
        .from("ofertas")
        .delete()
        .in("id", idsParaExcluir);

      if (error) throw error;

      if (editandoId && idsParaExcluir.includes(editandoId)) {
        limparFormulario();
      }

      setConfirmarFaxina(false);
      setMensagemFaxina(
        `Faxina concluída: ${idsParaExcluir.length} ${
          idsParaExcluir.length === 1
            ? "produto removido"
            : "produtos removidos"
        } com sucesso.`
      );
      await carregarTudo();
    } catch (err: unknown) {
      setErroFaxina(
        err instanceof Error ? err.message : "Erro ao executar faxina em lote."
      );
    } finally {
      setExecutandoFaxina(false);
    }
  }

  const agoraMs = Date.now();

  return (
    <section
      ref={formRef}
      className="rounded-2xl bg-[#141418] border border-zinc-800 p-5 sm:p-6 shadow-xl shadow-black/50 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            {editandoId ? "Modo de Edição" : "Catálogo Ativo"}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
            {editandoId ? "Editar Oferta Selecionada" : "Cadastrar Nova Oferta"}
          </h2>
          <p className="text-xs text-zinc-400">
            {editandoId
              ? `Editando oferta cadastrada em ${formatarDataHoraBR(
                  cadastroOriginal
                )} (a data original de cadastro será mantida).`
              : "Vincule categoria e fornecedor, defina a data de expiração (opcional) e o vídeo em /video/."}
          </p>
        </div>

        {editandoId && (
          <button
            type="button"
            onClick={limparFormulario}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-amber-300 transition"
          >
            + Cancelar Edição / Nova Oferta
          </button>
        )}
      </div>

      <form
        onSubmit={handleSalvarOferta}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Categoria
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icone ? `${c.icone} ` : ""}
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Fornecedor
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
              >
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Preço (R$)
              </label>
              <input
                type="text"
                value={precoTexto}
                onChange={(e) => setPrecoTexto(e.target.value)}
                placeholder="56,90"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-yellow-300 font-bold text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Título da Oferta
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Nome completo do produto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                URL da Foto na Íntegra
              </label>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                URL de Afiliado
              </label>
              <input
                type="url"
                value={urlAfiliado}
                onChange={(e) => setUrlAfiliado(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Arquivo MP4 em /video/
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoArquivo}
                  onChange={(e) => setVideoArquivo(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setVideoArquivo("video0001.mp4")}
                  className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-amber-300 shrink-0"
                >
                  Padrão
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Legenda do Vídeo
              </label>
              <input
                type="text"
                value={legendaVideo}
                onChange={(e) => setLegendaVideo(e.target.value)}
                placeholder="Resumo rápido..."
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Expira em (Opcional)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={dataExpiracao}
                  onChange={(e) => setDataExpiracao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
                />
                {dataExpiracao && (
                  <button
                    type="button"
                    onClick={() => setDataExpiracao("")}
                    title="Remover expiração"
                    className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-200 cursor-pointer">
              <input
                type="checkbox"
                checked={ativa}
                onChange={(e) => setAtiva(e.target.checked)}
                className="h-4 w-4 accent-emerald-500 rounded"
              />
              <span>
                Oferta ativa (visível no portal enquanto não expirar)
              </span>
            </label>

            <div className="flex items-center gap-2">
              {editandoId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={salvando}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider disabled:opacity-50 transition"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Salvar alterações"
                  : "Publicar oferta"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Prévia da Foto na Íntegra
          </p>
          <div className="h-44 w-full rounded-xl bg-black border border-zinc-800 flex items-center justify-center p-2">
            {imagemUrl ? (
              <img
                src={imagemUrl}
                alt="Prévia"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-zinc-500">Sem imagem</span>
            )}
          </div>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <p className="truncate">Vídeo: {normalizarVideo(videoArquivo)}</p>
            <p>
              Expiração:{" "}
              <span className="text-zinc-200 font-semibold">
                {dataExpiracao
                  ? `${formatarDataCurtaBR(dataExpiracao)} (23:59)`
                  : "Sem prazo definido"}
              </span>
            </p>
          </div>
        </div>
      </form>

      {erro && <p className="text-sm font-semibold text-rose-400">{erro}</p>}
      {mensagem && (
        <p className="text-sm font-semibold text-emerald-400">{mensagem}</p>
      )}

      <div className="rounded-2xl bg-zinc-950/90 border border-rose-500/30 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
              Manutenção do Catálogo
            </span>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100">
              Faxina de Produtos por Categoria e Data de Cadastramento
            </h3>
            <p className="text-xs text-zinc-400">
              Elimine em lote produtos antigos ou de uma categoria específica
              com base na data em que foram cadastrados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Categoria Alvo
            </label>
            <select
              value={faxinaCategoriaId}
              onChange={(e) => {
                setFaxinaCategoriaId(e.target.value);
                setConfirmarFaxina(false);
                setErroFaxina(null);
                setMensagemFaxina(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-rose-400"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icone ? `${c.icone} ` : ""}
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Cadastrados até a data (inclusive)
            </label>
            <input
              type="date"
              value={faxinaCadastradosAte}
              onChange={(e) => {
                setFaxinaCadastradosAte(e.target.value);
                setConfirmarFaxina(false);
                setErroFaxina(null);
                setMensagemFaxina(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="sm:col-span-3 flex gap-2">
            {!confirmarFaxina ? (
              <button
                type="button"
                disabled={!filtroFaxinaAtivo || ofertasAlvoFaxina.length === 0}
                onClick={() => setConfirmarFaxina(true)}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-extrabold text-xs uppercase tracking-wide disabled:opacity-40 transition"
              >
                {filtroFaxinaAtivo
                  ? `Limpar (${ofertasAlvoFaxina.length})`
                  : "Selecione filtro"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={executandoFaxina}
                  onClick={executarFaxinaEmLote}
                  className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wide disabled:opacity-50 transition"
                >
                  {executandoFaxina
                    ? "Removendo..."
                    : `Confirmar (${ofertasAlvoFaxina.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarFaxina(false)}
                  className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {filtroFaxinaAtivo && (
          <p className="text-xs text-zinc-300">
            Itens encontrados para faxina:{" "}
            <strong className="text-amber-300">
              {ofertasAlvoFaxina.length}
            </strong>
            {faxinaCadastradosAte
              ? ` (cadastrados até ${formatarDataCurtaBR(
                  faxinaCadastradosAte
                )})`
              : ""}
            .
          </p>
        )}

        {erroFaxina && (
          <p className="text-xs font-semibold text-rose-400">{erroFaxina}</p>
        )}
        {mensagemFaxina && (
          <p className="text-xs font-semibold text-emerald-400">
            {mensagemFaxina}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-2 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">
            Ofertas Cadastradas ({ofertasFiltradasLista.length} de{" "}
            {ofertas.length})
          </h3>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filtroListaCategoria}
              onChange={(e) => setFiltroListaCategoria(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icone ? `${c.icone} ` : ""}
                  {c.nome}
                </option>
              ))}
            </select>

            <input
              type="search"
              value={buscaLista}
              onChange={(e) => setBuscaLista(e.target.value)}
              placeholder="Filtrar ofertas..."
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {ofertasFiltradasLista.length === 0 ? (
          <p className="text-sm text-zinc-400">
            Nenhuma oferta encontrada com os filtros atuais.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ofertasFiltradasLista.map((oft) => {
              const expirada = ofertaEstaExpirada(oft, agoraMs);
              const estaAtiva = oft.ativa !== false;
              const visivelNaVitrine = estaAtiva && !expirada;
              const catObj = oft.categoria_id
                ? mapaCategorias.get(oft.categoria_id)
                : undefined;
              const expDataTexto = extrairDataInput(oft);

              return (
                <div
                  key={oft.id}
                  className={`flex flex-col justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border transition ${
                    editandoId === oft.id
                      ? "border-amber-400 ring-1 ring-amber-400/40"
                      : "border-zinc-800"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-16 w-16 rounded-lg bg-black border border-zinc-800 flex items-center justify-center p-1 shrink-0">
                      <img
                        src={oft.imagem_url}
                        alt={oft.titulo}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            visivelNaVitrine
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                              : expirada
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/40"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {expirada
                            ? "Expirada (Oculta)"
                            : estaAtiva
                            ? "Visível"
                            : "Pausada"}
                        </span>

                        {catObj && (
                          <span className="text-[11px] text-zinc-400 truncate">
                            {catObj.icone ? `${catObj.icone} ` : ""}
                            {catObj.nome}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-zinc-100 line-clamp-2">
                        {oft.titulo}
                      </p>

                      <p className="text-sm font-black text-yellow-400 tabular-nums">
                        {formatarPrecoBRL(oft.preco)}{" "}
                        <span className="text-[11px] font-medium text-zinc-400">
                          • {oft.fornecedor || "Parceiro"}
                        </span>
                      </p>

                      <div className="text-[11px] text-zinc-400 space-y-0.5">
                        <p>Cadastrado em: {formatarDataHoraBR(oft.cadastro)}</p>
                        {expDataTexto && (
                          <p
                            className={
                              expirada ? "text-rose-400 font-semibold" : ""
                            }
                          >
                            Expira em: {formatarDataCurtaBR(expDataTexto)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-zinc-800/80 text-xs">
                    <button
                      type="button"
                      onClick={() => iniciarEdicaoOferta(oft)}
                      className="font-bold text-amber-300 hover:text-amber-200 transition"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => alternarAtivaOferta(oft)}
                      className="font-semibold text-zinc-300 hover:text-white transition"
                    >
                      {estaAtiva ? "Pausar" : "Ativar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirOferta(oft.id)}
                      className="font-bold text-rose-400 hover:text-rose-300 transition"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
