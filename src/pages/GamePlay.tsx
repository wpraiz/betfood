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

  if (!restaurant || !game) return <div className="p-4">Jogo não encontrado.</div>;

  if (!allowed && !result)
    return (
      <div className="p-8 text-center">
        <div className="mb-2 text-4xl">😅</div>
        <p className="mb-4 font-bold">Suas jogadas de hoje acabaram!</p>
        <p className="mb-6 text-sm text-white/60">
          Peça um código da mesa no {restaurant.name} pra liberar mais jogadas — ou volte amanhã.
        </p>
        <Link to={`/r/${restaurant.id}`} className="rounded-xl bg-brand-600 px-6 py-3 font-bold">
          Voltar
        </Link>
      </div>
    );

  if (result) {
    const won = result.won && result.prize && result.prize.tier !== "none";
    return (
      <div className="p-8 text-center">
        <div className="mb-2 text-5xl">{won ? "🎉" : "🍀"}</div>
        <h1 className="mb-2 text-xl font-black">{won ? "Você ganhou!" : "Não foi dessa vez"}</h1>
        {won && result.prize && (
          <div className="mx-auto mb-4 max-w-xs rounded-2xl border border-brand-500 bg-brand-900/40 p-4">
            <div className="font-bold">{result.prize.label}</div>
            {couponCode && (
              <div className="mt-2 text-2xl font-black tracking-widest text-brand-500">
                {couponCode}
              </div>
            )}
            <div className="mt-1 text-xs text-white/60">Mostre esse código ao garçom 😉</div>
          </div>
        )}
        {!won && (
          <p className="mb-4 text-sm text-white/60">
            Peça um código da mesa e tente de novo — a sorte muda rápido por aqui.
          </p>
        )}
        <div className="flex justify-center gap-3">
          <button
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold"
            onClick={() => navigate(`/r/${restaurant.id}`)}
          >
            Jogar de novo
          </button>
          {won && (
            <Link to="/cupons" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold">
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
      <div className="flex items-center justify-between p-4">
        <Link to={`/r/${restaurant.id}`} className="text-sm text-white/50">
          ← sair
        </Link>
        <div className="text-sm font-bold">
          {game.emoji} {game.name}
        </div>
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
