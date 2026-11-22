"use client";

import React, { useState } from "react";
import {
  PlusCircle,
  Trash2,
  Download,
  BarChart3,
  FolderPlus,
  Image as ImageIcon,
  Link2,
} from "lucide-react";
import {
  Categoria,
  FornecedorTipo,
  Oferta,
  OfertaStatus,
} from "@/types/marketplace";
import {
  criarCategoria,
  excluirCategoria,
  criarOferta,
  excluirOferta,
  atualizarOferta,
} from "@/services/marketplaceService";
import { CATEGORY_ICONS } from "./CategoryBar";
import { calcularDatasOferta } from "@/utils/offerRules";

interface AdminPanelProps {
  categorias: Categoria[];
  ofertas: Oferta[];
}

export function AdminPanel({ categorias, ofertas }: AdminPanelProps) {
  const [tab, setTab] = useState<"ofertas" | "categorias" | "relatorios">("ofertas");

  const [catId, setCatId] = useState("");
  const [fornecedor, setFornecedor] = useState<FornecedorTipo>("mercadolivre");
  const [cta, setCta] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<OfertaStatus>("novo");

  const [novaCatNome, setNovaCatNome] = useState("");
  const [novaCatIcone, setNovaCatIcone] = useState("home");

  const handleAddOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId) return alert("Selecione uma categoria.");

    try {
      const datas = calcularDatasOferta(new Date());

      await criarOferta({
        categoriaId: catId,
        fornecedor,
        cta,
        imagemUrl,
        url,
        expiracaoIso: datas.expiracaoIso,
        status,
      });

      setCta("");
      setImagemUrl("");
      setUrl("");
      alert("Oferta publicada no Supabase!");
    } catch (err: any) {
      alert("Erro ao publicar oferta: " + err.message);
    }
  };

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCatNome.trim()) return;
    try {
      await criarCategoria(novaCatNome.trim(), novaCatIcone);
      setNovaCatNome("");
    } catch (err: any) {
      alert("Erro ao criar categoria: " + err.message);
    }
  };

  const handleExportJson = () => {
    const hojeIso = new Date().toISOString().split("T")[0];
    const payload = {
      exportadoEm: hojeIso,
      categorias,
      ofertas,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${hojeIso}.j4u.json`;
    link.click();
  };

  const metricasPorCategoria = categorias
    .map((c) => {
      const ofertasDaCat = ofertas.filter((o) => o.categoriaId === c.id);
      const totalCliques = ofertasDaCat.reduce((acc, o) => acc + (o.cliques || 0), 0);
      return {
        ...c,
        qtdOfertas: ofertasDaCat.length,
        totalCliques,
      };
    })
    .sort((a, b) => b.totalCliques - a.totalCliques);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Painel Administrativo
          </h1>
          <p className="text-sm text-slate-400">
            Banco PostgreSQL conectado via Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab("ofertas")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === "ofertas"
                ? "bg-orange-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Ofertas ({ofertas.length})
          </button>
          <button
            onClick={() => setTab("categorias")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === "categorias"
                ? "bg-orange-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Categorias ({categorias.length})
          </button>
          <button
            onClick={() => setTab("relatorios")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              tab === "relatorios"
                ? "bg-orange-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Descoberta de Nichos
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold transition border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Backup JSON</span>
          </button>
        </div>
      </div>

      {tab === "ofertas" && (
        <div className="space-y-8">
          <form
            onSubmit={handleAddOferta}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5"
          >
            <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              <span>Nova Oferta de Afiliado</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Fornecedor
                </label>
                <select
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value as FornecedorTipo)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                >
                  <option value="mercadolivre">Mercado Livre</option>
                  <option value="shopee">Shopee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Destaque / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OfertaStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                >
                  <option value="novo">Novo</option>
                  <option value="destaque">Destaque</option>
                  <option value="campeao">Campeão</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Chamada da Oferta (CTA)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 🔥 Air Fryer 5L Digital por R$ 239 no Pix"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-400 mb-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>1º Passo: Link da Imagem do Produto</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-400 mb-1">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>2º Passo: Link de Afiliado (Fornecedor)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://mercadolivre.com/... ou shopee.com.br/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-orange-600/20"
            >
              Publicar Oferta Agora
            </button>
          </form>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="pb-3">Oferta</th>
                  <th className="pb-3">Fornecedor</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Cliques</th>
                  <th className="pb-3">Expira</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {ofertas.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 font-semibold text-white max-w-xs truncate">
                      {o.cta}
                    </td>
                    <td className="py-3.5 uppercase text-xs font-bold text-orange-400">
                      {o.fornecedor}
                    </td>
                    <td className="py-3.5">
                      <select
                        value={o.status}
                        onChange={(e) =>
                          o.id &&
                          atualizarOferta(o.id, {
                            status: e.target.value as OfertaStatus,
                          })
                        }
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="novo">Novo</option>
                        <option value="destaque">Destaque</option>
                        <option value="campeao">Campeão</option>
                        <option value="arquivado">Arquivado</option>
                      </select>
                    </td>
                    <td className="py-3.5 font-bold text-amber-400">{o.cliques}</td>
                    <td className="py-3.5 text-slate-400 text-xs">{o.expiracao}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => o.id && excluirOferta(o.id)}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "categorias" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form
            onSubmit={handleAddCategoria}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 h-fit"
          >
            <h2 className="text-lg font-bold text-orange-400 flex items-center gap-2">
              <FolderPlus className="w-5 h-5" />
              <span>Cadastrar Categoria</span>
            </h2>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Nome da Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Casa, Tecnologia, Ferramentas..."
                value={novaCatNome}
                onChange={(e) => setNovaCatNome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Ícone de Referência
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setNovaCatIcone(key)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                      novaCatIcone === key
                        ? "bg-orange-500 text-slate-950 border-orange-400 font-bold"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {icon}
                    <span className="text-[10px] mt-1">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition"
            >
              Adicionar Categoria
            </button>
          </form>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white mb-2">Categorias Ativas</h2>
            {categorias.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl"
              >
                <div className="flex items-center gap-3 text-white font-semibold">
                  <span className="text-orange-400">
                    {CATEGORY_ICONS[c.icone] || CATEGORY_ICONS.tag}
                  </span>
                  <span>{c.nome}</span>
                </div>
                <button
                  onClick={() => excluirCategoria(c.id)}
                  className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "relatorios" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-orange-400">
            <BarChart3 className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">
              Ranking de Nichos (Cliques por Categoria)
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            Regra de curadoria J4U: mantenha os 3 nichos mais clicados e substitua os de baixo desempenho.
          </p>

          <div className="space-y-4">
            {metricasPorCategoria.map((m, idx) => (
              <div
                key={m.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                      idx < 3
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white flex items-center gap-2">
                      {m.nome}
                      {idx < 3 && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase">
                          Nicho Campeão
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {m.qtdOfertas} ofertas cadastradas
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-amber-400">
                    {m.totalCliques}
                  </span>
                  <span className="block text-xs text-slate-400">cliques</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
