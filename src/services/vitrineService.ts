import { supabase } from "@/lib/supabaseClient";
import { Fornecedor, Oferta } from "@/types/marketplace";

export async function listarFornecedoresVitrine(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Fornecedor[];
}

export async function listarOfertasVitrine(): Promise<Oferta[]> {
  const { data, error } = await supabase
    .from("ofertas")
    .select(`
      id,
      titulo,
      fornecedor_id,
      preco,
      url_afiliado,
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
    `)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Oferta[];
}
