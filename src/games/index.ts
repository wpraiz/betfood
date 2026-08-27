import { lazy } from "react";
import type { ComponentType } from "react";
import type { GameDefinition, GameProps } from "../lib/types";

type GameModule = { default: ComponentType<GameProps> };

/**
 * Um loader por jogo. O `import()` dinâmico é o que faz o Vite emitir um chunk
 * separado por mini-game — nenhum jogo entra no bundle inicial (a Home e a
 * RestaurantPage listam os quatro sem baixar nenhum).
 *
 * Novo jogo: crie `src/games/<id>/index.tsx` com `export default` do componente,
 * acrescente o loader aqui e a entrada em GAMES com os metadados estáticos.
 */
const loaders: Record<string, () => Promise<GameModule>> = {
  roleta: () => import("./roleta"),
  raspadinha: () => import("./raspadinha"),
  quiz: () => import("./quiz"),
  memoria: () => import("./memoria"),
};

/**
 * Metadados ESTÁTICOS (id/name/tagline) + componente sob demanda.
 * As listagens leem só os metadados; o código do jogo chega no `<Suspense>`
 * do GamePlay.
 */
export const GAMES: GameDefinition[] = [
  {
    id: "roleta",
    name: "Roleta de Prêmios",
    tagline: "Gire e ganhe na hora",
    component: lazy(loaders.roleta),
  },
  {
    id: "raspadinha",
    name: "Raspadinha",
    tagline: "Raspe e descubra seu prêmio",
    component: lazy(loaders.raspadinha),
  },
  {
    id: "quiz",
    name: "Quiz Gastronômico",
    tagline: "Acerte e leve o prêmio",
    component: lazy(loaders.quiz),
  },
  {
    id: "memoria",
    name: "Jogo da Memória",
    tagline: "Encontre os pares do cardápio",
    component: lazy(loaders.memoria),
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}

/**
 * Aquece o chunk do jogo antes do toque virar navegação — assim o `<Suspense>`
 * do GamePlay quase nunca aparece. Use no gesto que antecede a abertura:
 *
 *     <Link to={`/r/${id}/jogar/${g.id}`} onPointerDown={() => prefetchGame(g.id)} … />
 *
 * Seguro chamar várias vezes (o import() é cacheado) e com id desconhecido;
 * falha de rede é engolida de propósito: é só otimização, o carregamento real
 * acontece de novo na navegação.
 */
export function prefetchGame(id: string): void {
  void loaders[id]?.().catch(() => {});
}
