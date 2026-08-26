import type { GameDefinition, GameProps } from "../../lib/types";

function Raspadinha({ drawPrize, onFinish }: GameProps) {
  return (
    <div className="p-8 text-center text-white">
      <p className="mb-4">🚧 Raspadinha em construção</p>
      <button
        className="rounded-xl bg-brand-600 px-6 py-3 font-bold"
        onClick={() => {
          const prize = drawPrize();
          onFinish({ won: prize.tier !== "none", prize });
        }}
      >
        Raspar (stub)
      </button>
    </div>
  );
}

export const raspadinha: GameDefinition = {
  id: "raspadinha",
  name: "Raspadinha",
  tagline: "Raspe e descubra seu prêmio",
  emoji: "🪙",
  component: Raspadinha,
};
