export type FornecedorType = "mercadolivre" | "shopee";
export type StatusOfertaType = "novo" | "destaque" | "campeao" | "arquivado";

export interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

export interface Oferta {
  id?: string;
  categoriaId: string;
  fornecedor: FornecedorType;
  cta: string;
  imagemUrl: string;
  url: string;
  cadastro: string;
  expiracao: string;
  expiracaoIso: string;
  status: StatusOfertaType;
  cliques: number;
}
