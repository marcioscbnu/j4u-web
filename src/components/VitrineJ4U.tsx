"use client";

import { useEffect, useMemo, useState } from "react";
import { Fornecedor, Oferta } from "@/types/marketplace";
import {
  listarFornecedoresVitrine,
  listarOfertasVitrine,
} from "@/services/vitrineService";

export type TipoOrdenacaoOferta =
  | "mais_recentes"
  | "menor_preco"
  | "maior_preco";

const ITENS_POR_PAGINA = 6;

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
  const [fornecedorSelecionado, setFornecedorSelecionado] =
    useState<string>("todos");
  const [buscaTitulo, setBuscaTitulo] = useState<string>("");
  const [ordenacao, setOrdenacao] =
    useState<TipoOrdenacaoOferta>("mais_recentes");
  const [limiteVisivel, setLimiteVisivel] = useState<number>(ITENS_POR_PAGINA);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarVitrine() {
      setCarregando(true);
      setErro(null);
      try {
        const [listaOfertas, listaFornecedores] = await Promise.all([
          listarOfertasVitrine(),
          listarFornecedoresVitrine(),
        ]);
        setOfertas(listaOfertas);
        setFornecedores(listaFornecedores);
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
  }, [fornecedorSelecionado, buscaTitulo, ordenacao]);

  const fornecedorAtivoObjeto = useMemo(() => {
    if (fornecedorSelecionado === "todos") return null;
    return (
      fornecedores.find((f) => f.id === fornecedorSelecionado) ?? null
    );
  }, [fornecedores, fornecedorSelecionado]);

  const ofertasFiltradasEOrdenadas = useMemo(() => {
    const termo = normalizarTexto(buscaTitulo);

    const filtradas = ofertas.filter((oferta) => {
      const bateFornecedor =
        fornecedorSelecionado === "todos" ||
        oferta.fornecedor_id === fornecedorSelecionado;

      const bateTitulo =
        termo === "" || normalizarTexto(oferta.titulo ?? "").includes(termo);

      return bateFornecedor && bateTitulo;
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
  }, [ofertas, fornecedorSelecionado, buscaTitulo, ordenacao]);

  const ofertasVisiveis = useMemo(() => {
    return ofertasFiltradasEOrdenadas.slice(0, limiteVisivel);
  }, [ofertasFiltradasEOrdenadas, limiteVisivel]);

  const totalFiltrado = ofertasFiltradasEOrdenadas.length;
  const totalExibidoAgora = ofertasVisiveis.length;
  const haMaisOfertas = totalExibidoAgora < totalFiltrado;

  function handleVerMais() {
    setLimiteVisivel((prev) => prev + ITENS_POR_PAGINA);
  }

  function limparFiltros() {
    setFornecedorSelecionado("todos");
    setBuscaTitulo("");
    setOrdenacao("mais_recentes");
    setLimiteVisivel(ITENS_POR_PAGINA);
  }

  const haFiltroAtivo =
    fornecedorSelecionado !== "todos" ||
    buscaTitulo.trim() !== "" ||
    ordenacao !== "mais_recentes";

  const rotuloContagem =
    totalExibidoAgora === 1
      ? "1 oferta exibida"
      : `${totalExibidoAgora} ofertas exibidas`;

  return (
    <section className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto space-y-8">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            J4UMarketPlace
          </h1>
          <p className="text-sm sm:text-base text-zinc-300">
            Curadoria diária de ofertas selecionadas com visualização em vídeo
            local.
          </p>
        </div>

        {/* Resumo no topo: contagem exata de ofertas exibidas + fornecedor ativo */}
        {!carregando && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Fornecedor ativo:
              </span>

              {fornecedorAtivoObjeto ? (
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full text-black"
                  style={{
                    backgroundColor:
                      fornecedorAtivoObjeto.cor_badge || "#38BDF8",
                  }}
                >
                  {fornecedorAtivoObjeto.nome}
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-black">
                  Todos os fornecedores
                </span>
              )}

              {buscaTitulo.trim() !== "" && (
                <span className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-full">
                  Busca: &ldquo;{buscaTitulo.trim()}&rdquo;
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-white" aria-live="polite">
              {rotuloContagem}{" "}
              <span className="text-zinc-400 font-normal">
                (de {totalFiltrado} encontradas)
              </span>
            </p>
          </div>
        )}
      </header>

      {/* Busca por título, ordenação e filtro por fornecedor */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="search"
            value={buscaTitulo}
            onChange={(e) => setBuscaTitulo(e.target.value)}
            placeholder="Buscar oferta pelo título..."
            aria-label="Buscar oferta pelo título"
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />

          <select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(e.target.value as TipoOrdenacaoOferta)
            }
            aria-label="Ordenar ofertas"
            className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 md:w-56"
          >
            <option value="mais_recentes">Mais recentes</option>
            <option value="menor_preco">Menor preço</option>
            <option value="maior_preco">Maior preço</option>
          </select>

          {haFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 text-sm font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div
          className="flex flex-wrap items-center gap-2.5"
          role="group"
          aria-label="Filtrar por fornecedor"
        >
          <button
            type="button"
            onClick={() => setFornecedorSelecionado("todos")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              fornecedorSelecionado === "todos"
                ? "bg-white text-black border-white"
                : "bg-zinc-950 text-zinc-200 border-zinc-700 hover:border-zinc-500"
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
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                  ativo
                    ? "bg-blue-600 text-white border-blue-400"
                    : "bg-zinc-950 text-zinc-200 border-zinc-700 hover:border-zinc-500"
                }`}
              >
                {fornecedor.nome} ({totalDoFornecedor})
              </button>
            );
          })}
        </div>
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-zinc-400">Carregando vitrine...</p>
      ) : ofertasVisiveis.length === 0 ? (
        <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
          <p className="text-zinc-300">
            Nenhuma oferta encontrada para a combinação de busca e fornecedor.
          </p>
          {haFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="px-4 py-2 rounded bg-white text-black text-sm font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ofertasVisiveis.map((oferta) => {
              const caminhoVideo = `/video/${oferta.video_arquivo || "video0001.mp4"}`;

              return (
                <article
                  key={oferta.id}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="aspect-video bg-black border-b border-zinc-800">
                      <video
                        src={caminhoVideo}
                        controls
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {oferta.fornecedor ? (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full text-black"
                            style={{
                              backgroundColor:
                                oferta.fornecedor.cor_badge || "#38BDF8",
                            }}
                          >
                            {oferta.fornecedor.nome}
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            Parceiro
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg font-bold text-white leading-snug">
                        {oferta.titulo}
                      </h2>

                      <p className="text-xl font-extrabold text-emerald-400">
                        R$ {Number(oferta.preco).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <a
                      href={oferta.url_afiliado}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition"
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
                className="px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition"
              >
                Ver mais ofertas ({totalFiltrado - totalExibidoAgora} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
