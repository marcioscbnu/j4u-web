import {
  extrairColunaAusenteNoSchema,
  garantirConfiguracaoSupabase,
  isErroColunaOuTabelaAusente,
  supabase,
} from "@/lib/supabaseClient";
import { Categoria, NovaCategoriaInput } from "@/types/marketplace";

export async function listarCategorias(): Promise<Categoria[]> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    if (isErroColunaOuTabelaAusente(error)) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []) as Categoria[];
}

export async function criarCategoria(
  input: NovaCategoriaInput
): Promise<Categoria> {
  garantirConfiguracaoSupabase();
  const payload: Record<string, unknown> = {
    nome: input.nome,
    slug: input.slug,
    icone: input.icone || "🏷️",
    ativo: input.ativo ?? true,
  };

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase
      .from("categorias")
      .insert(payload)
      .select("*")
      .single();

    if (!error) return data as Categoria;

    const colunaInexistente = extrairColunaAusenteNoSchema(error);
    if (colunaInexistente && colunaInexistente in payload) {
      delete payload[colunaInexistente];
      continue;
    }

    throw new Error(error.message);
  }

  throw new Error("Não foi possível cadastrar a categoria no banco.");
}

export async function atualizarCategoria(
  id: string,
  changes: Partial<NovaCategoriaInput>
): Promise<Categoria> {
  garantirConfiguracaoSupabase();
  const payload: Record<string, unknown> = { ...changes };

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const { data, error } = await supabase
      .from("categorias")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (!error) return data as Categoria;

    const colunaInexistente = extrairColunaAusenteNoSchema(error);
    if (colunaInexistente && colunaInexistente in payload) {
      delete payload[colunaInexistente];
      continue;
    }

    throw new Error(error.message);
  }

  throw new Error("Não foi possível atualizar a categoria.");
}

export async function excluirCategoria(id: string): Promise<void> {
  garantirConfiguracaoSupabase();
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw new Error(error.message);
}