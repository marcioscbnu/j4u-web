'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Subtitles,
  X,
  ExternalLink,
  Wifi,
  BatteryFull,
} from 'lucide-react';
import { resolverUrlVideo } from '@/lib/videoHelper';

interface PhoneVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  titulo: string;
  ofertaUrl: string;
  onAbrirOferta: () => void;
}

function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/shorts/')[1]?.split('/')[0] || null;
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/embed/')[1]?.split('/')[0] || null;
      }
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').split('?')[0] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export default function PhoneVideoModal({
  isOpen,
  onClose,
  videoUrl,
  titulo,
  onAbrirOferta,
}: PhoneVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [legendasAtivas, setLegendasAtivas] = useState(true);
  const [legendaTexto, setLegendaTexto] = useState(titulo);

  const srcResolvido = resolverUrlVideo(videoUrl);
  const youtubeId = getYoutubeId(srcResolvido);
  const isYoutube = Boolean(youtubeId);

  useEffect(() => {
    if (!isOpen) return;
    setIsPlaying(true);
    setIsMuted(false);
    setLegendaTexto(titulo);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, titulo, onClose]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || isYoutube || !isOpen) return;

    const tracks = vid.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = legendasAtivas ? 'showing' : 'hidden';
    }
  }, [legendasAtivas, isYoutube, isOpen]);

  if (!isOpen) return null;

  const sendYoutubeCommand = (func: string, args: unknown[] = []) => {
    const iframeWin = iframeRef.current?.contentWindow;
    if (!iframeWin) return;
    iframeWin.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  const handleTogglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    if (isYoutube) {
      sendYoutubeCommand(nextPlaying ? 'playVideo' : 'pauseVideo');
    } else if (videoRef.current) {
      if (nextPlaying) {
        void videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYoutube) {
      sendYoutubeCommand(nextMuted ? 'mute' : 'unMute');
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleToggleLegendas = () => {
    const nextLeg = !legendasAtivas;
    setLegendasAtivas(nextLeg);
    if (nextLeg) {
      setLegendaTexto(titulo);
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  const youtubeEmbedSrc = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=0&cc_load_policy=${
        legendasAtivas ? 1 : 0
      }&rel=0&playsinline=1`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Moldura realista de celular */}
      <div
        className="relative w-full max-w-[360px] rounded-[44px] bg-gradient-to-b from-slate-700 via-slate-900 to-slate-950 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(56,189,248,0.28)] ring-2 ring-sky-400/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          title="Fechar celular"
          aria-label="Fechar"
          className="absolute -top-3 -right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg ring-2 ring-white/40 hover:scale-105 transition-transform cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="relative flex flex-col overflow-hidden rounded-[34px] bg-black border border-sky-400/20">
          {/* Barra de status superior */}
          <div className="relative z-20 flex items-center justify-between bg-zinc-950 px-5 pt-2.5 pb-2 text-[11px] font-bold text-sky-100">
            <span>09:41</span>
            <div className="h-4 w-24 rounded-full bg-black border border-slate-800 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400/80" />
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-sky-300" />
              <BatteryFull className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Área do Vídeo */}
          <div className="relative aspect-[9/14] w-full bg-black overflow-hidden">
            {isYoutube ? (
              <iframe
                ref={iframeRef}
                key={youtubeEmbedSrc}
                src={youtubeEmbedSrc}
                title={titulo}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                key={srcResolvido}
                ref={videoRef}
                src={srcResolvido}
                autoPlay
                playsInline
                loop
                muted={isMuted}
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="h-full w-full object-cover"
              >
                Seu navegador não suporta reprodução de vídeo HTML5.
              </video>
            )}

            {legendasAtivas && (
              <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 flex justify-center">
                <div className="rounded-xl bg-black/80 backdrop-blur-sm px-3.5 py-2 text-center text-xs sm:text-sm font-bold text-amber-200 shadow-lg border border-white/15 leading-snug">
                  {legendaTexto}
                </div>
              </div>
            )}
          </div>

          {/* Controles: Legendas, Pause/Play, Mute e Close */}
          <div className="bg-zinc-950 border-t border-sky-400/20 px-3 py-3 space-y-2.5">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={handleToggleLegendas}
                title="Ativar ou desativar legendas"
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-[10px] font-extrabold transition-all cursor-pointer ${
                  legendasAtivas
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-zinc-900 text-sky-200 hover:bg-zinc-800'
                }`}
              >
                <Subtitles className="w-4 h-4" />
                <span>{legendasAtivas ? 'Leg. ON' : 'Leg. OFF'}</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 py-2 px-1 text-[10px] font-extrabold text-sky-100 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-300" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                title={isMuted ? 'Ativar som' : 'Silenciar vídeo'}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-1 text-[10px] font-extrabold border transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/25 border-rose-400/40 text-rose-200'
                    : 'bg-zinc-900 border-sky-400/20 text-sky-200 hover:bg-zinc-800'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>Mute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Som ON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                title="Fechar player"
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 py-2 px-1 text-[10px] font-extrabold text-rose-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                handleClose();
                onAbrirOferta();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:brightness-110 text-slate-950 font-black py-2.5 px-4 text-xs shadow-lg transition-all cursor-pointer"
            >
              <span>VER OFERTA NA LOJA</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            <div className="pt-1 flex justify-center">
              <div className="h-1 w-28 rounded-full bg-sky-200/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
