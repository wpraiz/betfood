import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GAMES } from "../games";
import { getRestaurants } from "../lib/store";
import { play } from "../lib/sound";
import type { Restaurant } from "../lib/types";
import GameThumb, { WHEEL_GRADIENT } from "../components/GameThumb";
import FoodPhoto, { thumb } from "../components/FoodPhoto";

const LAST_CASA_KEY = "betfood-last-casa";

function Star({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.6l2.85 5.9 6.4.9-4.66 4.6 1.12 6.5L12 17.4l-5.71 3.1 1.12-6.5L2.75 9.4l6.4-.9L12 2.6Z" />
    </svg>
  );
}

/* --- Roleta-herói: roda viva com luzes de marquee ------------------------ */

function HeroWheel() {
  return (
    <div className="relative mx-auto h-44 w-44">
      {/* luzes de marquee piscando em volta */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-full bg-accent2"
            style={{
              left: `calc(50% + ${Math.sin(a) * 88}px - 5px)`,
              top: `calc(50% - ${Math.cos(a) * 88}px - 5px)`,
              animation: `marquee-blink 0.9s ease-in-out infinite`,
              animationDelay: `${(i % 2) * 0.45}s`,
            }}
          />
        );
      })}
      {/* aro + roda girando devagar */}
      <div className="anim-glow absolute inset-2 rounded-full border-4 border-ink/90">
        <div
          className="anim-spin-slow h-full w-full rounded-full"
          style={{ background: WHEEL_GRADIENT }}
        />
      </div>
      {/* miolo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-brand-500 shadow-lg">
          <span className="font-display text-lg font-black text-white">B</span>
        </div>
      </div>
      {/* ponteiro */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-0 w-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-ink drop-shadow" />
      </div>
    </div>
  );
}

/* --- Página -------------------------------------------------------------- */

export default function Home() {
  const navigate = useNavigate();
  const restaurants = getRestaurants();
  const [pickerGame, setPickerGame] = useState<string | null>(null);

  function playGame(gameId: string) {
    play("tap");
    const last = localStorage.getItem(LAST_CASA_KEY);
    if (last && restaurants.some((r) => r.id === last)) {
      navigate(`/r/${last}/jogar/${gameId}`);
    } else {
      setPickerGame(gameId);
    }
  }

  function pickCasa(r: Restaurant) {
    if (!pickerGame) return;
    play("tap");
    localStorage.setItem(LAST_CASA_KEY, r.id);
    navigate(`/r/${r.id}/jogar/${pickerGame}`);
  }

  const lastCasa = restaurants.find((r) => r.id === localStorage.getItem(LAST_CASA_KEY));

  return (
    <div>
      {/* HERÓI: roleta viva */}
      <button
        onClick={() => playGame("roleta")}
        className="anim-fade-up press block w-full bg-gradient-to-b from-brand-50 via-paper to-paper px-5 pb-6 pt-5 text-center"
      >
        <HeroWheel />
        <h1 className="mt-4 font-display text-3xl font-black leading-none tracking-tight">
          Roleta <span className="text-brand-500">BetFood</span>
        </h1>
        <p className="mt-1.5 text-sm font-medium text-ink/70">
          Gire por prêmios de verdade · 10 fichas
        </p>
        <span className="anim-glow mt-4 inline-block rounded-full bg-brand-500 px-10 py-3.5 font-display text-base font-black uppercase tracking-wide text-white">
          Girar agora
        </span>
      </button>

      {/* JOGOS */}
      <div className="px-5 pt-4">
        <div className="anim-fade-up mb-3 flex items-baseline justify-between" style={{ animationDelay: "80ms" }}>
          <h2 className="font-display text-lg font-bold tracking-tight">Jogos</h2>
          {lastCasa && (
            <span className="text-[11px] font-semibold text-ink/65">
              jogando em {lastCasa.name}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g, i) => (
            <button
              key={g.id}
              onClick={() => playGame(g.id)}
              className="anim-fade-up press overflow-hidden rounded-card bg-white text-left shadow-md"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className="h-24">
                <GameThumb id={g.id} />
              </div>
              <div className="p-3">
                <div className="font-display text-[15px] font-bold leading-tight">{g.name}</div>
                <div className="mt-0.5 text-[11px] text-ink/65">{g.tagline}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CASAS PARCEIRAS */}
      <div className="px-5 pb-4 pt-7">
        <div className="anim-fade-up mb-3 flex items-baseline justify-between" style={{ animationDelay: "300ms" }}>
          <h2 className="font-display text-lg font-bold tracking-tight">Onde resgatar</h2>
          <span className="text-xs font-semibold text-ink/65">
            {restaurants.length} casas de exemplo
          </span>
        </div>
        <div className="grid gap-4">
          {restaurants.map((r, i) => {
            const big = r.prizes.find((p) => p.tier === "big");
            return (
              <Link
                key={r.id}
                to={`/r/${r.id}`}
                onClick={() => play("tap")}
                className="anim-fade-up press block overflow-hidden rounded-card bg-white shadow-md"
                style={{ animationDelay: `${340 + i * 70}ms` }}
              >
                <div className="relative">
                  <FoodPhoto src={r.photo} alt={r.name} className="h-36" priority={i === 0} />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Casa exemplo
                  </span>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-ink shadow-md">
                    <Star className="h-3 w-3 text-accent2" />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink">
                    {r.cuisine}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="truncate font-display text-[16px] font-bold">{r.name}</h3>
                    <span className="shrink-0 text-xs font-medium text-ink/65">{r.neighborhood}</span>
                  </div>
                  {big && (
                    <div className="mt-1.5 text-[13px]">
                      <span className="text-ink/70">Prêmio máximo: </span>
                      <span className="font-bold text-brand-600">{big.label}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Picker de casa (bottom sheet) */}
      {pickerGame && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50" onClick={() => setPickerGame(null)}>
          <div
            className="anim-fade-up w-full max-w-md rounded-t-3xl bg-white p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
            <h3 className="mb-3 font-display text-lg font-bold">Jogar em qual casa?</h3>
            <div className="grid gap-2">
              {restaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => pickCasa(r)}
                  className="press flex items-center gap-3 rounded-card border border-ink/10 p-2.5 text-left"
                >
                  <FoodPhoto
                    src={thumb(r.photo, 160)}
                    alt={r.name}
                    className="h-11 w-11 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{r.name}</div>
                    <div className="text-[11px] text-ink/65">{r.neighborhood}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/70">
                    <Star className="h-3 w-3 text-accent2" />
                    {r.rating.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
