import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfferCard } from "@/components/OfferCard";
import { Oferta } from "@/types/marketplace";

describe("Componente OfferCard", () => {
  const ofertaMock: Oferta = {
    id: "of-101",
    categoriaId: "cat-1",
    fornecedor: "mercadolivre",
    cta: "Furadeira Bosch 650W",
    imagemUrl: "https://exemplo.com/furadeira.jpg",
    url: "https://mercadolivre.com.br/furadeira",
    cadastro: "18/11/2026",
    expiracao: "24/11/2026",
    expiracaoIso: "2026-11-24",
    status: "campeao",
    cliques: 88,
  };

  it("deve renderizar título, fornecedor, categoria, validade e cliques", () => {
    const onClickMock = vi.fn();
    render(
      <OfferCard
        oferta={ofertaMock}
        categoriaNome="Ferramentas"
        onClickOferta={onClickMock}
      />
    );

    expect(screen.getByText("Furadeira Bosch 650W")).toBeInTheDocument();
    expect(screen.getByText("Mercado Livre")).toBeInTheDocument();
    expect(screen.getByText("Ferramentas")).toBeInTheDocument();
    expect(screen.getByText(/24\/11\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/88 interessados/)).toBeInTheDocument();

    const botao = screen.getByRole("button", { name: /VER OFERTA/i });
    fireEvent.click(botao);
    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(onClickMock).toHaveBeenCalledWith(ofertaMock);
  });
});
