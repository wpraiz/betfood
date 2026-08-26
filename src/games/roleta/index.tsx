import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { play, stop } from "../../lib/sound";
import type { GameDefinition, GameProps, Prize } from "../../lib/types";

const SLICES = 8;
const SLICE_ANGLE = 360 / SLICES;
const SPIN_MS = 4200; // duração do giro
const RESULT_DELAY = 1600; // pausa mostrando o resultado antes do onFinish
const LIGHTS = 16; // "lâmpadas" do aro

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

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

/** Cores das fatias por tier: âmbar brilhante > vermelho cheio > tint > neutro. */
function sliceFill(tier: Prize["tier"], index: number) {
  switch (tier) {
    case "big":
      return "url(#roleta-grad-big)";
    case "medium":
      return "url(#roleta-grad-med)";
    case "small":
      return "#fbd6d8";
    default:
      // "none": neutros claros alternados pra dar textura sutil
      return index % 2 === 0 ? "#ffffff" : "#f3f1f1";
  }
}

/** Marca da fatia: losango (big), círculo cheio (medium), anel (small). */
function TierMark({ tier, x, y }: { tier: Prize["tier"]; x: number; y: number }) {
  if (tier === "big") {
    return (
      <path
        d={`M ${x} ${y - 7.5} L ${x + 7.5} ${y} L ${x} ${y + 7.5} L ${x - 7.5} ${y} Z`}
        fill="#ffffff"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />
    );
  }
  if (tier === "medium") {
    return <circle cx={x} cy={y} r="5.5" fill="#ffffff" />;
  }
  if (tier === "small") {
    return <circle cx={x} cy={y} r="5" fill="none" stroke="#ea1d2c" strokeWidth="2.2" />;
  }
  return null;
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
    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      stop("spin");
    };
  }, []);

  const spin = () => {
    if (phase !== "idle") return;

    const drawn = drawPrize();
    setPrize(drawn);
    setPhase("spinning");
    play("spin");

    // Fatias coerentes com o prêmio sorteado (por id; sempre existe ao menos uma).
    const candidates = slices
      .map((p, i) => (p.id === drawn.id ? i : -1))
      .filter((i) => i >= 0);
    // Near-miss: quando não ganhou, prefere uma fatia vizinha a um prêmio grande
    // — o giro para "por pouco". O resultado continua sendo o de drawPrize().
    const bigIdx = slices.map((p, i) => (p.tier === "big" ? i : -1)).filter((i) => i >= 0);
    const nearMiss =
      drawn.tier === "none" && bigIdx.length > 0
        ? candidates.filter((i) =>
            bigIdx.some((b) => Math.abs(b - i) === 1 || Math.abs(b - i) === SLICES - 1)
          )
        : [];
    const pool = nearMiss.length > 0 ? nearMiss : candidates;
    const target = pool[Math.floor(Math.random() * pool.length)];

    // Gira 5 voltas + o necessário pra fatia alvo parar sob o ponteiro (topo).
    // No near-miss o jitter puxa pra beirada da fatia, colando no prêmio grande.
    const jitter =
      nearMiss.length > 0
        ? (Math.random() * 0.18 + 0.3) * SLICE_ANGLE * (Math.random() < 0.5 ? 1 : -1)
        : (Math.random() - 0.5) * (SLICE_ANGLE * 0.7);
    const targetAngle = 5 * 360 + (360 - (target * SLICE_ANGLE + SLICE_ANGLE / 2)) + jitter;
    setRotation((r) => r + targetAngle - (r % 360));

    later(() => {
      setPhase("done");
      stop("spin");
      const won = drawn.tier !== "none";
      play(won ? "win" : "lose");
      if (won) {
        confetti({
          particleCount: 130,
          spread: 78,
          origin: { y: 0.6 },
          colors: CONFETTI_COLORS,
        });
        later(() => {
          confetti({
            particleCount: 55,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.68 },
            colors: CONFETTI_COLORS,
          });
          confetti({
            particleCount: 55,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.68 },
            colors: CONFETTI_COLORS,
          });
        }, 180);
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

  const cx = 160;
  const cy = 160;
  const r = 126; // raio das fatias (o aro vai até 152)

  const lights = Array.from({ length: LIGHTS }, (_, i) => {
    const pos = polar(cx, cy, 139, (360 / LIGHTS) * i + 360 / LIGHTS / 2);
    return { ...pos, cls: i % 2 === 0 ? "la" : "lb" };
  });

  return (
    <div className="flex flex-col items-center gap-5 p-4 text-ink">
      {/* Keyframes locais: luzes do aro + bounce do ponteiro */}
      <style>{`
        @keyframes roleta-blink-a { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.25; } }
        @keyframes roleta-blink-b { 0%, 49% { opacity: 0.25; } 50%, 100% { opacity: 1; } }
        .roleta-lights .la { animation: roleta-blink-a 1.5s steps(1, end) infinite; }
        .roleta-lights .lb { animation: roleta-blink-b 1.5s steps(1, end) infinite; }
        .roleta-lights--fast .la, .roleta-lights--fast .lb { animation-duration: 0.28s; }
        @keyframes roleta-pointer-bounce {
          0% { transform: translateY(0); }
          35% { transform: translateY(8px); }
          70% { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        .roleta-pointer-bounce { animation: roleta-pointer-bounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .roleta-lights .la, .roleta-lights .lb, .roleta-pointer-bounce { animation: none; }
        }
      `}</style>

      <div className="anim-fade-up text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-500">
          Roleta de prêmios
        </p>
        <p className="mt-1 text-sm text-ink/60">
          Uma volta, um prêmio no{" "}
          <span className="font-display font-semibold text-ink">{restaurant.name}</span>.
        </p>
      </div>

      <div className="anim-pop relative w-full max-w-[340px]" style={{ animationDelay: "80ms" }}>
        {/* Ponteiro */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 translate-y-[6px]">
          <div
            className={phase === "done" ? "roleta-pointer-bounce" : undefined}
            style={{ filter: "drop-shadow(0 3px 4px rgba(32,30,29,0.35))" }}
          >
            <div className="h-0 w-0 border-l-[13px] border-r-[13px] border-t-[24px] border-l-transparent border-r-transparent border-t-brand-600" />
          </div>
        </div>

        <button
          type="button"
          aria-label="Girar a roleta"
          onClick={spin}
          disabled={phase !== "idle"}
          className="press block w-full"
        >
          <svg
            viewBox="0 0 320 320"
            className="w-full"
            style={{ filter: "drop-shadow(0 14px 28px rgba(234,29,44,0.22))" }}
          >
            <defs>
              <linearGradient id="roleta-grad-big" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffc95e" />
                <stop offset="55%" stopColor="#f5a623" />
                <stop offset="100%" stopColor="#e08c00" />
              </linearGradient>
              <linearGradient id="roleta-grad-med" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4b57" />
                <stop offset="100%" stopColor="#ea1d2c" />
              </linearGradient>
              <linearGradient id="roleta-grad-rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cf1626" />
                <stop offset="100%" stopColor="#a81220" />
              </linearGradient>
              <linearGradient id="roleta-grad-hub" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff3a46" />
                <stop offset="100%" stopColor="#cf1626" />
              </linearGradient>
            </defs>

            {/* Aro externo com luzes */}
            <circle cx={cx} cy={cy} r="156" fill="#ffffff" />
            <circle cx={cx} cy={cy} r="152" fill="url(#roleta-grad-rim)" />
            <g className={`roleta-lights${phase === "spinning" ? " roleta-lights--fast" : ""}`}>
              {lights.map((l, i) => (
                <circle key={i} cx={l.x} cy={l.y} r="4.5" fill="#ffdf9e" className={l.cls} />
              ))}
            </g>

            {/* Roda */}
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "160px 160px",
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
                      fill={sliceFill(p.tier, i)}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <TierMark tier={p.tier} x={mid.x} y={mid.y} />
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(32,30,29,0.08)" strokeWidth="1.5" />
            </g>

            {/* Miolo GIRAR */}
            <circle cx={cx} cy={cy} r="54" fill="#ffffff" />
            <circle cx={cx} cy={cy} r="46" fill="url(#roleta-grad-hub)" />
            <text
              x={cx}
              y={cy + 1}
              fontSize="19"
              fontWeight="800"
              letterSpacing="2"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#ffffff"
              opacity={phase === "idle" ? 1 : 0.55}
              style={{ fontFamily: "var(--font-display)" }}
            >
              GIRAR
            </text>
          </svg>
        </button>
      </div>

      {/* Estado / resultado */}
      <div className="flex min-h-[84px] w-full flex-col items-center justify-center text-center">
        {phase === "idle" && (
          <button
            type="button"
            onClick={spin}
            className="press w-full max-w-[280px] rounded-full bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
          >
            Girar agora
          </button>
        )}
        {phase === "spinning" && (
          <p className="animate-pulse text-sm font-semibold text-ink/50">Girando…</p>
        )}
        {phase === "done" && prize && (
          <div className="anim-pop">
            {prize.tier !== "none" ? (
              <>
                {prize.tier === "big" && (
                  <span className="mb-2 inline-block rounded-full bg-accent2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                    Prêmio top
                  </span>
                )}
                <p className="font-display text-2xl font-extrabold leading-tight text-brand-600">
                  {prize.label}
                </p>
                <p className="mt-1.5 text-xs font-medium text-ink/50">
                  Girou, ganhou. Mostra pro garçom e pronto.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-bold text-ink/45">Não foi dessa vez.</p>
                <p className="mt-1 text-xs text-ink/50">A próxima volta pode ser a sua.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Legenda das fatias */}
      <div
        className="anim-fade-up flex flex-wrap justify-center gap-2"
        style={{ animationDelay: "160ms" }}
      >
        {[
          { color: "#f5a623", label: "Prêmio top" },
          { color: "#ea1d2c", label: "Prêmio médio" },
          { color: "#fbd6d8", label: "Mimo da casa" },
          { color: "#eae9e9", label: "Tenta de novo" },
        ].map((it) => (
          <span
            key={it.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink/60 shadow-sm"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
            {it.label}
          </span>
        ))}
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
