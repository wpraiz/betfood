import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getGame } from "../games";
import type { GameResult } from "../lib/types";
import { awardCoupon, consumePlay, drawPrize, getRestaurant } from "../lib/store";

export default function GamePlay() {
  const { restaurantId = "", gameId = "" } = useParams();
  const navigate = useNavigate();
  const restaurant = getRestaurant(restaurantId);
  const game = getGame(gameId);
  const [result, setResult] = useState<GameResult | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // Consome a jogada uma única vez, na montagem da tela.
  const allowed = useMemo(
    () => (restaurant ? consumePlay(restaurant.id) : false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [restaurantId, gameId]
  );

  if (!restaurant || !game)
    return <div className="p-5 text-sm text-ink/50">Jogo não encontrado.</div>;

  if (!allowed && !result)
    return (
      <div className="px-6 pb-10 pt-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40">
          {restaurant.name}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          Jogadas esgotadas
        </h1>
        <p className="mx-auto mt-4 max-w-[36ch] text-sm leading-relaxed text-ink/60">
          Suas jogadas de hoje acabaram. Peça um código da mesa no {restaurant.name} para
          liberar mais — ou volte amanhã.
        </p>
        <Link
          to={`/r/${restaurant.id}`}
          className="mt-8 inline-block rounded-card bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors active:bg-brand-700"
        >
          Voltar
        </Link>
      </div>
    );

  if (result) {
    const won = result.won && result.prize && result.prize.tier !== "none";
    return (
      <div className="px-6 pb-10 pt-16 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40">
          {restaurant.name}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {won ? "Você ganhou" : "Não foi dessa vez"}
        </h1>
        {won && result.prize && (
          <div className="mx-auto mt-6 max-w-xs rounded-card border border-ink/10 bg-white p-5 shadow-sm">
            <div className="font-display text-base font-semibold">{result.prize.label}</div>
            {couponCode && (
              <div className="mt-3 border-t border-dashed border-ink/15 pt-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/40">
                  Código do cupom
                </div>
                <div className="mt-1 font-display text-3xl font-bold tracking-[0.15em] text-brand-600">
                  {couponCode}
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-ink/50">Apresente este código ao garçom.</p>
          </div>
        )}
        {!won && (
          <p className="mx-auto mt-4 max-w-[36ch] text-sm leading-relaxed text-ink/60">
            Peça um código da mesa e tente de novo — a sorte muda rápido por aqui.
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button
            className="rounded-card bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors active:bg-brand-700"
            onClick={() => navigate(`/r/${restaurant.id}`)}
          >
            Jogar de novo
          </button>
          {won && (
            <Link
              to="/cupons"
              className="rounded-card border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors active:bg-surface"
            >
              Meus cupons
            </Link>
          )}
        </div>
      </div>
    );
  }

  const GameComponent = game.component;
  return (
    <div>
      <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
        <Link
          to={`/r/${restaurant.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40"
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
