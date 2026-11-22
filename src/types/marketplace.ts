export type FornecedorTipo = 'mercadolivre' | 'shopee';
export type OfertaStatus = 'novo' | 'destaque' | 'campeao' | 'arquivado';
export type TemaTela = 'light' | 'system' | 'dark';

export interface Categoria {
  id: string;
  nome: string;
  icone: string;
  createdAt?: string;
}

export interface Oferta {
  id: string;
  categoriaId: string;
  fornecedor: FornecedorTipo;
  cta: string;
  imagemUrl: string;
  url: string;
  videoUrl?: string;
  cadastro: string;
  expiracao: string;
  expiracaoIso: string;
  status: OfertaStatus;
  cliques: number;
  createdAt?: string;
}

export interface NovaOfertaInput {
  categoriaId: string;
  fornecedor: FornecedorTipo;
  cta: string;
  imagemUrl: string;
  url: string;
  videoUrl?: string;
  expiracaoIso: string;
  status: OfertaStatus;
}

export type AtualizarOfertaInput = Partial<NovaOfertaInput>;
