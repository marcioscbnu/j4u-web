"use client";

import { useEffect, useMemo, useState } from "react";
import { Categoria, Fornecedor, Oferta } from "@/types/marketplace";
import {
  listarCategoriasVitrine,
  listarFornecedoresVitrine,
  listarOfertasVitrine,
} from "@/services/vitrineService";
import { SmartphoneVideoModal } from "@/components/SmartphoneVideoModal";

export type TipoOrdenacaoOferta =
  | "mais_recentes"
  | "menor_preco"
  | "maior_preco";

const ITENS_POR_PAGINA = 6;

const PALETA_BORDAS_CARDS = [
  "border-rose-200/90 hover:border-rose-300",
  "border-sky-200/90 hover:border-sky-300",
  "border-emerald-200/90 hover:border-emerald-300",
  "border-violet-200/90 hover:border-violet-300",
  "border-amber-200/90 hover:border-amber-300",
  "border-teal-200/90 hover:border-teal-300",
];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function VitrineJ4U() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<string>("todas");
  const [fornecedorSelecionado, setFornecedorSelecionado] =
    useState<string>("todos");
  const [buscaTitulo, setBuscaTitulo] = useState<string>("");
  const [ordenacao, setOrdenacao] =
    useState<TipoOrdenacaoOferta>("mais_recentes");
  const [limiteVisivel, setLimiteVisivel] = useState<number>(ITENS_POR_PAGINA);
  const [indiceModalVideo, setIndiceModalVideo] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarVitrine() {
      setCarregando(true);
      setErro(null);
      try {
        const [listaOfertas, listaFornecedores, listaCategorias] =
          await Promise.all([
            listarOfertasVitrine(),
            listarFornecedoresVitrine(),
            listarCategoriasVitrine(),
          ]);
        setOfertas(listaOfertas);
        setFornecedores(listaFornecedores);
        setCategorias(listaCategorias);
      } catch (err: unknown) {
        setErro(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as ofertas."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarVitrine();
  }, []);

  useEffect(() => {
    setLimiteVisivel(ITENS_POR_PAGINA);
  }, [categoriaSelecionada, fornecedorSelecionado, buscaTitulo, ordenacao]);

  const categoriaAtivaObjeto = useMemo(() => {
    if (categoriaSelecionada === "todas") return null;
    return categorias.find((c) => c.id === categoriaSelecionada) ?? null;
  }, [categorias, categoriaSelecionada]);

  const fornecedorAtivoObjeto = useMemo(() => {
    if (fornecedorSelecionado === "todos") return null;
    return (
      fornecedores.find((f) => f.id === fornecedorSelecionado) ?? null
    );
  }, [fornecedores, fornecedorSelecionado]);

  const ofertasFiltradasEOrdenadas = useMemo(() => {
    const termo = normalizarTexto(buscaTitulo);

    const filtradas = ofertas.filter((oferta) => {
      const bateCategoria =
        categoriaSelecionada === "todas" ||
        oferta.categoria_id === categoriaSelecionada;

      const bateFornecedor =
        fornecedorSelecionado === "todos" ||
        oferta.fornecedor_id === fornecedorSelecionado;

      const bateTitulo =
        termo === "" || normalizarTexto(oferta.titulo ?? "").includes(termo);

      return bateCategoria && bateFornecedor && bateTitulo;
    });

    const copia = [...filtradas];

    copia.sort((a, b) => {
      if (ordenacao === "menor_preco") {
        return Number(a.preco ?? 0) - Number(b.preco ?? 0);
      }

      if (ordenacao === "maior_preco") {
        return Number(b.preco ?? 0) - Number(a.preco ?? 0);
      }

      const dataA = a.criado_em ? new Date(a.criado_em).getTime() : 0;
      const dataB = b.criado_em ? new Date(b.criado_em).getTime() : 0;
      return dataB - dataA;
    });

    return copia;
  }, [
    ofertas,
    categoriaSelecionada,
    fornecedorSelecionado,
    buscaTitulo,
    ordenacao,
  ]);

  const ofertasVisiveis = useMemo(() => {
    return ofertasFiltradasEOrdenadas.slice(0, limiteVisivel);
  }, [ofertasFiltradasEOrdenadas, limiteVisivel]);

  const ofertaSelecionadaVideo =
    indiceModalVideo !== null
      ? ofertasFiltradasEOrdenadas[indiceModalVideo] ?? null
      : null;

  const totalFiltrado = ofertasFiltradasEOrdenadas.length;
  const totalExibidoAgora = ofertasVisiveis.length;
  const haMaisOfertas = totalExibidoAgora < totalFiltrado;

  function handleVerMais() {
    setLimiteVisivel((prev) => prev + ITENS_POR_PAGINA);
  }

  function limparFiltros() {
    setCategoriaSelecionada("todas");
    setFornecedorSelecionado("todos");
    setBuscaTitulo("");
    setOrdenacao("mais_recentes");
    setLimiteVisivel(ITENS_POR_PAGINA);
  }

  function abrirVideoDaOferta(ofertaId: string) {
    const idx = ofertasFiltradasEOrdenadas.findIndex((o) => o.id === ofertaId);
    if (idx >= 0) {
      setIndiceModalVideo(idx);
    }
  }

  function irParaVideoAnterior() {
    setIndiceModalVideo((prev) => {
      if (prev === null || ofertasFiltradasEOrdenadas.length === 0) return null;
      return (
        (prev - 1 + ofertasFiltradasEOrdenadas.length) %
        ofertasFiltradasEOrdenadas.length
      );
    });
  }

  function irParaProximoVideo() {
    setIndiceModalVideo((prev) => {
      if (prev === null || ofertasFiltradasEOrdenadas.length === 0) return null;
      return (prev + 1) % ofertasFiltradasEOrdenadas.length;
    });
  }

  const haFiltroAtivo =
    categoriaSelecionada !== "todas" ||
    fornecedorSelecionado !== "todos" ||
    buscaTitulo.trim() !== "" ||
    ordenacao !== "mais_recentes";

  const rotuloContagem =
    totalExibidoAgora === 1
      ? "1 oferta exibida"
      : `${totalExibidoAgora} ofertas exibidas`;

  return (
    <section className="min-h-screen px-4 py-8 max-w-6xl mx-auto space-y-8">
      <header className="rounded-3xl bg-gradient-to-r from-rose-100/80 via-violet-100/75 to-sky-100/80 border border-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 border border-violet-200/80 text-xs font-bold text-violet-900">
            <span>✨</span>
            <span>Curadoria de Ofertas</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
            J4UMarketPlace
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Navegue por categoria ou parceiro, veja o produto em alta definição
            por inteiro e toque em{" "}
            <span className="px-2 py-0.5 rounded-md bg-violet-200/70 text-violet-950 font-semibold">
              Ver em vídeo
            </span>{" "}
            para assistir na demonstração interativa.
          </p>
        </div>

        {!carregando && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/85 backdrop-blur-xs border border-white shadow-2xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Filtros ativos:
              </span>

              {categoriaAtivaObjeto ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  {categoriaAtivaObjeto.icone} {categoriaAtivaObjeto.nome}
                </span>
              ) : (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  Todas as categorias
                </span>
              )}

              {fornecedorAtivoObjeto ? (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full text-slate-900 border border-white shadow-2xs"
                  style={{
                    backgroundColor:
                      fornecedorAtivoObjeto.cor_badge || "#BAE6FD",
                  }}
                >
                  {fornecedorAtivoObjeto.nome}
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-200">
                  Todos os fornecedores
                </span>
              )}

              {buscaTitulo.trim() !== "" && (
                <span className="text-xs font-medium text-amber-900 bg-amber-100/80 border border-amber-200 px-2.5 py-1 rounded-full">
                  Busca: &ldquo;{buscaTitulo.trim()}&rdquo;
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-slate-700" aria-live="polite">
              {rotuloContagem}{" "}
              <span className="text-slate-500 font-normal">
                (de {totalFiltrado} encontradas)
              </span>
            </p>
          </div>
        )}
      </header>

      <div className="rounded-2xl bg-white/85 backdrop-blur-xs border border-violet-100 p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="search"
            value={buscaTitulo}
            onChange={(e) => setBuscaTitulo(e.target.value)}
            placeholder="Buscar oferta pelo título..."
            aria-label="Buscar oferta pelo título"
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-50/40 border border-rose-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-violet-400 transition"
          />

          <select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(e.target.value as TipoOrdenacaoOferta)
            }
            aria-label="Ordenar ofertas"
            className="px-4 py-2.5 rounded-xl bg-sky-50/50 border border-sky-200/80 text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-violet-400 md:w-56 transition"
          >
            <option value="mais_recentes">Mais recentes</option>
            <option value="menor_preco">Menor preço</option>
            <option value="maior_preco">Maior preço</option>
          </select>

          {haFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-100 hover:bg-rose-200/80 text-rose-900 text-sm font-bold transition"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {categorias.length > 0 && (
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800/80">
              Categorias
            </span>
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filtrar por categoria"
            >
              <button
                type="button"
                onClick={() => setCategoriaSelecionada("todas")}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition ${
                  categoriaSelecionada === "todas"
                    ? "bg-emerald-200 text-emerald-950 border-emerald-300 shadow-2xs"
                    : "bg-emerald-50/60 text-slate-700 border-emerald-200/70 hover:bg-emerald-100/70"
                }`}
              >
                Todas ({ofertas.length})
              </button>

              {categorias.map((categoria) => {
                const ativa = categoriaSelecionada === categoria.id;
                const totalDaCategoria = ofertas.filter(
                  (o) => o.categoria_id === categoria.id
                ).length;

                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => setCategoriaSelecionada(categoria.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition flex items-center gap-1.5 ${
                      ativa
                        ? "bg-emerald-200 text-emerald-950 border-emerald-300 shadow-2xs"
                        : "bg-emerald-50/60 text-slate-700 border-emerald-200/70 hover:bg-emerald-100/70"
                    }`}
                  >
                    <span>{categoria.icone}</span>
                    <span>{categoria.nome}</span>
                    <span className="opacity-75">({totalDaCategoria})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-sky-800/80">
            Fornecedores
          </span>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filtrar por fornecedor"
          >
            <button
              type="button"
              onClick={() => setFornecedorSelecionado("todos")}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition ${
                fornecedorSelecionado === "todos"
                  ? "bg-sky-200 text-sky-950 border-sky-300 shadow-2xs"
                  : "bg-sky-50/60 text-slate-700 border-sky-200/70 hover:bg-sky-100/70"
              }`}
            >
              Todos ({ofertas.length})
            </button>

            {fornecedores.map((fornecedor) => {
              const ativo = fornecedorSelecionado === fornecedor.id;
              const totalDoFornecedor = ofertas.filter(
                (o) => o.fornecedor_id === fornecedor.id
              ).length;

              return (
                <button
                  key={fornecedor.id}
                  type="button"
                  onClick={() => setFornecedorSelecionado(fornecedor.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition ${
                    ativo
                      ? "bg-violet-200 text-violet-950 border-violet-300 shadow-2xs"
                      : "bg-sky-50/60 text-slate-700 border-sky-200/70 hover:bg-sky-100/70"
                  }`}
                >
                  {fornecedor.nome} ({totalDoFornecedor})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-rose-100/90 border border-rose-200 text-sm font-medium text-rose-900">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="p-8 rounded-2xl bg-white/80 border border-violet-100 text-center text-sm font-medium text-slate-500">
          Carregando vitrine...
        </div>
      ) : ofertasVisiveis.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/90 border border-rose-200 text-center space-y-3 shadow-xs">
          <p className="text-slate-600 font-medium">
            Nenhuma oferta encontrada para a combinação de categoria, fornecedor
            e busca.
          </p>
          {haFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-4 py-2 rounded-xl bg-violet-200 hover:bg-violet-300 text-violet-950 text-sm font-bold transition"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ofertasVisiveis.map((oferta, index) => {
              const temImagem = Boolean(
                oferta.imagem_url && oferta.imagem_url.trim().length > 0
              );
              const bordaPastel =
                PALETA_BORDAS_CARDS[index % PALETA_BORDAS_CARDS.length];

              return (
                <article
                  key={oferta.id}
                  className={`group rounded-3xl bg-white/95 border-2 ${bordaPastel} shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between transition`}
                >
                  <div>
                    <div className="relative h-72 w-full bg-white flex items-center justify-center p-4 border-b border-slate-100 overflow-hidden">
                      {temImagem ? (
                        <img
                          src={oferta.imagem_url ?? ""}
                          alt={oferta.titulo}
                          loading="lazy"
                          className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-amber-50/70 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center p-4 space-y-2">
                          <span className="text-2xl">📦</span>
                          <p className="text-xs text-slate-500">
                            Foto em atualização — assista à demonstração em
                            vídeo
                          </p>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                        {oferta.fornecedor ? (
                          <span
                            className="text-xs font-extrabold px-3 py-1 rounded-full text-slate-900 border border-white/80 shadow-xs"
                            style={{
                              backgroundColor:
                                oferta.fornecedor.cor_badge || "#BAE6FD",
                            }}
                          >
                            {oferta.fornecedor.nome}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-200 shadow-xs">
                            Parceiro
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirVideoDaOferta(oferta.id)}
                        className="absolute bottom-3 right-3 px-3.5 py-2 rounded-full bg-violet-100/95 hover:bg-violet-200 text-violet-950 border border-violet-200 text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <span>📱</span>
                        <span>Ver em vídeo</span>
                      </button>
                    </div>

                    <div className="p-5 space-y-2.5">
                      {oferta.categoria && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100/75 border border-amber-200/80 text-amber-900">
                          <span>{oferta.categoria.icone}</span>
                          <span>{oferta.categoria.nome}</span>
                        </span>
                      )}

                      <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
                        {oferta.titulo}
                      </h2>

                      <p className="text-2xl font-extrabold text-emerald-700">
                        R$ {Number(oferta.preco).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => abrirVideoDaOferta(oferta.id)}
                      className="py-2.5 px-3 rounded-xl bg-violet-100 hover:bg-violet-200/85 border border-violet-200 font-bold text-xs sm:text-sm text-violet-950 flex items-center justify-center gap-1.5 transition"
                    >
                      <span>▶</span>
                      <span>Ver em vídeo</span>
                    </button>

                    <a
                      href={oferta.url_afiliado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-sky-200 hover:bg-sky-300/90 border border-sky-300 font-bold text-xs sm:text-sm text-sky-950 flex items-center justify-center transition"
                    >
                      Ver oferta
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {haMaisOfertas && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleVerMais}
                className="px-6 py-3 rounded-full bg-rose-100 hover:bg-rose-200/90 border border-rose-200 text-rose-950 font-bold text-sm shadow-xs transition"
              >
                Ver mais ofertas ({totalFiltrado - totalExibidoAgora} restantes)
              </button>
            </div>
          )}
        </>
      )}

      <SmartphoneVideoModal
        oferta={ofertaSelecionadaVideo}
        onFechar={() => setIndiceModalVideo(null)}
        onAnterior={irParaVideoAnterior}
        onProxima={irParaProximoVideo}
        indiceAtual={indiceModalVideo ?? 0}
        totalOfertas={ofertasFiltradasEOrdenadas.length}
      />
    </section>
  );
}
