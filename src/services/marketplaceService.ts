import { supabase } from "@/lib/supabase";
import { Categoria, Oferta } from "@/types/marketplace";
import { isOfertaExpirada } from "@/utils/offerRules";

function mapRowToOferta(row: any): Oferta {
  const expirada = isOfertaExpirada(row.expiracao_iso);
  const statusEfetivo =
    expirada && row.status !== "arquivado" ? "arquivado" : row.status;

  return {
    id: row.id,
    categoriaId: row.categoria_id,
    fornecedor: row.fornecedor,
    cta: row.cta,
    imagemUrl: row.imagem_url,
    url: row.url,
    cadastro: row.cadastro,
    expiracao: row.expiracao,
    expiracaoIso: row.expiracao_iso,
    status: statusEfetivo,
    cliques: row.cliques ?? 0,
  };
}

export async function fetchCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias:", error.message);
    return [];
  }
  return (data || []) as Categoria[];
}

export async function fetchOfertas(): Promise<Oferta[]> {
  const { data, error } = await supabase
    .from("ofertas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar ofertas:", error.message);
    return [];
  }
  return (data || []).map(mapRowToOferta);
}

export function subscribeCategorias(callback: (categorias: Categoria[]) => void) {
  fetchCategorias().then(callback);

  const channel = supabase
    .channel("categorias-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categorias" },
      () => {
        fetchCategorias().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeOfertas(callback: (ofertas: Oferta[]) => void) {
  fetchOfertas().then(callback);

  const channel = supabase
    .channel("ofertas-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ofertas" },
      () => {
        fetchOfertas().then(callback);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function criarCategoria(nome: string, icone: string) {
  const { error } = await supabase.from("categorias").insert([{ nome, icone }]);
  if (error) throw new Error(error.message);
}

export async function atualizarCategoria(id: string, nome: string, icone: string) {
  const { error } = await supabase
    .from("categorias")
    .update({ nome, icone })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function criarOferta(oferta: Omit<Oferta, "id" | "cliques">) {
  const { error } = await supabase.from("ofertas").insert([
    {
      categoria_id: oferta.categoriaId,
      fornecedor: oferta.fornecedor,
      cta: oferta.cta,
      imagem_url: oferta.imagemUrl,
      url: oferta.url,
      cadastro: oferta.cadastro,
      expiracao: oferta.expiracao,
      expiracao_iso: oferta.expiracaoIso,
      status: oferta.status,
      cliques: 0,
    },
  ]);
  if (error) throw new Error(error.message);
}

export async function atualizarStatusOferta(id: string, status: Oferta["status"]) {
  const { error } = await supabase
    .from("ofertas")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function excluirOferta(id: string) {
  const { error } = await supabase.from("ofertas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function registrarCliqueOferta(id: string) {
  const { error } = await supabase.rpc("incrementar_clique_oferta", {
    oferta_id: id,
  });
  if (error) {
    console.error("Erro ao incrementar clique:", error.message);
  }
}
