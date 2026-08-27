import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { play } from "../../lib/sound";
import { reduzMovimento } from "../../lib/motion";
import type { GameProps, GameResult } from "../../lib/types";

// Pares com FOTO: pratos/ingredientes da casa (Unsplash fixo, mesmo padrão do seed)
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=200&q=70`;

interface Food {
  id: string;
  label: string;
  photo: string;
}

const FOODS: Food[] = [
  { id: "camarao", label: "Camarão", photo: IMG("1565680018434-b513d5e5fd47") },
  { id: "tapioca", label: "Tapioca", photo: IMG("1484723091739-30a097e8f929") },
  { id: "picanha", label: "Picanha", photo: IMG("1544025162-d76694265947") },
  { id: "pizza", label: "Pizza", photo: IMG("1513104890138-7c749659a591") },
  { id: "petiscos", label: "Petiscos", photo: IMG("1504674900247-0877df9cc836") },
  { id: "do-chef", label: "Do chef", photo: IMG("1414235077428-338989a2e8c0") },
  { id: "salmao", label: "Salmão", photo: IMG("1467003909585-2f8a72700288") },
  // Etiquetas conferidas contra a foto real (ciclo 17): esta é uma tábua de
  // churrasco misto, não só frango.
  { id: "churrasco", label: "Churrasco", photo: IMG("1555939594-58d7cb561ad1") },
];

const MAX_MOVES = 20;
const MISMATCH_DELAY = 800;
const FLAWLESS_MARGIN = 5; // sobrando 5+ tentativas, vitória vira jackpot

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

// Verso das cartas: brand-500 com losangos sutis em CSS
const BACK_PATTERN =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 8px, transparent 8px 16px), " +
  "repeating-linear-gradient(-45deg, rgba(255,255,255,0.08) 0 8px, transparent 8px 16px)";

const GLOW_SOFT = "0 0 14px -2px rgba(245, 166, 35, 0.55)";

interface Card {
  key: number;
  food: Food;
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
  const doubled = [...FOODS, ...FOODS];
  return shuffle(doubled).map((food, key) => ({ key, food }));
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Status = "playing" | "won" | "lost";

function Memoria({ restaurant, drawPrize, startPlay, onFinish }: GameProps) {
  const [deck] = useState<Card[]>(buildDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(() => new Set());
  const [justMatched, setJustMatched] = useState<number[]>([]);
  const [mismatched, setMismatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState<Status>("playing");
  const [flawless, setFlawless] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const finishedRef = useRef(false);
  const startedRef = useRef(false); // rodada já cobrada?
  const timeoutsRef = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    return () => timeoutsRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  // Pré-carrega as 8 fotos na montagem pra virada nunca mostrar carta em branco
  useEffect(() => {
    FOODS.forEach((food) => {
      const img = new Image();
      img.src = food.photo;
    });
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

  const handleWin = (finalMoves: number) => {
    const isFlawless = MAX_MOVES - finalMoves >= FLAWLESS_MARGIN;
    setStatus("won");
    setFlawless(isFlawless);
    const prize = drawPrize();
    const won = prize.tier !== "none";

    play("win");
    if (isFlawless) later(() => play("jackpot"), 320);

    // Confetti em camadas: centro → laterais → (jackpot) chuva alta
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: CONFETTI_COLORS,
    });
    later(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: CONFETTI_COLORS,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: CONFETTI_COLORS,
      });
    }, 200);
    if (isFlawless) {
      later(() => {
        confetti({
          particleCount: 90,
          spread: 110,
          startVelocity: 42,
          origin: { y: 0.45 },
          colors: CONFETTI_COLORS,
        });
      }, 450);
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isFlawless ? [60, 40, 60, 40, 140] : [60, 40, 120]);
    }

    // A folga extra do "sem erro" existe pra caber a última chuva de confetti;
    // sem animação ela vira espera vazia.
    later(() => finish({ won, prize }), isFlawless && !reduzMovimento() ? 1900 : 1500);
  };

  const handleLose = () => {
    setStatus("lost");
    play("lose");
    later(() => finish({ won: false }), 2000);
  };

  const handleFlip = (index: number) => {
    if (locked || status !== "playing") return;
    if (flipped.includes(index) || matched.has(index)) return;

    // Primeira carta virada = início real da rodada: cobra aqui, uma vez só.
    if (!startedRef.current) {
      if (!startPlay()) return;
      startedRef.current = true;
    }

    play("flip");
    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    // Par tentado: conta a tentativa e checa
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setLocked(true);

    const [a, b] = nextFlipped;
    const isMatch = deck[a].food.id === deck[b].food.id;

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
        handleWin(nextMoves);
      } else if (nextMoves >= MAX_MOVES) {
        handleLose();
      } else if (MAX_MOVES - nextMoves === 5) {
        play("tick");
      }
    } else {
      // Erro: shake sutil com as cartas ainda abertas, depois desvira
      later(() => {
        play("wrong");
        setMismatched([a, b]);
      }, 260);
      later(() => {
        setMismatched([]);
        setFlipped([]);
        setLocked(false);
        if (nextMoves >= MAX_MOVES) handleLose();
        else if (MAX_MOVES - nextMoves === 5) play("tick");
      }, MISMATCH_DELAY);
    }
  };

  const movesLeft = MAX_MOVES - moves;
  const lowMoves = movesLeft <= 5;
  const pairsFound = matched.size / 2;

  return (
    <div className="px-5 py-4">
      {/* Keyframes locais: shake do erro + pulso do par certo */}
      <style>{`
        @keyframes mem-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        .mem-shake { animation: mem-shake 0.45s ease both; }
        @keyframes mem-match {
          0% { transform: scale(1); }
          45% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .mem-match { animation: mem-match 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .mem-shake, .mem-match { animation: none; }
        }
      `}</style>

      <div className="anim-fade-up mb-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">
          Jogo da memória
        </p>
        <p className="mt-1 text-sm text-ink/70">
          Ache os pares do cardápio do{" "}
          <span className="font-display font-semibold text-ink">{restaurant.name}</span>.
        </p>
        {/* A regra precisa vir ANTES da ficha ser cobrada: estourar o limite
            encerra a rodada sem sorteio nenhum. O quiz já avisava ("2 de 3
            libera o prêmio"); aqui o jogador descobria no fim. */}
        <p className="mt-1.5 text-xs text-ink/70">
          Feche os {FOODS.length} pares em até {MAX_MOVES} tentativas pra concorrer ao prêmio.
        </p>
      </div>

      {/* Placar: pills de momentum das tentativas + pares encontrados */}
      <div
        className="anim-fade-up mb-4 rounded-card bg-white p-4 shadow-md shadow-ink/5"
        style={{ animationDelay: "60ms" }}
      >
        <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
          {/* "Tentativas", não "jogadas": jogada é a PARTIDA que custa fichas
              (o HUD mostra o saldo em fichas na mesma tela). Chamar o par de
              cartas de jogada fazia parecer que havia 20 partidas guardadas. */}
          <span>
            Tentativas{" "}
            <span
              className={`font-display text-sm ${lowMoves ? "text-brand-600" : "text-ink"}`}
            >
              {movesLeft}
            </span>{" "}
            restantes
          </span>
          <span>
            Tempo <span className="font-display text-sm text-ink">{formatTime(seconds)}</span>
          </span>
        </div>
        <div className={`flex items-center gap-[3px] ${lowMoves ? "animate-pulse" : ""}`}>
          {Array.from({ length: MAX_MOVES }, (_, i) => {
            const used = i < moves;
            return (
              <span
                key={i}
                className="h-2 flex-1 rounded-full transition-colors duration-300"
                style={{
                  background: used
                    ? "var(--color-surface)"
                    : lowMoves
                      ? "#ea1d2c"
                      : "#f5a623",
                }}
              />
            );
          })}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          {FOODS.map((food, i) => (
            <span
              key={food.id}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                background: i < pairsFound ? "#f5a623" : "var(--color-surface)",
              }}
            />
          ))}
          <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/70">
            Pares {pairsFound}/{FOODS.length}
          </span>
        </div>
      </div>

      {/* Grade 4x4 */}
      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, index) => {
          const isUp = flipped.includes(index) || matched.has(index);
          const isMatched = matched.has(index);
          const isPulsing = justMatched.includes(index);
          const isShaking = mismatched.includes(index);
          return (
            <button
              key={card.key}
              type="button"
              aria-label={isUp ? card.food.label : "Carta virada"}
              onClick={() => handleFlip(index)}
              disabled={isUp || locked || status !== "playing"}
              className={`press anim-fade-up aspect-square w-full ${
                isShaking ? "mem-shake" : isPulsing ? "mem-match" : ""
              }`}
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
                  className="absolute inset-0 flex items-center justify-center rounded-xl shadow-sm"
                  style={{
                    backfaceVisibility: "hidden",
                    background: "var(--color-brand-500)",
                    backgroundImage: BACK_PATTERN,
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/70 font-display text-base font-extrabold text-white">
                    B
                  </span>
                </div>
                {/* Frente: foto do prato + label */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    border: `2px solid ${isMatched ? "#f5a623" : "rgba(32,30,29,0.08)"}`,
                    background: "var(--color-surface)",
                    boxShadow: isMatched
                      ? isPulsing
                        ? "0 0 22px 4px rgba(245, 166, 35, 0.75)"
                        : GLOW_SOFT
                      : "none",
                    transition: "box-shadow 0.4s",
                  }}
                >
                  <img
                    src={card.food.photo}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-0.5 pb-1 pt-4">
                    <p className="truncate text-center text-[9px] font-bold uppercase tracking-wide text-white">
                      {card.food.label}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mensagem de fim */}
      <div className="mt-5 min-h-6 text-center text-sm leading-relaxed text-ink/70">
        {status === "won" && (
          <div className="anim-pop">
            {flawless && (
              <span className="anim-glow mb-2 inline-block rounded-full bg-accent2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                Memória de chef
              </span>
            )}
            <p className="font-display text-lg font-extrabold leading-tight text-brand-600">
              {flawless
                ? `Fechou os ${FOODS.length} pares com ${movesLeft} tentativas sobrando!`
                : `Fechou os ${FOODS.length} pares em ${moves} tentativas.`}
            </p>
            <p className="mt-1 text-xs font-medium text-ink/70">
              {flawless ? "Jogada de mestre — vamos ver o que saiu." : "Vamos ver o que saiu."}
            </p>
          </div>
        )}
        {status === "lost" && (
          <div className="anim-pop">
            <p className="font-display text-lg font-bold text-ink/45">Não foi dessa vez.</p>
            <p className="mt-1 text-xs text-ink/70">As tentativas acabaram — bora tentar outra.</p>
          </div>
        )}
        {status === "playing" && lowMoves && (
          <p className="font-semibold text-brand-600">
            Só mais {movesLeft} {movesLeft === 1 ? "tentativa" : "tentativas"} — atenção aos pares.
          </p>
        )}
      </div>
    </div>
  );
}

// Default export: o registro (id/name/tagline) mora em src/games/index.ts, que
// carrega este módulo sob demanda via React.lazy.
export default Memoria;
