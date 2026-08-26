import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { GameDefinition, GameProps, GameResult } from "../../lib/types";

// Pares tipográficos: nomes curtos de ingredientes/pratos da casa
const FOOD_WORDS = [
  "Camarão",
  "Tapioca",
  "Picanha",
  "Caju",
  "Coalho",
  "Cuscuz",
  "Pimenta",
  "Manjericão",
];
const MAX_MOVES = 20;
const MISMATCH_DELAY = 800;

interface Card {
  key: number;
  word: string;
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
  const doubled = [...FOOD_WORDS, ...FOOD_WORDS];
  return shuffle(doubled).map((word, key) => ({ key, word }));
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
        particleCount: 70,
        spread: 55,
        origin: { y: 0.6 },
        colors: ["#0088b0", "#d6006c", "#201e1d", "#bd9b57"],
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
    const isMatch = deck[a].word === deck[b].word;

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
  const monogram = restaurant.name.charAt(0);

  return (
    <div className="px-5 py-4">
      {/* Placar */}
      <div className="mb-4 flex items-center justify-between rounded-card border border-ink/10 bg-white px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-sm">
        <span className="text-ink/40">
          Jogadas{" "}
          <span style={{ color: movesLeft <= 5 ? "#a85751" : "var(--color-ink)" }}>
            {moves}/{MAX_MOVES}
          </span>
        </span>
        <span className="text-ink/40">
          Tempo <span className="text-ink">{formatTime(seconds)}</span>
        </span>
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
              aria-label={isUp ? card.word : "Carta virada"}
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
                {/* Verso (monograma da casa) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-card border border-ink/10 bg-surface font-display text-xl font-bold"
                  style={{
                    backfaceVisibility: "hidden",
                    color: restaurant.accent,
                  }}
                >
                  {monogram}
                </div>
                {/* Frente (ingrediente/prato) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-card bg-white px-0.5 font-display text-[11px] font-semibold leading-tight text-ink ${
                    isPulsing ? "animate-pulse" : ""
                  }`}
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    border: `1px solid ${isMatched ? restaurant.accent : "rgba(32,30,29,0.15)"}`,
                    background: isMatched ? `${restaurant.accent}14` : undefined,
                  }}
                >
                  {card.word}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mensagem de fim */}
      <div className="mt-5 min-h-6 text-center text-sm leading-relaxed text-ink/60">
        {status === "won" && (
          <p>Todos os pares em {moves} jogadas. Vamos ver o que saiu.</p>
        )}
        {status === "lost" && (
          <p>Não foi dessa vez — os pares se esconderam bem.</p>
        )}
        {status === "playing" && movesLeft <= 5 && (
          <p>
            Só mais {movesLeft} {movesLeft === 1 ? "jogada" : "jogadas"} — atenção aos pares.
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
  component: Memoria,
};
