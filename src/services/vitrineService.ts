import {
  garantirConfiguracaoSupabase,
  isErroColunaOuTabelaAusente,
  supabase,
} from "@/lib/supabaseClient";
import { Categoria, Fornecedor, Oferta } from "@/types/marketplace";

const SELECT_VITRINE_COMPLETO = `
  id,
  titulo,
  fornecedor_id,
  categoria_id,
  preco,
  url_afiliado,
  imagem_url,
  video_arquivo,
  legenda_video,
  ativo,
  criado_em,
  fornecedor:fornecedores (
    id,
    nome,
    slug,
    cor_badge,
    ativo
  ),
  categoria:categorias (
    id,
    nome,
    slug,
    icone,
    ativo
  )
`;

const SELECT_VITRINE_LEGADO = `
  id,
  titulo,
  fornecedor_id,
  preco,
  url_afiliado,
  imagem_url,
  video_arquivo,
  ativo,
  criado_em,
  fornecedor:fornecedores (
    id,
    nome,
    slug,
    cor_badge,
    ativo
  )
`;

function mapearOfertaVitrine(row: Record<string, unknown>): Oferta {
  const rawFornecedor = row.fornecedor;
  const fornecedorNormalizado = Array.isArray(rawFornecedor)
    ? (rawFornecedor[0] ?? null)
    : (rawFornecedor ?? null);

  const rawCategoria = row.categoria;
  const categoriaNormalizada = Array.isArray(rawCategoria)
    ? (rawCategoria[0] ?? null)
    : (rawCategoria ?? null);

  const titulo = String(row.titulo ?? "");
  const legendaBruta =
    row.legenda_video !== undefined && row.legenda_video !== null
      ? String(row.legenda_video)
      : null;

  const urlResolvida = String(row.url_afiliado ?? row.url ?? "");
  const imagemResolvida =
    row.imagem_url !== undefined && row.imagem_url !== null
      ? String(row.imagem_url)
      : row.imagem !== undefined && row.imagem !== null
      ? String(row.imagem)
      : null;

  return {
    id: String(row.id ?? ""),
    titulo,
    fornecedor_id: String(row.fornecedor_id ?? ""),
    categoria_id: row.categoria_id ? String(row.categoria_id) : null,
    preco: Number(row.preco ?? 0),
    url_afiliado: urlResolvida,
    imagem_url: imagemResolvida,
    video_arquivo: String(row.video_arquivo || "video0001.mp4"),
    legenda_video: legendaBruta && legendaBruta.trim() ? legendaBruta : titulo,
    ativo: Boolean(row.ativo),
    criado_em: row.criado_em ? String(row.criado_em) : undefined,
    fornecedor: fornecedorNormalizado as Oferta["fornecedor"],
    categoria: categoriaNormalizada as Oferta["categoria"],
  };
}

export async function listarFornecedoresVitrine(): Promise<Fornecedor[]> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Fornecedor[];
}

export async function listarCategoriasVitrine(): Promise<Categoria[]> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    if (isErroColunaOuTabelaAusente(error, "categorias")) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []) as Categoria[];
}

export async function listarOfertasVitrine(): Promise<Oferta[]> {
  garantirConfiguracaoSupabase();
  const tentativaCompleta = await supabase
    .from("ofertas")
    .select(SELECT_VITRINE_COMPLETO)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (!tentativaCompleta.error) {
    return ((tentativaCompleta.data ?? []) as Record<string, unknown>[]).map(
      mapearOfertaVitrine
    );
  }

  if (isErroColunaOuTabelaAusente(tentativaCompleta.error)) {
    const fallback = await supabase
      .from("ofertas")
      .select(SELECT_VITRINE_LEGADO)
      .eq("ativo", true)
      .order("criado_em", { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message);
    return ((fallback.data ?? []) as Record<string, unknown>[]).map(
      mapearOfertaVitrine
    );
  }

  throw new Error(tentativaCompleta.error.message);
}
