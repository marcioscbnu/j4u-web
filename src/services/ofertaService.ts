import {
  extrairColunaAusenteNoSchema,
  garantirConfiguracaoSupabase,
  isErroColunaOuTabelaAusente,
  supabase,
} from "@/lib/supabaseClient";
import { NovaOfertaInput, Oferta } from "@/types/marketplace";

const SELECT_OFERTA_COMPLETO = `
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

const SELECT_OFERTA_LEGADO = `
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

function normalizarOferta(row: Record<string, unknown>): Oferta {
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

async function obterNomeFornecedor(fornecedorId: string): Promise<string> {
  if (!fornecedorId) return "Parceiro";

  const { data } = await supabase
    .from("fornecedores")
    .select("nome")
    .eq("id", fornecedorId)
    .maybeSingle();

  return data && typeof data.nome === "string" && data.nome.trim()
    ? data.nome.trim()
    : "Parceiro";
}

async function obterNomeCategoria(
  categoriaId?: string | null
): Promise<string | null> {
  if (!categoriaId) return null;

  const { data } = await supabase
    .from("categorias")
    .select("nome")
    .eq("id", categoriaId)
    .maybeSingle();

  return data && typeof data.nome === "string" && data.nome.trim()
    ? data.nome.trim()
    : null;
}

export async function listarOfertasAdmin(): Promise<Oferta[]> {
  garantirConfiguracaoSupabase();
  const tentativaCompleta = await supabase
    .from("ofertas")
    .select(SELECT_OFERTA_COMPLETO)
    .order("criado_em", { ascending: false });

  if (!tentativaCompleta.error) {
    return ((tentativaCompleta.data ?? []) as Record<string, unknown>[]).map(
      normalizarOferta
    );
  }

  if (isErroColunaOuTabelaAusente(tentativaCompleta.error)) {
    const fallback = await supabase
      .from("ofertas")
      .select(SELECT_OFERTA_LEGADO)
      .order("criado_em", { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message);
    return ((fallback.data ?? []) as Record<string, unknown>[]).map(
      normalizarOferta
    );
  }

  throw new Error(tentativaCompleta.error.message);
}

export async function criarOferta(input: NovaOfertaInput): Promise<Oferta> {
  garantirConfiguracaoSupabase();
  const [nomeFornecedor, nomeCategoria] = await Promise.all([
    obterNomeFornecedor(input.fornecedor_id),
    obterNomeCategoria(input.categoria_id),
  ]);

  const payloadAdaptativo: Record<string, unknown> = {
    titulo: input.titulo,
    fornecedor_id: input.fornecedor_id,
    fornecedor: nomeFornecedor,
    categoria_id: input.categoria_id || null,
    categoria: nomeCategoria || "Geral",
    preco: input.preco,
    url_afiliado: input.url_afiliado,
    url: input.url_afiliado,
    cta: "Ver oferta",
    imagem_url: input.imagem_url || null,
    imagem: input.imagem_url || "",
    video_arquivo: input.video_arquivo || "video0001.mp4",
    legenda_video: input.legenda_video || input.titulo,
    ativo: input.ativo ?? true,
  };

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const res = await supabase
      .from("ofertas")
      .insert(payloadAdaptativo)
      .select("*")
      .single();

    if (!res.error && res.data) {
      const listaAtualizada = await listarOfertasAdmin();
      const criada = listaAtualizada.find(
        (item) => item.id === String((res.data as Record<string, unknown>).id)
      );
      return (
        criada ?? normalizarOferta(res.data as Record<string, unknown>)
      );
    }

    const colunaInexistente = extrairColunaAusenteNoSchema(res.error);
    if (colunaInexistente && colunaInexistente in payloadAdaptativo) {
      delete payloadAdaptativo[colunaInexistente];
      continue;
    }

    throw new Error(
      res.error?.message || "Não foi possível cadastrar a oferta."
    );
  }

  throw new Error(
    "Não foi possível alinhar as colunas da tabela ofertas ao cadastrar."
  );
}

export async function atualizarOferta(
  id: string,
  changes: Partial<NovaOfertaInput>
): Promise<Oferta> {
  garantirConfiguracaoSupabase();

  const payloadAdaptativo: Record<string, unknown> = { ...changes };

  if (changes.fornecedor_id) {
    payloadAdaptativo.fornecedor = await obterNomeFornecedor(
      changes.fornecedor_id
    );
  }

  if (changes.categoria_id !== undefined) {
    const nomeCategoria = await obterNomeCategoria(changes.categoria_id);
    payloadAdaptativo.categoria = nomeCategoria || "Geral";
  }

  if (changes.url_afiliado) {
    payloadAdaptativo.url = changes.url_afiliado;
  }

  if (changes.imagem_url !== undefined) {
    payloadAdaptativo.imagem = changes.imagem_url || "";
  }

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const res = await supabase
      .from("ofertas")
      .update(payloadAdaptativo)
      .eq("id", id)
      .select("*")
      .single();

    if (!res.error && res.data) {
      const listaAtualizada = await listarOfertasAdmin();
      const atualizada = listaAtualizada.find((item) => item.id === id);
      return (
        atualizada ?? normalizarOferta(res.data as Record<string, unknown>)
      );
    }

    const colunaInexistente = extrairColunaAusenteNoSchema(res.error);
    if (colunaInexistente && colunaInexistente in payloadAdaptativo) {
      delete payloadAdaptativo[colunaInexistente];
      continue;
    }

    throw new Error(
      res.error?.message || "Não foi possível atualizar a oferta."
    );
  }

  throw new Error(
    "Não foi possível alinhar as colunas da tabela ofertas ao atualizar."
  );
}

export async function excluirOferta(id: string): Promise<void> {
  garantirConfiguracaoSupabase();
  const { error } = await supabase.from("ofertas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
