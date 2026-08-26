import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { getGame } from "../games";
import type { GameResult } from "../lib/types";
import { awardCoupon, consumePlay, drawPrize, getRestaurant } from "../lib/store";
import { play } from "../lib/sound";

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

/** Foto com skeleton shimmer enquanto carrega. */
function Photo({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-surface ${
        loaded ? "" : "animate-pulse"
      } ${className}`}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function GamePlay() {
  const { restaurantId = "", gameId = "" } = useParams();
  const navigate = useNavigate();
  const restaurant = getRestaurant(restaurantId);
  const game = getGame(gameId);
  const [result, setResult] = useState<GameResult | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Consome a jogada UMA única vez por montagem — o ref sobrevive ao
  // double-mount do StrictMode em dev (useMemo cobraria duas vezes).
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const chargedRef = useRef(false);
  useEffect(() => {
    if (chargedRef.current) return;
    chargedRef.current = true;
    setAllowed(restaurant ? consumePlay(restaurant.id) : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Celebração (ou lamento) quando o resultado chega.
  useEffect(() => {
    if (!result) return;
    const won = result.won && result.prize && result.prize.tier !== "none";
    if (won) {
      play("win");
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: CONFETTI_COLORS });
      const t1 = setTimeout(
        () =>
          confetti({
            particleCount: 55,
            spread: 110,
            startVelocity: 38,
            origin: { x: 0.2, y: 0.4 },
            colors: CONFETTI_COLORS,
          }),
        260
      );
      const t2 = setTimeout(
        () =>
          confetti({
            particleCount: 55,
            spread: 110,
            startVelocity: 38,
            origin: { x: 0.8, y: 0.4 },
            colors: CONFETTI_COLORS,
          }),
        440
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    play("lose", { volume: 0.5 });
  }, [result]);

  if (!restaurant || !game)
    return <div className="p-5 text-sm text-ink/50">Jogo não encontrado.</div>;

  // Ainda decidindo se a jogada foi cobrada (primeiro frame): não pisca tela.
  if (allowed === null && !result) return null;

  // --- Jogadas esgotadas ---------------------------------------------------
  if (!allowed && !result)
    return (
      <div className="px-6 pb-12 pt-16 text-center">
        <div className="anim-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
          >
            <path d="M7 3h10M7 21h10" />
            <path d="M8 3v3.5c0 2.2 4 3.3 4 5.5s-4 3.3-4 5.5V21" />
            <path d="M16 3v3.5c0 2.2-4 3.3-4 5.5s4 3.3 4 5.5V21" />
          </svg>
        </div>
        <p
          className="anim-fade-up mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40"
          style={{ animationDelay: "80ms" }}
        >
          {restaurant.name}
        </p>
        <h1
          className="anim-fade-up mt-2 font-display text-3xl font-bold tracking-tight"
          style={{ animationDelay: "140ms" }}
        >
          Jogadas esgotadas
        </h1>
        <p
          className="anim-fade-up mx-auto mt-3 max-w-[32ch] text-sm leading-relaxed text-ink/60"
          style={{ animationDelay: "200ms" }}
        >
          As de hoje acabaram por aqui. Um código da mesa libera mais na hora — é só pedir.
        </p>
        <Link
          to={`/r/${restaurant.id}`}
          className="press anim-fade-up mt-8 inline-block rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
          style={{ animationDelay: "280ms" }}
        >
          Pegar código da mesa
        </Link>
      </div>
    );

  // --- Resultado -----------------------------------------------------------
  if (result) {
    const won = result.won && result.prize && result.prize.tier !== "none";

    if (won && result.prize)
      return (
        <div className="px-6 pb-12 pt-12 text-center">
          <p className="anim-fade-up text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40">
            {restaurant.name}
          </p>
          <h1
            className="anim-fade-up mt-2 font-display text-4xl font-bold tracking-tight"
            style={{ animationDelay: "60ms" }}
          >
            Deu prêmio!
          </h1>

          {/* Ticket do cupom */}
          <div
            className="anim-pop relative mx-auto mt-7 max-w-xs overflow-hidden rounded-card bg-white text-left shadow-lg shadow-ink/10"
            style={{ animationDelay: "180ms" }}
          >
            <div className="h-1.5 bg-accent2" />
            <div className="flex items-center gap-3 p-4 pb-2.5">
              <Photo src={restaurant.photo} alt={restaurant.name} className="h-11 w-11 rounded-full" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{restaurant.name}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent2">
                  Prêmio da rodada
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 font-display text-xl font-bold leading-snug">
              {result.prize.label}
            </div>

            {/* Linha de recorte */}
            <div className="relative flex items-center">
              <div className="absolute -left-3 h-6 w-6 rounded-full bg-paper" />
              <div className="mx-4 flex-1 border-t-2 border-dashed border-ink/10" />
              <div className="absolute -right-3 h-6 w-6 rounded-full bg-paper" />
            </div>

            <div className="p-4 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/40">
                Código do cupom
              </div>
              {couponCode && (
                <div className="mt-1 font-display text-4xl font-bold tracking-[0.12em] text-brand-600">
                  {couponCode}
                </div>
              )}
              <p className="mt-2 text-xs font-semibold text-ink/50">Mostra pro garçom e pronto.</p>
            </div>
          </div>

          <div className="anim-fade-up mx-auto mt-8 grid max-w-xs gap-2.5" style={{ animationDelay: "340ms" }}>
            <button
              className="press rounded-full bg-brand-500 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
              onClick={() => navigate(`/r/${restaurant.id}`)}
            >
              Jogar de novo
            </button>
            <Link
              to="/cupons"
              className="press rounded-full border border-ink/15 bg-white py-3.5 text-sm font-bold text-ink transition-colors active:bg-surface"
            >
              Meus cupons
            </Link>
          </div>
        </div>
      );

    // Derrota: leve e encorajadora.
    return (
      <div className="px-6 pb-12 pt-16 text-center">
        <div className="anim-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface text-ink/40">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </div>
        <h1
          className="anim-fade-up mt-6 font-display text-3xl font-bold tracking-tight"
          style={{ animationDelay: "80ms" }}
        >
          Não foi dessa vez
        </h1>
        <p
          className="anim-fade-up mx-auto mt-3 max-w-[30ch] text-sm leading-relaxed text-ink/60"
          style={{ animationDelay: "140ms" }}
        >
          A sorte muda rápido por aqui. Respira e vem de novo.
        </p>
        <div className="anim-fade-up mt-8" style={{ animationDelay: "220ms" }}>
          <button
            className="press rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
            onClick={() => navigate(`/r/${restaurant.id}`)}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  // --- Jogo em andamento ---------------------------------------------------
  const GameComponent = game.component;
  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <Link
          to={`/r/${restaurant.id}`}
          className="press inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-3.5 w-3.5"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
          Sair
        </Link>
        <div className="font-display text-sm font-semibold">{game.name}</div>
      </div>
      <GameComponent
        restaurant={restaurant}
        drawPrize={() => drawPrize(restaurant)}
        onFinish={(r) => {
          if (r.won && r.prize && r.prize.tier !== "none") {
            const c = awardCoupon(restaurant.id, game.id, r.prize.label);
            setCouponCode(c.code);
          }
          setResult(r);
        }}
      />
    </div>
  );
}
