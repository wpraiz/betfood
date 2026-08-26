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

  if (!restaurant)
    return <div className="p-5 text-sm text-ink/50">Restaurante não encontrado.</div>;
  const plays = availablePlays(restaurant.id);

  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="border-b border-ink/10 px-5 pb-7 pt-8">
        <Link
          to="/"
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
          Casas
        </Link>
        <div className="mt-5 flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center border font-display text-xl font-bold"
            style={{ borderColor: `${restaurant.accent}66`, color: restaurant.accent }}
          >
            {restaurant.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">
              {restaurant.name}
            </h1>
            <p className="mt-0.5 text-xs text-ink/50">
              {restaurant.cuisine} · {restaurant.neighborhood}
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-[38ch] font-display text-[15px] leading-relaxed text-ink/60">
          {restaurant.description}
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {/* Jogadas + resgate de código */}
        <div className="rounded-card border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
              Jogadas disponíveis
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-brand-600">
              {plays}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código da mesa"
              className="min-w-0 flex-1 rounded-card border border-ink/15 bg-paper px-3 py-2 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/35 focus:border-brand-500 focus:outline-none"
            />
            <button
              className="rounded-card bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors active:bg-brand-700"
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
          {msg && <p className="mt-2 text-xs text-ink/50">{msg}</p>}
        </div>

        {/* Jogos */}
        <div className="mb-3 mt-7 flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Escolha seu jogo
          </h2>
          <span className="text-[11px] font-semibold text-ink/30">{GAMES.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g) => (
            <Link
              key={g.id}
              to={`/r/${restaurant.id}/jogar/${g.id}`}
              className="group rounded-card border border-ink/10 bg-white p-4 shadow-sm transition-colors active:bg-surface"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 h-5 w-5 text-brand-600"
              >
                <rect x="4" y="4" width="16" height="16" rx="1" />
                <circle cx="9" cy="9" r="0.6" fill="currentColor" />
                <circle cx="15" cy="15" r="0.6" fill="currentColor" />
                <circle cx="15" cy="9" r="0.6" fill="currentColor" />
                <circle cx="9" cy="15" r="0.6" fill="currentColor" />
              </svg>
              <div className="font-display text-[15px] font-semibold leading-snug">{g.name}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-ink/50">{g.tagline}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
