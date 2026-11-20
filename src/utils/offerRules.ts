import { Oferta } from "@/types/marketplace";

/**
 * Calcula a data de expiração (data de cadastro + 6 dias)
 * Retorna tanto no formato brasileiro DD/MM/YYYY quanto ISO YYYY-MM-DD
 */
export function calcularDatasOferta(dataBase: Date = new Date()) {
  const exp = new Date(dataBase);
  exp.setDate(dataBase.getDate() + 6);

  return {
    cadastro: dataBase.toLocaleDateString("pt-BR"),
    expiracao: exp.toLocaleDateString("pt-BR"),
    expiracaoIso: exp.toISOString().split("T")[0],
  };
}

/**
 * Verifica se uma oferta já expirou com base na data ISO atual (YYYY-MM-DD)
 */
export function isOfertaExpirada(expiracaoIso: string, hojeIso?: string): boolean {
  const refHoje = hojeIso || new Date().toISOString().split("T")[0];
  return Boolean(expiracaoIso && expiracaoIso < refHoje);
}

/**
 * Filtra e ordena ofertas para a vitrine pública
 */
export function filtrarOfertasVitrine(ofertas: Oferta[], filtroCategoria: string): Oferta[] {
  const ativas = ofertas.filter((o) => o.status !== "arquivado");

  return [...ativas]
    .filter((o) => {
      if (filtroCategoria === "todos" || filtroCategoria === "mais-clicados") return true;
      return o.categoriaId === filtroCategoria;
    })
    .sort((a, b) => {
      if (filtroCategoria === "mais-clicados") {
        return (b.cliques || 0) - (a.cliques || 0);
      }
      return 0;
    });
}
