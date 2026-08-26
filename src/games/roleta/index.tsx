import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { GameDefinition, GameProps, Prize } from "../../lib/types";

const SLICES = 8;
const SLICE_ANGLE = 360 / SLICES;
const SPIN_MS = 4200; // duração do giro
const RESULT_DELAY = 1100; // pausa mostrando o resultado antes do onFinish

const TIER_EMOJI: Record<Prize["tier"], string> = {
  big: "💎",
  medium: "🏅",
  small: "🎁",
  none: "🍀",
};

/** Ponto no círculo; ângulo em graus a partir do topo, sentido horário. */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** Path SVG de uma fatia entre dois ângulos (a partir do topo, horário). */
function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y} Z`;
}

function sliceFill(tier: Prize["tier"], accent: string, index: number) {
  switch (tier) {
    case "big":
      return accent;
    case "medium":
      return `${accent}cc`;
    case "small":
      return `${accent}77`;
    default:
      // "none": neutro escuro, alternando levemente pra dar textura
      return index % 2 === 0 ? "#332014" : "#2a1a10";
  }
}

type Phase = "idle" | "spinning" | "done";

function Roleta({ restaurant, drawPrize, onFinish }: GameProps) {
  // 8 fatias ciclando os prêmios do restaurante (todos aparecem pelo menos 1x).
  const [slices] = useState<Prize[]>(() =>
    Array.from({ length: SLICES }, (_, i) => restaurant.prizes[i % restaurant.prizes.length]),
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<Prize | null>(null);

  const finishedRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => {
    return () => timeoutsRef.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const spin = () => {
    if (phase !== "idle") return;

    const drawn = drawPrize();
    setPrize(drawn);
    setPhase("spinning");

    // Fatias coerentes com o prêmio sorteado (por id; sempre existe ao menos uma).
    const candidates = slices
      .map((p, i) => (p.id === drawn.id ? i : -1))
      .filter((i) => i >= 0);
    const target = candidates[Math.floor(Math.random() * candidates.length)];

    // Gira 5 voltas + o necessário pra fatia alvo parar sob o ponteiro (topo),
    // com um jitter pra não parar sempre no centro exato da fatia.
    const jitter = (Math.random() - 0.5) * (SLICE_ANGLE * 0.7);
    const targetAngle = 5 * 360 + (360 - (target * SLICE_ANGLE + SLICE_ANGLE / 2)) + jitter;
    setRotation((r) => r + targetAngle - (r % 360));

    later(() => {
      setPhase("done");
      const won = drawn.tier !== "none";
      if (won) {
        confetti({
          particleCount: 140,
          spread: 75,
          origin: { y: 0.6 },
          colors: [restaurant.accent, "#f97316", "#ffedd5", "#ffffff"],
        });
      }
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(won ? [60, 40, 120] : 60);
      }
      later(() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onFinish({ won, prize: drawn });
      }, RESULT_DELAY);
    }, SPIN_MS + 100);
  };

  const cx = 150;
  const cy = 150;
  const r = 144;

  return (
    <div className="flex flex-col items-center gap-5 p-4 text-white">
      <p className="text-sm text-white/70">
        Toque na roleta e boa sorte no {restaurant.emoji}{" "}
        <span className="font-bold">{restaurant.name}</span>!
      </p>

      <div className="relative w-full max-w-xs">
        {/* Ponteiro */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div
            className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent drop-shadow"
            style={{ borderTopColor: "#ffffff" }}
          />
        </div>

        <button
          type="button"
          aria-label="Girar a roleta"
          onClick={spin}
          disabled={phase !== "idle"}
          className="block w-full active:scale-[0.99]"
        >
          <svg viewBox="0 0 300 300" className="w-full">
            {/* Aro externo */}
            <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={restaurant.accent} strokeWidth="6" />
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "150px 150px",
                transition:
                  phase === "idle"
                    ? "none"
                    : `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.62, 0.08, 1)`,
              }}
            >
              {slices.map((p, i) => {
                const start = i * SLICE_ANGLE;
                const end = start + SLICE_ANGLE;
                const mid = polar(cx, cy, r * 0.68, start + SLICE_ANGLE / 2);
                return (
                  <g key={i}>
                    <path
                      d={slicePath(cx, cy, r, start, end)}
                      fill={sliceFill(p.tier, restaurant.accent, i)}
                      stroke="#1c0a04"
                      strokeWidth="2"
                    />
                    <text
                      x={mid.x}
                      y={mid.y}
                      fontSize="26"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {TIER_EMOJI[p.tier]}
                    </text>
                  </g>
                );
              })}
            </g>
            {/* Miolo */}
            <circle cx={cx} cy={cy} r="34" fill="#1c0a04" stroke={restaurant.accent} strokeWidth="3" />
            <text x={cx} y={cy} fontSize="28" textAnchor="middle" dominantBaseline="central">
              {phase === "spinning" ? "🤞" : restaurant.emoji}
            </text>
          </svg>
        </button>
      </div>

      {/* Estado / resultado */}
      <div className="min-h-14 text-center">
        {phase === "idle" && (
          <button
            type="button"
            onClick={spin}
            className="rounded-xl bg-brand-600 px-8 py-3 font-bold transition hover:bg-brand-500 active:scale-95"
          >
            Girar! 🎡
          </button>
        )}
        {phase === "spinning" && (
          <p className="animate-pulse text-sm font-bold text-white/80">Girando… 🤞</p>
        )}
        {phase === "done" && prize && (
          <div>
            {prize.tier !== "none" ? (
              <>
                <p className="text-lg font-black" style={{ color: restaurant.accent }}>
                  🎉 {prize.label}
                </p>
                <p className="text-xs text-white/60">A roleta gostou de você!</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black">🍀 Não foi dessa vez…</p>
                <p className="text-xs text-white/60">A próxima volta pode ser a sua!</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legenda das fatias */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span>💎 prêmio top</span>
        <span>🏅 prêmio médio</span>
        <span>🎁 mimo</span>
        <span>🍀 tenta de novo</span>
      </div>
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
