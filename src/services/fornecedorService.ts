import {
  garantirConfiguracaoSupabase,
  supabase,
} from "@/lib/supabaseClient";
import { Fornecedor, NovoFornecedorInput } from "@/types/marketplace";

export async function listarFornecedores(): Promise<Fornecedor[]> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Fornecedor[];
}

export async function criarFornecedor(
  input: NovoFornecedorInput
): Promise<Fornecedor> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("fornecedores")
    .insert({
      nome: input.nome,
      slug: input.slug,
      url_base: input.url_base || null,
      cor_badge: input.cor_badge || "#A5D8FF",
      ativo: input.ativo ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Fornecedor;
}

export async function atualizarFornecedor(
  id: string,
  changes: Partial<NovoFornecedorInput>
): Promise<Fornecedor> {
  garantirConfiguracaoSupabase();
  const { data, error } = await supabase
    .from("fornecedores")
    .update(changes)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Fornecedor;
}

export async function excluirFornecedor(id: string): Promise<void> {
  garantirConfiguracaoSupabase();
  const { error } = await supabase.from("fornecedores").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Não é possível excluir este fornecedor porque existem ofertas vinculadas a ele."
      );
    }
    throw new Error(error.message);
  }
}
