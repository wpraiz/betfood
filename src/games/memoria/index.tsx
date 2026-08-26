import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { play } from "../../lib/sound";
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

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

// Verso das cartas: brand-500 com losangos sutis em CSS
const BACK_PATTERN =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 8px, transparent 8px 16px), " +
  "repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0 8px, transparent 8px 16px)";

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
    play("win");
    confetti({
      particleCount: 110,
      spread: 70,
      origin: { y: 0.6 },
      colors: CONFETTI_COLORS,
    });
    later(() => finish({ won, prize }), 1400);
  };

  const handleLose = () => {
    setStatus("lost");
    play("lose");
    later(() => finish({ won: false }), 2000);
  };

  const handleFlip = (index: number) => {
    if (locked || status !== "playing") return;
    if (flipped.includes(index) || matched.has(index)) return;

    play("flip");
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
      play("correct");
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
  const lowMoves = movesLeft <= 5;
  const pairsFound = matched.size / 2;

  return (
    <div className="px-5 py-4">
      {/* Placar: barra de jogadas + pills de pares */}
      <div className="anim-fade-up mb-4 rounded-card bg-white p-4 shadow-md shadow-ink/5">
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
          <span>
            Jogadas{" "}
            <span
              className={`font-display text-sm ${lowMoves ? "text-brand-500" : "text-ink"}`}
            >
              {movesLeft}
            </span>{" "}
            restantes
          </span>
          <span>
            Tempo <span className="font-display text-sm text-ink">{formatTime(seconds)}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full bg-brand-500 transition-all duration-300 ${
              lowMoves ? "animate-pulse" : ""
            }`}
            style={{ width: `${(movesLeft / MAX_MOVES) * 100}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {FOOD_WORDS.map((word, i) => (
            <span
              key={word}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                background: i < pairsFound ? "#f5a623" : "var(--color-surface)",
              }}
            />
          ))}
          <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">
            Pares {pairsFound}/{FOOD_WORDS.length}
          </span>
        </div>
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
              className="press anim-fade-up aspect-square w-full"
              style={{ perspective: "600px", animationDelay: `${index * 35}ms` }}
            >
              <div
                className="relative h-full w-full"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isUp ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: "transform 0.4s",
                }}
              >
                {/* Verso (vermelho, losangos + monograma B) */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl font-display text-2xl font-bold text-white shadow-sm"
                  style={{
                    backfaceVisibility: "hidden",
                    background: "var(--color-brand-500)",
                    backgroundImage: BACK_PATTERN,
                  }}
                >
                  B
                </div>
                {/* Frente (ingrediente/prato) */}
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl px-0.5 font-display text-[11px] font-bold leading-tight text-ink"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    border: `2px solid ${isMatched ? "#f5a623" : "rgba(32,30,29,0.08)"}`,
                    background: isMatched ? "#f5a6231f" : "#f5a6230d",
                  }}
                >
                  <span className={isPulsing ? "anim-pop" : ""}>{card.word}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mensagem de fim */}
      <div className="mt-5 min-h-6 text-center text-sm leading-relaxed text-ink/60">
        {status === "won" && (
          <p className="anim-fade-up font-semibold text-ink">
            Fechou os {FOOD_WORDS.length} pares em {moves} jogadas. Vamos ver o que saiu.
          </p>
        )}
        {status === "lost" && (
          <p className="anim-fade-up">As jogadas acabaram — os pares venceram essa.</p>
        )}
        {status === "playing" && lowMoves && (
          <p className="font-semibold text-brand-500">
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
