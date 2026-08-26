import type { GameDefinition, GameProps } from "../../lib/types";

function Roleta({ drawPrize, onFinish }: GameProps) {
  return (
    <div className="p-8 text-center text-white">
      <p className="mb-4">🚧 Roleta em construção</p>
      <button
        className="rounded-xl bg-brand-600 px-6 py-3 font-bold"
        onClick={() => {
          const prize = drawPrize();
          onFinish({ won: prize.tier !== "none", prize });
        }}
      >
        Girar (stub)
      </button>
    </div>
  );
}

export const roleta: GameDefinition = {
  id: "roleta",
  name: "Roleta de Prêmios",
  tagline: "Gire e ganhe na hora",
  emoji: "🎡",
  component: Roleta,
};
