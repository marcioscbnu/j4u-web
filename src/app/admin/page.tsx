'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Save,
  X,
  LogOut,
  ArrowLeft,
  Download,
  Tag,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { ehNomeVideoValido, normalizarNomeVideo } from '@/lib/videoHelper';
import {
  Categoria,
  Oferta,
  FornecedorTipo,
  OfertaStatus,
} from '@/types/marketplace';
import {
  listarCategorias,
  criarCategoria,
  excluirCategoria,
  listarOfertas,
  criarOferta,
  atualizarOferta,
  excluirOferta,
} from '@/services/marketplaceService';

function getDefaultExpirationIso(days = 6): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, signIn, signOut } = useAuth();
  const { temaResolvido } = useTheme();
  const isDark = temaResolvido === 'dark';

  const [email, setEmail] = useState('j4umarketplace@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [novaCategoria, setNovaCategoria] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState('');
  const [fornecedor, setFornecedor] = useState<FornecedorTipo>('mercadolivre');
  const [cta, setCta] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [url, setUrl] = useState('');
  const [videoNome, setVideoNome] = useState('');
  const [expiracaoIso, setExpiracaoIso] = useState(getDefaultExpirationIso(6));
  const [status, setStatus] = useState<OfertaStatus>('novo');
  const [saving, setSaving] = useState(false);

  const preencherFormularioParaEdicao = (oferta: Oferta) => {
    setEditingId(oferta.id);
    setCategoriaId(oferta.categoriaId);
    setFornecedor(oferta.fornecedor);
    setCta(oferta.cta);
    setImagemUrl(oferta.imagemUrl);
    setUrl(oferta.url);
    setVideoNome(normalizarNomeVideo(oferta.videoUrl || ''));
    setExpiracaoIso(oferta.expiracaoIso || getDefaultExpirationIso(6));
    setStatus(oferta.status);
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const carregarTudo = async (autoEditId?: string | null) => {
    try {
      setLoadingData(true);
      const [cats, ofs] = await Promise.all([listarCategorias(), listarOfertas()]);
      setCategorias(cats);
      setOfertas(ofs);

      if (cats.length > 0 && !categoriaId) {
        setCategoriaId(cats[0].id);
      }

      if (autoEditId) {
        const alvo = ofs.find((item) => item.id === autoEditId);
        if (alvo) {
          preencherFormularioParaEdicao(alvo);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setFeedback({ type: 'err', msg });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const params = new URLSearchParams(window.location.search);
      const editParam = params.get('edit');
      void carregarTudo(editParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const resetForm = () => {
    setEditingId(null);
    setFornecedor('mercadolivre');
    setCta('');
    setImagemUrl('');
    setUrl('');
    setVideoNome('');
    setExpiracaoIso(getDefaultExpirationIso(6));
    setStatus('novo');
    if (categorias.length > 0) setCategoriaId(categorias[0].id);
    if (typeof window !== 'undefined' && window.location.search.includes('edit=')) {
      window.history.replaceState({}, '', '/admin');
    }
  };

  const handleSaveOferta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaId || !cta.trim() || !imagemUrl.trim() || !url.trim()) {
      setFeedback({
        type: 'err',
        msg: 'Preencha categoria, chamada (CTA), URL da imagem e link da oferta.',
      });
      return;
    }

    const nomePadronizado = normalizarNomeVideo(videoNome).toLowerCase();
    if (nomePadronizado && !ehNomeVideoValido(nomePadronizado)) {
      setFeedback({
        type: 'err',
        msg: 'Informe o nome do arquivo no padrão video0001.mp4 (prefixo "video" + 4 dígitos + ".mp4").',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      if (editingId) {
        await atualizarOferta(editingId, {
          categoriaId,
          fornecedor,
          cta,
          imagemUrl,
          url,
          videoUrl: nomePadronizado,
          expiracaoIso,
          status,
        });
        setFeedback({ type: 'ok', msg: 'Oferta atualizada com sucesso!' });
      } else {
        await criarOferta({
          categoriaId,
          fornecedor,
          cta,
          imagemUrl,
          url,
          videoUrl: nomePadronizado,
          expiracaoIso,
          status,
        });
        setFeedback({ type: 'ok', msg: 'Nova oferta publicada com sucesso!' });
      }

      resetForm();
      await carregarTudo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar oferta';
      setFeedback({ type: 'err', msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOferta = async (id: string, titulo: string) => {
    if (!window.confirm(`Deseja realmente excluir a oferta "${titulo}"?`)) return;
    try {
      await excluirOferta(id);
      if (editingId === id) resetForm();
      setFeedback({ type: 'ok', msg: 'Oferta excluída.' });
      await carregarTudo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir oferta';
      setFeedback({ type: 'err', msg });
    }
  };

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    try {
      await criarCategoria(novaCategoria.trim());
      setNovaCategoria('');
      setFeedback({ type: 'ok', msg: 'Categoria adicionada!' });
      await carregarTudo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar categoria';
      setFeedback({ type: 'err', msg });
    }
  };

  const handleDeleteCategoria = async (id: string, nome: string) => {
    if (
      !window.confirm(
        `Excluir a categoria "${nome}" e todas as ofertas vinculadas a ela?`
      )
    )
      return;
    try {
      await excluirCategoria(id);
      setFeedback({ type: 'ok', msg: 'Categoria removida.' });
      await carregarTudo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover categoria';
      setFeedback({ type: 'err', msg });
    }
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify({ categorias, ofertas }, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-j4u-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoggingIn(false);
    }
  };

  const surfaceClass = isDark
    ? 'bg-[#091c3d] border-sky-400/25 text-white'
    : 'bg-white border-blue-200 text-slate-900 shadow-sm';

  const inputClass = isDark
    ? 'w-full rounded-xl border border-sky-400/30 bg-black px-3.5 py-2.5 text-sm text-white'
    : 'w-full rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-2.5 text-sm text-slate-900';

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-bold ${
          isDark ? 'bg-black text-sky-200' : 'bg-[#eef4ff] text-slate-800'
        }`}
      >
        Verificando sessão...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? 'bg-black text-white' : 'bg-[#eef4ff] text-slate-900'
        }`}
      >
        <div className="w-full max-w-md rounded-3xl p-[2px] bg-gradient-to-br from-amber-400 via-pink-500 to-cyan-400 shadow-2xl">
          <form
            onSubmit={handleLogin}
            className={`rounded-[22px] p-7 space-y-4 ${
              isDark ? 'bg-[#091c3d]' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                Painel Admin • J4U
              </h1>
              <ThemeSwitcher />
            </div>

            {loginError && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/50 p-3 text-xs text-rose-200">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:brightness-110 text-slate-950 font-black py-3 text-sm transition-all cursor-pointer"
            >
              {loggingIn ? 'Entrando...' : 'Acessar Painel'}
            </button>

            <Link
              href="/"
              className="block text-center text-xs text-sky-400 hover:underline pt-2"
            >
              ← Voltar para a vitrine
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-black text-white' : 'bg-[#eef4ff] text-slate-900'
      }`}
    >
      <header
        className={`border-b backdrop-blur-xl sticky top-0 z-20 ${
          isDark
            ? 'border-sky-400/20 bg-[#081938]/90'
            : 'border-blue-200 bg-white/90'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3.5 py-2 text-xs font-black text-white shadow hover:brightness-110"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Vitrine
            </Link>
            <h1 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Administração • J4U Marketplace
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ThemeSwitcher />
            <button
              type="button"
              onClick={handleExportBackup}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
                isDark
                  ? 'border-sky-400/30 bg-[#0c2249] text-sky-100 hover:bg-[#123166]'
                  : 'border-blue-200 bg-blue-50 text-slate-800 hover:bg-blue-100'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Backup
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 px-3 py-2 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {feedback && (
          <div
            className={`rounded-2xl border p-4 text-sm font-bold ${
              feedback.type === 'ok'
                ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                : 'border-rose-400/50 bg-rose-500/15 text-rose-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <section className={`rounded-3xl border p-5 sm:p-6 ${surfaceClass}`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5 text-amber-400" />
                  Editando Oferta Selecionada
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-cyan-400" />
                  Cadastrar Nova Oferta
                </>
              )}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 rounded-xl bg-slate-700 hover:bg-slate-600 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <X className="w-4 h-4" /> Cancelar Edição
              </button>
            )}
          </div>

          <form
            onSubmit={handleSaveOferta}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-bold mb-1">Categoria *</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className={inputClass}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Fornecedor *
                </label>
                <select
                  value={fornecedor}
                  onChange={(e) =>
                    setFornecedor(e.target.value as FornecedorTipo)
                  }
                  className={inputClass}
                >
                  <option value="mercadolivre">Mercado Livre</option>
                  <option value="shopee">Shopee</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Selo / Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OfertaStatus)}
                  className={inputClass}
                >
                  <option value="novo">Novo</option>
                  <option value="destaque">Destaque</option>
                  <option value="campeao">Campeão</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">
                Texto / Chamada da Oferta (CTA) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex.: Descascador Elétrico Automático de Alho — R$ 59,90"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                URL da Imagem do Produto *
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Link de Afiliado da Oferta *
              </label>
              <input
                type="url"
                required
                placeholder="https://mercadolivre.com/sec/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-pink-400" />
                Nome do Vídeo na pasta &quot;public/video&quot; (ex.: video0001.mp4)
              </label>
              <input
                type="text"
                placeholder="video0001.mp4"
                value={videoNome}
                onChange={(e) => setVideoNome(e.target.value)}
                className={inputClass}
              />
              <p className="text-[11px] opacity-75 mt-1">
                Formato obrigatório: <span className="font-bold">video</span> + 4 dígitos com zeros à esquerda + <span className="font-bold">.mp4</span> (lido diretamente de /video/video0001.mp4).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Data de Expiração *
              </label>
              <input
                type="date"
                required
                value={expiracaoIso}
                onChange={(e) => setExpiracaoIso(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-500/40 px-5 py-2.5 text-sm font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black transition-all cursor-pointer shadow-lg ${
                  editingId
                    ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving
                  ? 'Salvando...'
                  : editingId
                  ? 'Salvar Alterações'
                  : 'Publicar Oferta'}
              </button>
            </div>
          </form>
        </section>

        <section className={`rounded-3xl border p-5 sm:p-6 ${surfaceClass}`}>
          <h2 className="text-lg font-black mb-4">
            Ofertas Cadastradas ({ofertas.length})
          </h2>

          {loadingData ? (
            <p className="text-sm opacity-75">Carregando ofertas...</p>
          ) : ofertas.length === 0 ? (
            <p className="text-sm opacity-75">Nenhuma oferta cadastrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-400/20 text-xs uppercase opacity-75">
                    <th className="py-3 px-2">Produto</th>
                    <th className="py-3 px-2">Loja / Status</th>
                    <th className="py-3 px-2">Vídeo</th>
                    <th className="py-3 px-2">Expira</th>
                    <th className="py-3 px-2">Cliques</th>
                    <th className="py-3 px-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-400/10">
                  {ofertas.map((of) => (
                    <tr
                      key={of.id}
                      className={editingId === of.id ? 'bg-amber-400/15' : ''}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={of.imagemUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl bg-white object-contain p-1 shrink-0"
                          />
                          <div className="max-w-xs">
                            <div className="font-bold line-clamp-2">{of.cta}</div>
                            <a
                              href={of.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline mt-0.5"
                            >
                              Abrir link <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="block text-xs font-extrabold text-amber-400">
                          {of.fornecedor === 'mercadolivre'
                            ? 'Mercado Livre'
                            : 'Shopee'}
                        </span>
                        <span className="text-[11px] uppercase opacity-75">
                          {of.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {of.videoUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-pink-500/20 border border-pink-500/40 px-2.5 py-1 text-xs font-bold text-pink-300">
                            <Video className="w-3.5 h-3.5" /> {of.videoUrl}
                          </span>
                        ) : (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-xs">{of.expiracao}</td>
                      <td className="py-3 px-2 font-black text-cyan-400">
                        {of.cliques}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => preencherFormularioParaEdicao(of)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-400 hover:bg-amber-300 px-3 py-1.5 text-xs font-black text-slate-950 shadow cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOferta(of.id, of.cta)}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-600/25 border border-rose-500/50 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-600/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={`rounded-3xl border p-5 sm:p-6 ${surfaceClass}`}>
          <h2 className="text-lg font-black flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-pink-400" /> Categorias
          </h2>

          <form onSubmit={handleAddCategoria} className="flex gap-2 max-w-md mb-4">
            <input
              type="text"
              placeholder="Nova categoria..."
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:brightness-110 text-slate-950 font-black px-4 py-2 text-sm cursor-pointer"
            >
              Adicionar
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold ${
                  isDark
                    ? 'border-sky-400/30 bg-black'
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <span>{c.nome}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategoria(c.id, c.nome)}
                  className="opacity-70 hover:text-rose-400 cursor-pointer"
                  title="Excluir categoria"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
