export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  neighborhood: string; // bairro de Natal/RN
  description: string;
  accent: string; // cor tailwind-friendly em hex
  photo: string; // foto do prato-assinatura (URL)
  rating: number; // ex.: 4.8
  prizes: Prize[];
}

export interface Prize {
  id: string;
  label: string; // ex.: "10% de desconto na conta"
  weight: number; // peso relativo no sorteio
  tier: "small" | "medium" | "big" | "none"; // none = "não foi dessa vez"
}

export interface Coupon {
  id: string;
  restaurantId: string;
  gameId: string;
  prizeLabel: string;
  code: string; // código curto pra mostrar ao garçom
  wonAt: string; // ISO
  redeemedAt: string | null;
}

export interface TableCode {
  code: string;
  restaurantId: string;
  credits: number; // jogadas extras que o código libera
  createdAt: string;
  usedAt: string | null;
}

export interface GameResult {
  won: boolean;
  prize?: Prize;
}

export interface GameProps {
  restaurant: Restaurant;
  /** Sorteia um prêmio na tabela do restaurante (pode vir tier "none"). */
  drawPrize: () => Prize;
  /** Chame exatamente uma vez quando o jogo terminar. */
  onFinish: (result: GameResult) => void;
}

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  component: React.ComponentType<GameProps>;
}
