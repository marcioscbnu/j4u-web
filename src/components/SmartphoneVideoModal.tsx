"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Oferta } from "@/types/marketplace";

interface SmartphoneVideoModalProps {
  oferta: Oferta | null;
  onFechar: () => void;
  onAnterior?: () => void;
  onProxima?: () => void;
  indiceAtual?: number;
  totalOfertas?: number;
}

const LINHAS_TECLADO: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "!", "?"],
];

function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg.toString().padStart(2, "0")}`;
}

export function SmartphoneVideoModal({
  oferta,
  onFechar,
  onAnterior,
  onProxima,
  indiceAtual = 0,
  totalOfertas = 1,
}: SmartphoneVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [tocando, setTocando] = useState(true);
  const [mutado, setMutado] = useState(false);
  const [mostrarLegendas, setMostrarLegendas] = useState(true);
  const [textoLegenda, setTextoLegenda] = useState("");
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [caixaAlta, setCaixaAlta] = useState(true);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [erroVideo, setErroVideo] = useState(false);

  useEffect(() => {
    if (!oferta) return;
    const legendaInicial =
      oferta.legenda_video?.trim() ||
      `${oferta.titulo} — R$ ${Number(oferta.preco).toFixed(2)}`;
    setTextoLegenda(legendaInicial);
    setMostrarLegendas(true);
    setTecladoAberto(false);
    setErroVideo(false);
    setTempoAtual(0);
    setDuracao(0);
    setTocando(true);
  }, [oferta]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !oferta) return;
    vid.muted = mutado;
  }, [mutado, oferta]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !oferta) return;
    vid
      .play()
      .then(() => setTocando(true))
      .catch(() => {
        vid.muted = true;
        setMutado(true);
        vid
          .play()
          .then(() => setTocando(true))
          .catch(() => setTocando(false));
      });
  }, [oferta]);

  const alternarPlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid
        .play()
        .then(() => setTocando(true))
        .catch(() => setTocando(false));
    } else {
      vid.pause();
      setTocando(false);
    }
  }, []);

  const alternarMudo = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const proximo = !mutado;
    vid.muted = proximo;
    setMutado(proximo);
  }, [mutado]);

  useEffect(() => {
    if (!oferta) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onFechar();
      } else if (!tecladoAberto && e.key === " ") {
        e.preventDefault();
        alternarPlayPause();
      } else if (!tecladoAberto && (e.key === "m" || e.key === "M")) {
        alternarMudo();
      } else if (!tecladoAberto && e.key === "ArrowRight" && onProxima) {
        onProxima();
      } else if (!tecladoAberto && e.key === "ArrowLeft" && onAnterior) {
        onAnterior();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    oferta,
    onFechar,
    tecladoAberto,
    alternarPlayPause,
    alternarMudo,
    onProxima,
    onAnterior,
  ]);

  const legendaPadraoOferta = useMemo(() => {
    if (!oferta) return "";
    return (
      oferta.legenda_video?.trim() ||
      `${oferta.titulo} — R$ ${Number(oferta.preco).toFixed(2)}`
    );
  }, [oferta]);

  if (!oferta) return null;

  const caminhoVideo = `/video/${oferta.video_arquivo || "video0001.mp4"}`;
  const progressoPercentual =
    duracao > 0 ? Math.min(100, (tempoAtual / duracao) * 100) : 0;

  function digitarCaractere(char: string) {
    const letra = caixaAlta ? char.toUpperCase() : char.toLowerCase();
    setTextoLegenda((prev) => prev + letra);
    setMostrarLegendas(true);
    if (caixaAlta && /[A-Z]/.test(char)) {
      setCaixaAlta(false);
    }
  }

  function apagarCaractere() {
    setTextoLegenda((prev) => prev.slice(0, -1));
  }

  function limparLegenda() {
    setTextoLegenda("");
  }

  function restaurarLegenda() {
    setTextoLegenda(legendaPadraoOferta);
    setMostrarLegendas(true);
    setCaixaAlta(true);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const vid = videoRef.current;
    const novoTempo = Number(e.target.value);
    setTempoAtual(novoTempo);
    if (vid && Number.isFinite(novoTempo)) {
      vid.currentTime = novoTempo;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Player em vídeo: ${oferta.titulo}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar player do celular"
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-rose-100 hover:bg-rose-200 border border-rose-200 text-xs font-bold text-rose-900 shadow-md transition"
      >
        ✕ Fechar
      </button>

      {totalOfertas > 1 && onAnterior && (
        <button
          type="button"
          onClick={onAnterior}
          aria-label="Oferta anterior"
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/95 hover:bg-sky-100 border border-sky-200 text-slate-700 shadow-md mr-5 transition"
        >
          ‹
        </button>
      )}

      <div className="relative w-full max-w-[392px] rounded-[46px] bg-gradient-to-b from-rose-100 via-violet-100 to-sky-100 p-[11px] shadow-[0_20px_60px_rgba(100,116,139,0.28)] border border-white my-auto">
        <button
          type="button"
          onClick={alternarMudo}
          title="Volume / Mudo"
          className="hidden sm:block absolute -left-[4px] top-28 w-[3px] h-10 bg-violet-300 rounded-l"
        />
        <button
          type="button"
          onClick={alternarPlayPause}
          title="Play / Pause"
          className="hidden sm:block absolute -right-[4px] top-32 w-[3px] h-14 bg-violet-300 rounded-r"
        />

        <div className="relative w-full rounded-[36px] bg-white overflow-hidden border border-violet-200/80 flex flex-col">
          <div className="flex items-center justify-between px-5 pt-2.5 pb-2 bg-gradient-to-r from-rose-50 via-violet-50 to-sky-50 text-[11px] font-semibold text-slate-600 select-none border-b border-slate-100">
            <span>J4U • LIVE</span>
            <div className="w-24 h-5 rounded-full bg-white border border-violet-200 flex items-center justify-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-600 font-bold">
                {indiceAtual + 1}/{totalOfertas}
              </span>
            </div>
            <span>5G 100%</span>
          </div>

          <div
            className={`relative w-full bg-slate-900 transition-all duration-200 ${
              tecladoAberto ? "h-[245px]" : "h-[430px]"
            }`}
          >
            {erroVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-rose-50">
                <p className="text-sm font-bold text-rose-800">
                  Vídeo não encontrado em public{caminhoVideo}
                </p>
                <p className="text-xs text-slate-600">
                  Verifique se o arquivo{" "}
                  <code className="px-1.5 py-0.5 rounded bg-white text-slate-800 font-semibold">
                    {oferta.video_arquivo}
                  </code>{" "}
                  está salvo na pasta{" "}
                  <code className="px-1.5 py-0.5 rounded bg-white text-slate-800 font-semibold">
                    public/video/
                  </code>
                  .
                </p>
              </div>
            ) : (
              <video
                key={caminhoVideo}
                ref={videoRef}
                src={caminhoVideo}
                playsInline
                loop
                preload="auto"
                onClick={alternarPlayPause}
                onTimeUpdate={(e) => setTempoAtual(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
                onPlay={() => setTocando(true)}
                onPause={() => setTocando(false)}
                onError={() => setErroVideo(true)}
                className="w-full h-full object-contain bg-slate-900 cursor-pointer"
              />
            )}

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
                <span
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-full text-slate-900 shadow-sm border border-white/60"
                  style={{
                    backgroundColor: oferta.fornecedor?.cor_badge || "#BAE6FD",
                  }}
                >
                  {oferta.fornecedor?.nome || "Oferta J4U"}
                </span>

                {oferta.categoria && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/95 text-slate-700 border border-violet-200 shadow-sm">
                    {oferta.categoria.icone} {oferta.categoria.nome}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                {totalOfertas > 1 && onAnterior && (
                  <button
                    type="button"
                    onClick={onAnterior}
                    className="px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-sky-100 shadow-sm"
                  >
                    ‹ Ant
                  </button>
                )}
                {totalOfertas > 1 && onProxima && (
                  <button
                    type="button"
                    onClick={onProxima}
                    className="px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-sky-100 shadow-sm"
                  >
                    Próx ›
                  </button>
                )}
              </div>
            </div>

            {!tocando && !erroVideo && (
              <button
                type="button"
                onClick={alternarPlayPause}
                aria-label="Retomar reprodução"
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/90 border border-violet-200 text-slate-800 flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
              >
                ▶
              </button>
            )}

            {mostrarLegendas && textoLegenda.trim() !== "" && (
              <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                <div className="max-w-[94%] px-3.5 py-2 rounded-xl bg-white/92 backdrop-blur-xs border border-violet-200 text-center shadow-md">
                  <p className="text-xs sm:text-[13px] font-semibold leading-snug text-slate-800">
                    {textoLegenda}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-2 pb-1 bg-slate-50 border-t border-slate-100 space-y-1">
            <input
              type="range"
              min={0}
              max={duracao || 100}
              step={0.1}
              value={tempoAtual}
              onChange={handleSeek}
              aria-label="Progresso do vídeo"
              className="w-full h-1.5 bg-violet-100 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{formatarTempo(tempoAtual)}</span>
              <span>{Math.round(progressoPercentual)}%</span>
              <span>{formatarTempo(duracao)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 px-3 py-2 bg-white border-t border-slate-100">
            <button
              type="button"
              onClick={alternarPlayPause}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                tocando
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-sky-100 border-sky-300 text-sky-900"
              }`}
            >
              <span>{tocando ? "⏸" : "▶"}</span>
              <span>{tocando ? "Pausar" : "Tocar"}</span>
            </button>

            <button
              type="button"
              onClick={alternarMudo}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                mutado
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{mutado ? "🔇" : "🔊"}</span>
              <span>{mutado ? "Mutado" : "Som"}</span>
            </button>

            <button
              type="button"
              onClick={() => setMostrarLegendas((prev) => !prev)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                mostrarLegendas
                  ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span>CC</span>
              <span>{mostrarLegendas ? "Omitir" : "Legenda"}</span>
            </button>

            <button
              type="button"
              onClick={() => setTecladoAberto((prev) => !prev)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                tecladoAberto
                  ? "bg-violet-100 border-violet-300 text-violet-900"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>⌨</span>
              <span>{tecladoAberto ? "Fechar" : "Editar CC"}</span>
            </button>
          </div>

          {tecladoAberto ? (
            <div className="bg-violet-50/70 border-t border-violet-100 p-2.5 space-y-2 select-none">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={textoLegenda}
                  onChange={(e) => {
                    setTextoLegenda(e.target.value);
                    setMostrarLegendas(true);
                  }}
                  placeholder="Digite ou edite a legenda do vídeo..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-violet-200 text-xs text-slate-800 focus:outline-none focus:border-violet-400"
                />
                <button
                  type="button"
                  onClick={limparLegenda}
                  title="Remover toda a legenda"
                  className="px-2 py-1.5 rounded-lg bg-rose-100 border border-rose-200 text-[11px] font-bold text-rose-800 hover:bg-rose-200"
                >
                  Remover
                </button>
                <button
                  type="button"
                  onClick={restaurarLegenda}
                  title="Restaurar legenda original"
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-1">
                {LINHAS_TECLADO.map((linha, idxLinha) => (
                  <div key={idxLinha} className="flex justify-center gap-1">
                    {idxLinha === 2 && (
                      <button
                        type="button"
                        onClick={() => setCaixaAlta((prev) => !prev)}
                        className={`px-2 py-1.5 rounded-md text-[11px] font-bold border ${
                          caixaAlta
                            ? "bg-violet-200 border-violet-300 text-violet-950"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        ⇧
                      </button>
                    )}

                    {linha.map((tecla) => (
                      <button
                        key={tecla}
                        type="button"
                        onClick={() => digitarCaractere(tecla)}
                        className="flex-1 max-w-[31px] py-1.5 rounded-md bg-white hover:bg-sky-50 active:bg-violet-200 border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                      >
                        {caixaAlta ? tecla : tecla.toLowerCase()}
                      </button>
                    ))}

                    {idxLinha === 2 && (
                      <button
                        type="button"
                        onClick={apagarCaractere}
                        aria-label="Apagar caractere"
                        className="px-2.5 py-1.5 rounded-md bg-white hover:bg-rose-50 border border-slate-200 text-xs font-bold text-slate-700"
                      >
                        ⌫
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setMostrarLegendas((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-md bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-[11px] font-bold text-emerald-900"
                  >
                    {mostrarLegendas ? "Omitir CC" : "Exibir CC"}
                  </button>

                  <button
                    type="button"
                    onClick={() => digitarCaractere(" ")}
                    className="flex-1 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
                  >
                    Espaço
                  </button>

                  <button
                    type="button"
                    onClick={() => setTecladoAberto(false)}
                    className="px-3 py-1.5 rounded-md bg-violet-200 hover:bg-violet-300 border border-violet-300 text-[11px] font-bold text-violet-950"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 bg-gradient-to-r from-rose-50/60 via-white to-sky-50/60 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 line-clamp-1">
                  {oferta.titulo}
                </p>
                <span className="text-base font-extrabold text-emerald-700 shrink-0">
                  R$ {Number(oferta.preco).toFixed(2)}
                </span>
              </div>

              <a
                href={oferta.url_afiliado}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2.5 px-4 rounded-xl bg-sky-200 hover:bg-sky-300/90 border border-sky-300 font-bold text-sm text-sky-950 shadow-2xs transition"
              >
                Aproveitar oferta agora →
              </a>
            </div>
          )}

          <div className="py-2 bg-white flex justify-center">
            <button
              type="button"
              onClick={onFechar}
              title="Voltar para a vitrine"
              className="w-28 h-1.5 rounded-full bg-slate-200 hover:bg-violet-300 transition"
            />
          </div>
        </div>
      </div>

      {totalOfertas > 1 && onProxima && (
        <button
          type="button"
          onClick={onProxima}
          aria-label="Próxima oferta"
          className="hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-white/95 hover:bg-sky-100 border border-sky-200 text-slate-700 shadow-md ml-5 transition"
        >
          ›
        </button>
      )}
    </div>
  );
}
