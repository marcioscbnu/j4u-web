import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Categoria,
  Oferta,
  NovaOfertaInput,
  AtualizarOfertaInput,
  FornecedorTipo,
  OfertaStatus,
} from '@/types/marketplace';

interface OfertaRow {
  id: string;
  categoria_id: string;
  fornecedor: FornecedorTipo;
  cta: string;
  imagem_url: string;
  url: string;
  video_url?: string | null;
  cadastro: string;
  expiracao: string;
  expiracao_iso: string;
  status: OfertaStatus;
  cliques: number;
  created_at?: string;
}

function formatDateBr(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function mapOfertaFromRow(row: OfertaRow): Oferta {
  return {
    id: row.id,
    categoriaId: row.categoria_id,
    fornecedor: row.fornecedor,
    cta: row.cta,
    imagemUrl: row.imagem_url,
    url: row.url,
    videoUrl: row.video_url || '',
    cadastro: row.cadastro,
    expiracao: row.expiracao,
    expiracaoIso: row.expiracao_iso,
    status: row.status,
    cliques: row.cliques ?? 0,
    createdAt: row.created_at,
  };
}

export async function listarCategorias(): Promise<Categoria[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    icone: row.icone || 'tag',
    createdAt: row.created_at,
  }));
}

export async function criarCategoria(nome: string, icone = 'tag'): Promise<Categoria> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { data, error } = await supabase
    .from('categorias')
    .insert([{ nome: nome.trim(), icone }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    nome: data.nome,
    icone: data.icone,
    createdAt: data.created_at,
  };
}

export async function excluirCategoria(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listarOfertas(): Promise<Oferta[]> {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from('ofertas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data as OfertaRow[]) ?? []).map(mapOfertaFromRow);
}

export async function criarOferta(input: NovaOfertaInput): Promise<Oferta> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const hojeIso = new Date().toISOString().split('T')[0];

  const payload = {
    categoria_id: input.categoriaId,
    fornecedor: input.fornecedor,
    cta: input.cta.trim(),
    imagem_url: input.imagemUrl.trim(),
    url: input.url.trim(),
    video_url: input.videoUrl?.trim() || '',
    cadastro: formatDateBr(hojeIso),
    expiracao: formatDateBr(input.expiracaoIso),
    expiracao_iso: input.expiracaoIso,
    status: input.status,
    cliques: 0,
  };

  const { data, error } = await supabase
    .from('ofertas')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapOfertaFromRow(data as OfertaRow);
}

export async function atualizarOferta(id: string, input: AtualizarOfertaInput): Promise<Oferta> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const payload: Record<string, unknown> = {};
  if (input.categoriaId !== undefined) payload.categoria_id = input.categoriaId;
  if (input.fornecedor !== undefined) payload.fornecedor = input.fornecedor;
  if (input.cta !== undefined) payload.cta = input.cta.trim();
  if (input.imagemUrl !== undefined) payload.imagem_url = input.imagemUrl.trim();
  if (input.url !== undefined) payload.url = input.url.trim();
  if (input.videoUrl !== undefined) payload.video_url = input.videoUrl.trim();
  if (input.status !== undefined) payload.status = input.status;
  if (input.expiracaoIso !== undefined) {
    payload.expiracao_iso = input.expiracaoIso;
    payload.expiracao = formatDateBr(input.expiracaoIso);
  }

  const { data, error } = await supabase
    .from('ofertas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapOfertaFromRow(data as OfertaRow);
}

export async function excluirOferta(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('ofertas').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function registrarCliqueOferta(ofertaId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('incrementar_clique_oferta', {
    oferta_id: ofertaId,
  });
  if (error) {
    console.error('Erro ao registrar clique:', error.message);
  }
}

export function subscribeCategorias(
  onChange: (categorias: Categoria[]) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const syncCategorias = async () => {
    try {
      const lista = await listarCategorias();
      onChange(lista);
    } catch (err) {
      console.error('Erro ao sincronizar categorias:', err);
    }
  };

  void syncCategorias();

  const channel = supabase
    .channel('j4u-categorias-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categorias' },
      () => {
        void syncCategorias();
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      void supabase.removeChannel(channel);
    }
  };
}

export function subscribeOfertas(
  onChange: (ofertas: Oferta[]) => void
): () => void {
  if (!isSupabaseConfigured() || !supabase) return () => {};

  const syncOfertas = async () => {
    try {
      const lista = await listarOfertas();
      onChange(lista);
    } catch (err) {
      console.error('Erro ao sincronizar ofertas:', err);
    }
  };

  void syncOfertas();

  const channel = supabase
    .channel('j4u-ofertas-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ofertas' },
      () => {
        void syncOfertas();
      }
    )
    .subscribe();

  return () => {
    if (supabase) {
      void supabase.removeChannel(channel);
    }
  };
}

export const getCategorias = listarCategorias;
export const getOfertas = listarOfertas;
export const registrarClique = registrarCliqueOferta;
