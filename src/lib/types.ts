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
  expiresAt?: string; // ISO — cupom vale 24h a partir do ganho
  redeemedAt: string | null;
  demo?: true; // veio da semente de demonstração
}

export interface TableCode {
  code: string;
  restaurantId: string;
  credits: number; // jogadas extras que o código libera
  createdAt: string;
  usedAt: string | null;
  demo?: true; // veio da semente de demonstração
}

export interface GameResult {
  won: boolean;
  prize?: Prize;
}

export interface GameProps {
  restaurant: Restaurant;
  /** Sorteia um prêmio na tabela do restaurante (pode vir tier "none"). */
  drawPrize: () => Prize;
  /**
   * Cobra a jogada (CHIP_COST fichas) e libera a rodada.
   *
   * Chame no gesto que REALMENTE inicia a partida — girar a roleta, a primeira
   * raspada, o "Valendo" do quiz, a primeira carta da memória. **Nunca na
   * montagem**: abrir o jogo pra ver como é e voltar não pode custar ficha.
   *
   * Retorna `false` quando não há saldo — nesse caso NÃO inicie a rodada; o
   * GamePlay já troca sozinho pra tela de "fichas acabaram".
   *
   * É idempotente por rodada: chamadas repetidas cobram uma única vez e
   * devolvem `true`. Ainda assim, chame só uma vez por rodada.
   */
  startPlay: () => boolean;
  /** Chame exatamente uma vez quando o jogo terminar. */
  onFinish: (result: GameResult) => void;
}

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  /**
   * O componente do jogo. Vem de `React.lazy()` (chunk próprio por jogo, ver
   * `src/games/index.ts`), por isso o tipo aceita as duas formas — quem renderiza
   * precisa envolver em `<Suspense>`.
   */
  component:
    | React.ComponentType<GameProps>
    | React.LazyExoticComponent<React.ComponentType<GameProps>>;
}
