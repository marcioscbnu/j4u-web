import { supabase } from "@/lib/supabaseClient";
import { NovaOfertaInput, Oferta } from "@/types/marketplace";

const SELECT_OFERTA_COM_FORNECEDOR = `
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
`;

export async function listarOfertasAdmin(): Promise<Oferta[]> {
  const { data, error } = await supabase
    .from("ofertas")
    .select(SELECT_OFERTA_COM_FORNECEDOR)
    .order("criado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Oferta[];
}

export async function criarOferta(input: NovaOfertaInput): Promise<Oferta> {
  const { data, error } = await supabase
    .from("ofertas")
    .insert({
      titulo: input.titulo,
      fornecedor_id: input.fornecedor_id,
      preco: input.preco,
      url_afiliado: input.url_afiliado,
      video_arquivo: input.video_arquivo || "video0001.mp4",
      ativo: input.ativo ?? true,
    })
    .select(SELECT_OFERTA_COM_FORNECEDOR)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Oferta;
}

export async function atualizarOferta(
  id: string,
  changes: Partial<NovaOfertaInput>
): Promise<Oferta> {
  const { data, error } = await supabase
    .from("ofertas")
    .update(changes)
    .eq("id", id)
    .select(SELECT_OFERTA_COM_FORNECEDOR)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Oferta;
}

export async function excluirOferta(id: string): Promise<void> {
  const { error } = await supabase.from("ofertas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
