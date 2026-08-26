import type { GameDefinition, GameProps } from "../../lib/types";

function Quiz({ drawPrize, onFinish }: GameProps) {
  return (
    <div className="p-8 text-center text-white">
      <p className="mb-4">🚧 Quiz em construção</p>
      <button
        className="rounded-xl bg-brand-600 px-6 py-3 font-bold"
        onClick={() => {
          const prize = drawPrize();
          onFinish({ won: prize.tier !== "none", prize });
        }}
      >
        Responder (stub)
      </button>
    </div>
  );
}

export const quiz: GameDefinition = {
  id: "quiz",
  name: "Quiz Gastronômico",
  tagline: "Acerte e leve o prêmio",
  emoji: "🧠",
  component: Quiz,
};
