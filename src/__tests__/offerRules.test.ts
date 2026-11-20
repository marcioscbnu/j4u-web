import { describe, it, expect } from "vitest";
import {
  calcularDatasOferta,
  isOfertaExpirada,
  filtrarOfertasVitrine,
} from "@/utils/offerRules";
import { Oferta } from "@/types/marketplace";

describe("Regras de Negócio - J4U Marketplace", () => {
  it("deve calcular corretamente a expiração de 6 dias após o cadastro", () => {
    const dataTeste = new Date("2026-11-18T12:00:00Z");
    const resultado = calcularDatasOferta(dataTeste);

    expect(resultado.expiracaoIso).toBe("2026-11-24");
  });

  it("deve identificar oferta expirada quando a data atual for maior que expiracaoIso", () => {
    expect(isOfertaExpirada("2026-11-10", "2026-11-18")).toBe(true);
    expect(isOfertaExpirada("2026-11-24", "2026-11-18")).toBe(false);
    expect(isOfertaExpirada("2026-11-18", "2026-11-18")).toBe(false);
  });

  it("deve ocultar ofertas arquivadas e ordenar por mais clicados quando selecionado", () => {
    const mockOfertas: Oferta[] = [
      {
        id: "1",
        categoriaId: "casa",
        fornecedor: "mercadolivre",
        cta: "Air Fryer 5L",
        imagemUrl: "https://exemplo.com/1.jpg",
        url: "https://ml.com/1",
        cadastro: "18/11/2026",
        expiracao: "24/11/2026",
        expiracaoIso: "2026-11-24",
        status: "novo",
        cliques: 45,
      },
      {
        id: "2",
        categoriaId: "tech",
        fornecedor: "shopee",
        cta: "Fone Bluetooth",
        imagemUrl: "https://exemplo.com/2.jpg",
        url: "https://shopee.com/2",
        cadastro: "18/11/2026",
        expiracao: "24/11/2026",
        expiracaoIso: "2026-11-24",
        status: "destaque",
        cliques: 120,
      },
      {
        id: "3",
        categoriaId: "casa",
        fornecedor: "shopee",
        cta: "Item Expirado",
        imagemUrl: "https://exemplo.com/3.jpg",
        url: "https://shopee.com/3",
        cadastro: "01/11/2026",
        expiracao: "07/11/2026",
        expiracaoIso: "2026-11-07",
        status: "arquivado",
        cliques: 300,
      },
    ];

    const maisClicados = filtrarOfertasVitrine(mockOfertas, "mais-clicados");
    expect(maisClicados).toHaveLength(2);
    expect(maisClicados[0].id).toBe("2");
    expect(maisClicados[1].id).toBe("1");

    const apenasCasa = filtrarOfertasVitrine(mockOfertas, "casa");
    expect(apenasCasa).toHaveLength(1);
    expect(apenasCasa[0].cta).toBe("Air Fryer 5L");
  });
});
