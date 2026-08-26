import type { GameDefinition, GameProps } from "../../lib/types";

function Memoria({ drawPrize, onFinish }: GameProps) {
  return (
    <div className="p-8 text-center text-white">
      <p className="mb-4">🚧 Jogo da memória em construção</p>
      <button
        className="rounded-xl bg-brand-600 px-6 py-3 font-bold"
        onClick={() => {
          const prize = drawPrize();
          onFinish({ won: prize.tier !== "none", prize });
        }}
      >
        Jogar (stub)
      </button>
    </div>
  );
}

export const memoria: GameDefinition = {
  id: "memoria",
  name: "Jogo da Memória",
  tagline: "Encontre os pares do cardápio",
  emoji: "🃏",
  component: Memoria,
};
