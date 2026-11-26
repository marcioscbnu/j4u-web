export interface Fornecedor {
  id: string;
  nome: string;
  slug: string;
  url_base?: string | null;
  cor_badge: string;
  ativo: boolean;
  criado_em?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone: string;
  ativo: boolean;
  criado_em?: string;
}

export interface Oferta {
  id: string;
  titulo: string;
  fornecedor_id: string;
  categoria_id?: string | null;
  preco: number;
  url_afiliado: string;
  imagem_url?: string | null;
  video_arquivo: string;
  legenda_video?: string | null;
  ativo: boolean;
  criado_em?: string;
  fornecedor?: Pick<
    Fornecedor,
    "id" | "nome" | "slug" | "cor_badge" | "ativo"
  > | null;
  categoria?: Pick<
    Categoria,
    "id" | "nome" | "slug" | "icone" | "ativo"
  > | null;
}

export interface NovoFornecedorInput {
  nome: string;
  slug: string;
  url_base?: string | null;
  cor_badge?: string;
  ativo?: boolean;
}

export interface NovaCategoriaInput {
  nome: string;
  slug: string;
  icone?: string;
  ativo?: boolean;
}

export interface NovaOfertaInput {
  titulo: string;
  fornecedor_id: string;
  categoria_id?: string | null;
  preco: number;
  url_afiliado: string;
  imagem_url?: string | null;
  video_arquivo?: string;
  legenda_video?: string | null;
  ativo?: boolean;
}
