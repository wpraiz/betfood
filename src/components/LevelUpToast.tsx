import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { takeLevelUp } from "../lib/store";
import { play } from "../lib/sound";

/**
 * Celebração de nível novo (Bronze → Prata → Ouro → Chef → Lenda).
 *
 * Mora no Layout, que **nunca desmonta** enquanto o app está aberto. O HUD não
 * serve: ele some durante a partida — que é exatamente quando o XP sobe — e a
 * comemoração se perderia junto (ciclo 24). A comparação de nível fica no store
 * (`takeLevelUp`), então nem o recarregar da página engole o aviso.
 */
export default function LevelUpToast() {
  const [titulo, setTitulo] = useState<string | null>(null);
  const [bonus, setBonus] = useState(0);

  useEffect(() => {
    let fecha = 0;
    const olhar = () => {
      const novo = takeLevelUp();
      if (!novo) return;
      setTitulo(novo.title);
      setBonus(novo.bonus);
      play("levelup", { volume: 0.6 });
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.2 },
        colors: ["#e31b28", "#f5a623", "#ffffff"],
        disableForReducedMotion: true,
      });
      window.clearTimeout(fecha);
      fecha = window.setTimeout(() => setTitulo(null), 4200);
    };
    olhar();
    const id = window.setInterval(olhar, 900);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fecha);
    };
  }, []);

  if (!titulo) return null;

  return (
    // pointer-events-none: é comemoração, não diálogo — não pode roubar toque.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-50 flex justify-center px-4"
    >
      <div className="anim-pop flex items-center gap-3 rounded-full bg-ink px-5 py-2.5 shadow-xl">
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#f5a623" />
          <path
            d="m12 6.5 1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"
            fill="#fff3d6"
          />
        </svg>
        <div className="leading-tight">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
            Subiu de nível
          </div>
          <div className="font-display text-sm font-black text-white">{titulo}</div>
          {bonus > 0 && (
            <div className="font-display text-xs font-bold text-accent2">+{bonus} fichas</div>
          )}
        </div>
      </div>
    </div>
  );
}
