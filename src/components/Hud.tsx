import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  canClaimDailyBonus,
  CHIP_COST,
  claimDailyBonus,
  getChips,
  getProgress,
  msToNextChip,
} from "../lib/store";
import { isMuted, play, setMuted } from "../lib/sound";
import HowItWorks from "./HowItWorks";

/** Alto-falante (com ondas) ou alto-falante riscado quando está no mudo. */
function SpeakerIcon({ muted, className }: { muted: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      {muted ? (
        <>
          <path d="m16 9.5 5 5" />
          <path d="m21 9.5-5 5" />
        </>
      ) : (
        <>
          <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M18.5 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

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

/** "?" em círculo — abre o sheet que explica as fichas e que não é aposta. */
function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.9" />
      <path d="M12 17.1h.01" />
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

/** "7:05" — tempo até a próxima ficha; null quando o saldo está no teto. */
export function formatCountdown(ms: number | null): string | null {
  if (ms === null) return null;
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Hud() {
  const [chips, setChips] = useState(getChips());
  const [claimable, setClaimable] = useState(canClaimDailyBonus());
  const [muted, setMutedState] = useState(isMuted());
  const [helpOpen, setHelpOpen] = useState(false);
  const [nextChip, setNextChip] = useState<string | null>(null);
  const progress = getProgress();
  const shown = useCountUp(chips);

  // Estado muda em outras telas (jogar gasta ficha): re-sincroniza sempre.
  useEffect(() => {
    const tick = () => {
      setChips(getChips());
      setClaimable(canClaimDailyBonus());
      setMutedState(isMuted());
      setNextChip(formatCountdown(msToNextChip()));
    };
    tick();
    const id = window.setInterval(tick, 700);
    return () => window.clearInterval(id);
  }, []);

  // O mesmo toggle existe na barra do jogo: a fonte da verdade é o sound.ts.
  function toggleMute() {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
    if (!next) play("tap", { volume: 0.4 });
  }

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
    /* O sheet fica FORA do <header>: header é sticky com z-index, ou seja cria
       contexto de empilhamento — um overlay fixo lá dentro ficaria preso abaixo
       da tab bar do Layout. */
    <>
      {/* pt-[env(safe-area-inset-top)]: em PWA instalada o conteúdo desenharia sob
          a barra de status do iPhone (notch / Dynamic Island). */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          {/* Fichas */}
          <div className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5">
            <ChipIcon className="h-5 w-5" />
            <span className="font-display text-sm font-black tabular-nums text-white">
              {shown}
            </span>
            {/* Saldo curto: mostra quando cai a próxima ficha, pra ninguém achar
                que o app travou. Some quando há folga. */}
            {nextChip !== null && chips < CHIP_COST * 2 && (
              <span className="border-l border-white/25 pl-1.5 text-[10px] font-bold tabular-nums text-white/70">
                {nextChip}
              </span>
            )}
          </div>

          {/* Streak */}
          {progress.streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1.5 text-brand-600">
              <FlameIcon className="h-4 w-4" />
              <span className="text-xs font-black tabular-nums">{progress.streak}</span>
            </div>
          )}

          {/* Nível */}
          <div className="min-w-0 flex-1">
            {/* Só o nível: a barra já mostra o progresso, e o número de XP
                espremia o nome do nível em telas de 375px. */}
            <div className="flex items-baseline">
              <span
                className="truncate text-[10px] font-bold uppercase tracking-[0.04em] text-ink/65"
                title={`${progress.levelTitle} · ${progress.xp} XP`}
              >
                {progress.levelName}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent2 transition-all duration-700"
                style={{ width: `${Math.max(4, pct)}%` }}
              />
            </div>
          </div>

          {/* Som: respeita o silencioso do aparelho, este botão é o mudo do app.
              h-11/w-11 = 44px de alvo; -mx-1.5 compensa o visual. */}
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Ativar som" : "Desativar som"}
            title={muted ? "Ativar som" : "Desativar som"}
            className={`press -mx-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              muted ? "text-ink/65" : "text-ink"
            }`}
          >
            <SpeakerIcon muted={muted} className="h-5 w-5" />
          </button>

          {/* Ajuda: de onde vêm as fichas, pra que servem e que NÃO é aposta. */}
          <button
            type="button"
            onClick={() => {
              play("tap", { volume: 0.4 });
              setHelpOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            aria-label="Como funciona"
            title="Como funciona"
            /* só -mr: com -mx os 44px deste botão invadiriam os 44px do mudo
               (o mudo já puxa -1.5 pra direita) e daria mistap entre os dois. */
            className="press -mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"
          >
            <HelpIcon className="h-5 w-5" />
          </button>

          {/* Bônus diário */}
          {claimable ? (
            <button
              onClick={claim}
              className="press inline-flex h-11 shrink-0 items-center rounded-full bg-gradient-to-r from-accent2 to-brand-500 px-3 text-[11px] font-black uppercase tracking-wide text-white whitespace-nowrap shadow-lg shadow-accent2/40 motion-safe:animate-pulse"
            >
              Bônus +30
            </button>
          ) : (
            <span className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full bg-surface px-3 text-[10px] font-bold uppercase tracking-wide text-ink/65">
              Amanhã +30
            </span>
          )}
        </div>
      </header>

      <HowItWorks open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
