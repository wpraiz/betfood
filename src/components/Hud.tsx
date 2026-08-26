import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  canClaimDailyBonus,
  claimDailyBonus,
  getChips,
  getProgress,
} from "../lib/store";
import { play } from "../lib/sound";

function ChipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="10" fill="#f5a623" />
      <circle cx="12" cy="12" r="6.5" fill="#fff3d6" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fill="#b8860b"
        fontFamily="system-ui"
      >
        $
      </text>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <rect
            key={i}
            x="11"
            y="1.2"
            width="2"
            height="3.2"
            rx="1"
            fill="#fff3d6"
            transform={`rotate(${(a * 180) / Math.PI} 12 12)`}
          />
        );
      })}
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c.8 3.2 3.4 4.6 4.9 7 1.3 2.1 1.6 4.8.3 7.1A6.9 6.9 0 0 1 12 20a6.9 6.9 0 0 1-5.2-3.9c-1.2-2.4-.7-5.2 1-7.2.4 1 .9 1.8 1.9 2.4-.3-3.6.8-6.6 2.3-9.3Z" />
    </svg>
  );
}

/** Contagem animada até o valor, com tick sonoro esporádico. */
function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    const steps = 18;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      const v = Math.round(from + ((target - from) * i) / steps);
      setValue(v);
      if (i % 6 === 0) play("tick", { volume: 0.25 });
      if (i >= steps) window.clearInterval(id);
    }, 40);
    return () => window.clearInterval(id);
  }, [target]);
  return value;
}

export default function Hud() {
  const [chips, setChips] = useState(getChips());
  const [claimable, setClaimable] = useState(canClaimDailyBonus());
  const progress = getProgress();
  const shown = useCountUp(chips);

  // Estado muda em outras telas (jogar gasta ficha): re-sincroniza sempre.
  useEffect(() => {
    const id = window.setInterval(() => {
      setChips(getChips());
      setClaimable(canClaimDailyBonus());
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  function claim() {
    const r = claimDailyBonus();
    if (!r.ok) return;
    play("jackpot", { volume: 0.55 });
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.18 },
      colors: ["#ea1d2c", "#f5a623", "#ffffff"],
      disableForReducedMotion: true,
    });
    setChips(r.chips);
    setClaimable(false);
  }

  const pct =
    progress.levelCeil === null
      ? 100
      : Math.round(
          ((progress.xp - progress.levelFloor) /
            (progress.levelCeil - progress.levelFloor)) *
            100
        );

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-2.5">
        {/* Fichas */}
        <div className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5">
          <ChipIcon className="h-5 w-5" />
          <span className="font-display text-sm font-black tabular-nums text-white">
            {shown}
          </span>
        </div>

        {/* Streak */}
        {progress.streak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1.5 text-brand-600">
            <FlameIcon className="h-4 w-4" />
            <span className="text-xs font-black tabular-nums">{progress.streak}</span>
          </div>
        )}

        {/* Nível */}
        <div className="min-w-0 flex-1 px-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">
              {progress.levelName}
            </span>
            <span className="shrink-0 text-[10px] font-semibold tabular-nums text-ink/30">
              {progress.xp} XP
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent2 transition-all duration-700"
              style={{ width: `${Math.max(4, pct)}%` }}
            />
          </div>
        </div>

        {/* Bônus diário */}
        {claimable ? (
          <button
            onClick={claim}
            className="press animate-pulse rounded-full bg-gradient-to-r from-accent2 to-brand-500 px-3.5 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-lg shadow-accent2/40"
          >
            Bônus +30
          </button>
        ) : (
          <span className="rounded-full bg-surface px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink/30">
            Amanhã +30
          </span>
        )}
      </div>
    </header>
  );
}
