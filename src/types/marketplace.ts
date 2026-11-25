export interface Fornecedor {
  id: string;
  nome: string;
  slug: string;
  url_base?: string | null;
  cor_badge: string;
  ativo: boolean;
  criado_em?: string;
}

export interface Oferta {
  id: string;
  titulo: string;
  fornecedor_id: string;
  preco: number;
  url_afiliado: string;
  video_arquivo: string;
  ativo: boolean;
  criado_em?: string;
  fornecedor?: Pick<Fornecedor, "id" | "nome" | "slug" | "cor_badge" | "ativo"> | null;
}

export interface NovoFornecedorInput {
  nome: string;
  slug: string;
  url_base?: string | null;
  cor_badge?: string;
  ativo?: boolean;
}

export interface NovaOfertaInput {
  titulo: string;
  fornecedor_id: string;
  preco: number;
  url_afiliado: string;
  video_arquivo?: string;
  ativo?: boolean;
}
