"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Categoria {
  id: string;
  nome: string;
  icone?: string | null;
  ativa?: boolean;
}

interface Fornecedor {
  id: string;
  nome: string;
  slug?: string;
  cor_badge?: string | null;
  ativo?: boolean;
}

interface Oferta {
  id: string;
  titulo: string;
  preco: number;
  imagem_url: string;
  url_afiliado?: string | null;
  url?: string | null;
  video_arquivo?: string | null;
  legenda_video?: string | null;
  ativa?: boolean;
  categoria_id?: string | null;
  fornecedor_id?: string | null;
  fornecedor?: string | null;
  expiracao?: string | null;
  expiracao_iso?: string | null;
}

function formatarPrecoBRL(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function normalizarCaminhoVideo(arquivo?: string | null) {
  if (!arquivo) return "/video/video0001.mp4";
  const limpo = arquivo.trim();
  if (!limpo) return "/video/video0001.mp4";
  if (limpo.startsWith("http") || limpo.startsWith("/")) return limpo;
  return `/video/${limpo}`;
}

function ofertaEstaExpirada(oferta: Oferta, agoraMs: number): boolean {
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
  if (!Number.isFinite(parsed)) return false;
  return agoraMs > parsed;
}

export function VitrineJ4U() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>("todas");
  const [fornecedorSelecionado, setFornecedorSelecionado] =
    useState<string>("todos");

  const [ofertaModalVideo, setOfertaModalVideo] = useState<Oferta | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      try {
        const [resOfertas, resCats, resForns] = await Promise.all([
          supabase
            .from("ofertas")
            .select("*")
            .order("cadastro", { ascending: false }),
          supabase.from("categorias").select("*").order("nome"),
          supabase.from("fornecedores").select("*").order("nome"),
        ]);

        if (!ativo) return;

        const agoraMs = Date.now();
        setOfertas(
          (resOfertas.data || []).filter(
            (o: Oferta) => o.ativa !== false && !ofertaEstaExpirada(o, agoraMs)
          )
        );
        setCategorias(
          (resCats.data || []).filter((c: Categoria) => c.ativa !== false)
        );
        setFornecedores(
          (resForns.data || []).filter((f: Fornecedor) => f.ativo !== false)
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDados();
    return () => {
      ativo = false;
    };
  }, []);

  const mapaCategorias = useMemo(() => {
    const map = new Map<string, Categoria>();
    categorias.forEach((c) => map.set(c.id, c));
    return map;
  }, [categorias]);

  const mapaFornecedores = useMemo(() => {
    const map = new Map<string, Fornecedor>();
    fornecedores.forEach((f) => map.set(f.id, f));
    return map;
  }, [fornecedores]);

  const ofertasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const agoraMs = Date.now();

    return ofertas.filter((oferta) => {
      if (ofertaEstaExpirada(oferta, agoraMs)) return false;

      if (
        categoriaSelecionada !== "todas" &&
        oferta.categoria_id !== categoriaSelecionada
      ) {
        return false;
      }
      if (
        fornecedorSelecionado !== "todos" &&
        oferta.fornecedor_id !== fornecedorSelecionado
      ) {
        return false;
      }
      if (!termo) return true;

      const catNome = oferta.categoria_id
        ? mapaCategorias.get(oferta.categoria_id)?.nome || ""
        : "";
      const fornNome = oferta.fornecedor_id
        ? mapaFornecedores.get(oferta.fornecedor_id)?.nome || ""
        : oferta.fornecedor || "";

      return (
        oferta.titulo.toLowerCase().includes(termo) ||
        catNome.toLowerCase().includes(termo) ||
        fornNome.toLowerCase().includes(termo)
      );
    });
  }, [
    ofertas,
    busca,
    categoriaSelecionada,
    fornecedorSelecionado,
    mapaCategorias,
    mapaFornecedores,
  ]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#09090b] text-zinc-100">
      <div className="border-b border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400 text-zinc-950 font-black uppercase tracking-wider text-[10px]">
              Black Friday J4U
            </span>
            <span className="text-zinc-300 font-medium">
              Curadoria verificada com foto real na íntegra e demonstração em
              vídeo
            </span>
          </div>
          <span className="text-amber-400 font-semibold">
            {ofertasFiltradas.length}{" "}
            {ofertasFiltradas.length === 1
              ? "oferta ativa"
              : "ofertas ativas"}
          </span>
        </div>
      </div>

      <header className="border-b border-zinc-800/90 bg-[#111115]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/10">
              <div className="h-full w-full rounded-2xl bg-zinc-950 flex items-center justify-center font-black text-amber-400 text-base tracking-tight">
                J4U
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-100">
                  J4UMarketPlace
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  Portal Oficial
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Compare fornecedores parceiros e acesse direto o anúncio oficial
                com segurança.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-96">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto, categoria ou parceiro..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700/90 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-5 space-y-4">
          {fornecedores.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Fornecedores Parceiros
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setFornecedorSelecionado("todos")}
                  className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border text-left truncate transition ${
                    fornecedorSelecionado === "todos"
                      ? "bg-yellow-400 text-zinc-950 border-yellow-300 shadow-xs"
                      : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-400/60"
                  }`}
                >
                  Todos os Parceiros
                </button>
                {fornecedores.map((forn) => {
                  const selecionado = fornecedorSelecionado === forn.id;
                  return (
                    <button
                      key={forn.id}
                      type="button"
                      title={forn.nome}
                      onClick={() => setFornecedorSelecionado(forn.id)}
                      className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border text-left truncate transition ${
                        selecionado
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-xs"
                          : "bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-emerald-400/60"
                      }`}
                    >
                      {forn.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {categorias.length > 0 && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Categorias
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriaSelecionada("todas")}
                  className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 text-left transition ${
                    categoriaSelecionada === "todas"
                      ? "bg-amber-500/20 text-amber-300 border-amber-400"
                      : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <span className="shrink-0">✨</span>
                  <span className="truncate">Todas</span>
                </button>
                {categorias.map((cat) => {
                  const selecionada = categoriaSelecionada === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      title={cat.nome}
                      onClick={() => setCategoriaSelecionada(cat.id)}
                      className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 text-left transition ${
                        selecionada
                          ? "bg-amber-500/20 text-amber-300 border-amber-400"
                          : "bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      {cat.icone && <span className="shrink-0">{cat.icone}</span>}
                      <span className="truncate">{cat.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {carregando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-zinc-900/70 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : ofertasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 sm:p-12 text-center space-y-2">
            <p className="text-base font-bold text-zinc-200">
              Nenhuma oferta ativa encontrada para este filtro.
            </p>
            <p className="text-sm text-zinc-400">
              Limpe a busca ou selecione outro fornecedor ou categoria acima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {ofertasFiltradas.map((oferta) => {
              const categoria = oferta.categoria_id
                ? mapaCategorias.get(oferta.categoria_id)
                : undefined;
              const fornecedorObj = oferta.fornecedor_id
                ? mapaFornecedores.get(oferta.fornecedor_id)
                : undefined;
              const nomeFornecedor =
                fornecedorObj?.nome || oferta.fornecedor || "Parceiro Oficial";
              const linkDestino = oferta.url_afiliado || oferta.url || "#";

              return (
                <article
                  key={oferta.id}
                  className="group flex flex-col rounded-2xl bg-[#141418] border border-zinc-800 hover:border-amber-400/70 shadow-lg shadow-black/40 overflow-hidden transition duration-200"
                >
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-zinc-800/80 bg-zinc-950/70">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold tracking-wide bg-zinc-800 text-zinc-100 border border-zinc-700 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {nomeFornecedor}
                    </span>

                    {categoria && (
                      <span className="text-[11px] font-medium text-zinc-400 truncate">
                        {categoria.icone ? `${categoria.icone} ` : ""}
                        {categoria.nome}
                      </span>
                    )}
                  </div>

                  <div className="relative h-56 sm:h-60 w-full bg-black flex items-center justify-center p-3 border-b border-zinc-800/80">
                    <img
                      src={oferta.imagem_url}
                      alt={oferta.titulo}
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-zinc-950/90 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Oferta Verificada
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-sm sm:text-base font-bold text-zinc-100 leading-snug line-clamp-2 group-hover:text-amber-300 transition">
                        {oferta.titulo}
                      </h2>

                      <div className="pt-1">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Preço Especial Black Friday
                        </span>
                        <p className="text-2xl font-black text-yellow-400 tabular-nums tracking-tight">
                          {formatarPrecoBRL(oferta.preco)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <a
                        href={linkDestino}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 transition"
                      >
                        <span>Ver Oferta no Parceiro</span>
                        <span aria-hidden="true">↗</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setOfertaModalVideo(oferta)}
                        className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                      >
                        <span>▶ Ver Demonstração em Vídeo</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {ofertaModalVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOfertaModalVideo(null)}
        >
          <div
            className="w-full max-w-sm rounded-[2.2rem] bg-zinc-950 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                Review J4U • Black Friday
              </span>
              <button
                type="button"
                onClick={() => setOfertaModalVideo(null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
              >
                Fechar ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-[9/16] max-h-[62vh] mx-auto flex items-center justify-center">
              <video
                src={normalizarCaminhoVideo(ofertaModalVideo.video_arquivo)}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            </div>

            <div className="space-y-2.5 px-1">
              <p className="text-xs font-bold text-zinc-100 line-clamp-1">
                {ofertaModalVideo.titulo}
              </p>
              {ofertaModalVideo.legenda_video && (
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5">
                  {ofertaModalVideo.legenda_video}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-lg font-black text-yellow-400 tabular-nums">
                  {formatarPrecoBRL(ofertaModalVideo.preco)}
                </span>
                <a
                  href={
                    ofertaModalVideo.url_afiliado ||
                    ofertaModalVideo.url ||
                    "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wide transition"
                >
                  Comprar Agora ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
