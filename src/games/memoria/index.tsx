import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { GameDefinition, GameProps, GameResult } from "../../lib/types";

const FOOD_EMOJIS = ["🍤", "🍕", "🥩", "🫓", "🍹", "🍰", "🦐", "🌽"];
const MAX_MOVES = 20;
const MISMATCH_DELAY = 800;

interface Card {
  key: number;
  emoji: string;
}

function shuffle<T>(source: T[]): T[] {
  const arr = [...source];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(): Card[] {
  const doubled = [...FOOD_EMOJIS, ...FOOD_EMOJIS];
  return shuffle(doubled).map((emoji, key) => ({ key, emoji }));
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Status = "playing" | "won" | "lost";

function Memoria({ restaurant, drawPrize, onFinish }: GameProps) {
  const [deck] = useState<Card[]>(buildDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [justMatched, setJustMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState<Status>("playing");
  const [seconds, setSeconds] = useState(0);

  const finishedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    return () => timeoutsRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Cronômetro só informativo
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const finish = (result: GameResult) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(result);
  };

  const handleWin = () => {
    setStatus("won");
    const prize = drawPrize();
    const won = prize.tier !== "none";
    if (won) {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: [restaurant.accent, "#f97316", "#ffedd5", "#ffffff"],
      });
    }
    later(() => finish({ won, prize }), 1400);
  };

  const handleLose = () => {
    setStatus("lost");
    later(() => finish({ won: false }), 2000);
  };

  const handleFlip = (index: number) => {
    if (locked || status !== "playing") return;
    if (flipped.includes(index) || matched.has(index)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    // Par tentado: conta a jogada e checa
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setLocked(true);

    const [a, b] = nextFlipped;
    const isMatch = deck[a].emoji === deck[b].emoji;

    if (isMatch) {
      const nextMatched = new Set(matched);
      nextMatched.add(a);
      nextMatched.add(b);
      setMatched(nextMatched);
      setJustMatched([a, b]);
      setFlipped([]);
      setLocked(false);
      later(() => setJustMatched([]), 700);

      if (nextMatched.size === deck.length) {
        handleWin();
      } else if (nextMoves >= MAX_MOVES) {
        handleLose();
      }
    } else {
      later(() => {
        setFlipped([]);
        setLocked(false);
        if (nextMoves >= MAX_MOVES) handleLose();
      }, MISMATCH_DELAY);
    }
  };

  const movesLeft = MAX_MOVES - moves;

  return (
    <div className="p-4 text-white">
      {/* Placar */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-sm">
        <span>
          Jogadas:{" "}
          <strong className={movesLeft <= 5 ? "text-brand-500" : ""}>
            {moves}/{MAX_MOVES}
          </strong>
        </span>
        <span className="text-white/60">⏱️ {formatTime(seconds)}</span>
      </div>

      {/* Grade 4x4 */}
      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, index) => {
          const isUp = flipped.includes(index) || matched.has(index);
          const isMatched = matched.has(index);
          const isPulsing = justMatched.includes(index);
          return (
            <button
              key={card.key}
              type="button"
              aria-label={isUp ? card.emoji : "Carta virada"}
              onClick={() => handleFlip(index)}
              disabled={isUp || locked || status !== "playing"}
              className="aspect-square w-full"
              style={{ perspective: "600px" }}
            >
              <div
                className="relative h-full w-full"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isUp ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.4s",
                }}
              >
                {/* Verso (emoji do restaurante) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/10 text-2xl"
                  style={{
                    backfaceVisibility: "hidden",
                    background: `linear-gradient(135deg, ${restaurant.accent}33, #ffffff0d)`,
                  }}
                >
                  {restaurant.emoji}
                </div>
                {/* Frente (prato) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center rounded-xl text-3xl ${
                    isPulsing ? "animate-pulse" : ""
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background: isMatched ? `${restaurant.accent}40` : "#ffffff1a",
                    border: `2px solid ${isMatched ? restaurant.accent : "#ffffff26"}`,
                    boxShadow: isPulsing ? `0 0 16px ${restaurant.accent}` : "none",
                  }}
                >
                  {card.emoji}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mensagem de fim */}
      <div className="mt-4 min-h-6 text-center text-sm text-white/80">
        {status === "won" && (
          <p>🎉 Todos os pares em {moves} jogadas! Vamos ver o que saiu...</p>
        )}
        {status === "lost" && (
          <p>Não foi dessa vez... os pares se esconderam bem! 😄</p>
        )}
        {status === "playing" && movesLeft <= 5 && (
          <p>
            Só mais {movesLeft} {movesLeft === 1 ? "jogada" : "jogadas"} —
            capricha na memória!
          </p>
        )}
      </div>
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
