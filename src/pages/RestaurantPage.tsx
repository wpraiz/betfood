import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GAMES } from "../games";
import { availablePlays, getRestaurant, redeemTableCode } from "../lib/store";

export default function RestaurantPage() {
  const { restaurantId = "" } = useParams();
  const restaurant = getRestaurant(restaurantId);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  if (!restaurant) return <div className="p-4">Restaurante não encontrado.</div>;
  const plays = availablePlays(restaurant.id);

  return (
    <div className="p-4">
      <Link to="/" className="text-sm text-white/50">
        ← voltar
      </Link>
      <div className="my-4">
        <div className="text-4xl">{restaurant.emoji}</div>
        <h1 className="text-xl font-black">{restaurant.name}</h1>
        <p className="text-sm text-white/60">{restaurant.description}</p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 text-sm font-bold">
          🎫 Jogadas disponíveis: <span className="text-brand-500">{plays}</span>
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código da mesa"
            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm uppercase"
          />
          <button
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold"
            onClick={() => {
              const r = redeemTableCode(code);
              setMsg(r.message);
              setCode("");
              forceUpdate((n) => n + 1);
            }}
          >
            Resgatar
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-white/70">{msg}</p>}
      </div>

      <h2 className="mb-2 font-bold">Escolha seu jogo</h2>
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to={`/r/${restaurant.id}/jogar/${g.id}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <div className="text-3xl">{g.emoji}</div>
            <div className="text-sm font-bold">{g.name}</div>
            <div className="text-[11px] text-white/50">{g.tagline}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
