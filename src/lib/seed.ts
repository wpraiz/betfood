// Restaurantes parceiros fictícios de Natal/RN para a POC.
import type { Restaurant } from "./types";

const basePrizes = (big: string, medium: string, small: string) => [
  { id: "p-big", label: big, weight: 5, tier: "big" as const },
  { id: "p-med", label: medium, weight: 15, tier: "medium" as const },
  { id: "p-small", label: small, weight: 40, tier: "small" as const },
  { id: "p-none", label: "Não foi dessa vez", weight: 40, tier: "none" as const },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: "camaroes-potiguar",
    name: "Camarões do Potengi",
    emoji: "🦐",
    cuisine: "Frutos do mar",
    neighborhood: "Ponta Negra",
    description: "Casa de camarão à beira-mar, clássico das noites de Ponta Negra.",
    accent: "#0ea5e9",
    prizes: basePrizes(
      "Camarão empanado grátis pra mesa",
      "Sobremesa grátis",
      "10% de desconto na conta"
    ),
  },
  {
    id: "tapiocaria-sol",
    name: "Tapiocaria Sol Potiguar",
    emoji: "🫓",
    cuisine: "Regional",
    neighborhood: "Petrópolis",
    description: "Tapiocas e cafés regionais com receita de avó potiguar.",
    accent: "#f59e0b",
    prizes: basePrizes(
      "Combo tapioca + suco grátis",
      "Café especial por nossa conta",
      "Tapioca doce em dobro"
    ),
  },
  {
    id: "churrasco-dunas",
    name: "Churrascaria Dunas",
    emoji: "🥩",
    cuisine: "Churrasco",
    neighborhood: "Lagoa Nova",
    description: "Rodízio completo com cortes nobres e buffet regional.",
    accent: "#dc2626",
    prizes: basePrizes(
      "1 rodízio grátis na próxima visita",
      "Picanha extra pra mesa",
      "Refrigerante em dobro"
    ),
  },
  {
    id: "pizzaria-forte",
    name: "Pizzaria do Forte",
    emoji: "🍕",
    cuisine: "Pizzaria",
    neighborhood: "Praia do Forte",
    description: "Pizza napolitana com vista pro Forte dos Reis Magos.",
    accent: "#16a34a",
    prizes: basePrizes(
      "Pizza broto grátis",
      "Borda recheada por nossa conta",
      "15% de desconto em qualquer pizza"
    ),
  },
];
