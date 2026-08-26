import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { GameDefinition, GameProps, Prize } from "../../lib/types";

const SLICES = 8;
const SLICE_ANGLE = 360 / SLICES;
const SPIN_MS = 4200; // duração do giro
const RESULT_DELAY = 1100; // pausa mostrando o resultado antes do onFinish

const CONFETTI_COLORS = ["#0088b0", "#d6006c", "#201e1d", "#bd9b57"];

/** Símbolos tipográficos sóbrios por tier (nada de emoji). */
const TIER_MARK: Record<Prize["tier"], string> = {
  big: "◆",
  medium: "●",
  small: "○",
  none: "",
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
      return `${accent}99`;
    case "small":
      return `${accent}40`;
    default:
      // "none": neutros claros alternados (branco / surface) pra dar textura sutil
      return index % 2 === 0 ? "#ffffff" : "#eae9e9";
  }
}

/** Cor do símbolo: claro sobre a fatia cheia de accent, ink/60 nas demais. */
function markFill(tier: Prize["tier"]) {
  return tier === "big" ? "rgba(255,255,255,0.9)" : "rgba(32,30,29,0.6)";
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
          particleCount: 70,
          spread: 55,
          origin: { y: 0.6 },
          colors: CONFETTI_COLORS,
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
    <div className="flex flex-col items-center gap-5 p-4 text-ink">
      <p className="text-sm text-ink/50">
        Toque na roleta e boa sorte no{" "}
        <span className="font-display font-semibold text-ink">{restaurant.name}</span>.
      </p>

      <div className="relative w-full max-w-xs">
        {/* Ponteiro */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div
            className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent"
            style={{ borderTopColor: "#201e1d" }}
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
            {/* Aro externo: filete fino na cor da casa + contorno em ink suave */}
            <circle cx={cx} cy={cy} r={r + 3} fill="#ffffff" stroke={restaurant.accent} strokeWidth="2" />
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
                const mid = polar(cx, cy, r * 0.72, start + SLICE_ANGLE / 2);
                return (
                  <g key={i}>
                    <path
                      d={slicePath(cx, cy, r, start, end)}
                      fill={sliceFill(p.tier, restaurant.accent, i)}
                      stroke="#201e1d"
                      strokeOpacity="0.1"
                      strokeWidth="1"
                    />
                    {TIER_MARK[p.tier] && (
                      <text
                        x={mid.x}
                        y={mid.y}
                        fontSize="13"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={markFill(p.tier)}
                      >
                        {TIER_MARK[p.tier]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            {/* Miolo: monograma serifado da casa */}
            <circle cx={cx} cy={cy} r="32" fill="#ffffff" stroke={restaurant.accent} strokeWidth="1.5" />
            <text
              x={cx}
              y={cy + 1}
              fontSize="26"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#201e1d"
              style={{ fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif' }}
            >
              {restaurant.name.charAt(0)}
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
            className="rounded-card bg-brand-600 px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-brand-700 active:scale-95"
          >
            Girar
          </button>
        )}
        {phase === "spinning" && (
          <p className="animate-pulse text-sm font-medium text-ink/50">Girando…</p>
        )}
        {phase === "done" && prize && (
          <div>
            {prize.tier !== "none" ? (
              <>
                <p className="font-display text-lg font-semibold" style={{ color: restaurant.accent }}>
                  {prize.label}
                </p>
                <p className="mt-1 text-xs text-ink/50">A casa preparou isso pra você.</p>
              </>
            ) : (
              <>
                <p className="font-display text-lg font-semibold text-ink/60">
                  Não foi dessa vez.
                </p>
                <p className="mt-1 text-xs text-ink/50">A próxima volta pode ser a sua.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legenda das fatias */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-ink/40">
        <span>◆ Prêmio maior</span>
        <span>● Prêmio médio</span>
        <span>○ Mimo da casa</span>
        <span>Fatia clara · tente de novo</span>
      </div>
    </div>
  );
}

export const roleta: GameDefinition = {
  id: "roleta",
  name: "Roleta de Prêmios",
  tagline: "Gire e ganhe na hora",
  component: Roleta,
};
