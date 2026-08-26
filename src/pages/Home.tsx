import { useState } from "react";
import { Link } from "react-router-dom";
import { getRestaurants } from "../lib/store";
import { play } from "../lib/sound";

/** Foto com skeleton shimmer enquanto carrega. */
function FoodPhoto({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
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

function Star({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.6l2.85 5.9 6.4.9-4.66 4.6 1.12 6.5L12 17.4l-5.71 3.1 1.12-6.5L2.75 9.4l6.4-.9L12 2.6Z" />
    </svg>
  );
}

function GiftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="4" y="9.5" width="16" height="4" rx="1" />
      <path d="M6 13.5V19a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19v-5.5M12 9.5v11" />
      <path d="M12 9.5c-2 0-4.2-.7-4.2-2.6 0-1.3 1-2.1 2.1-2.1 1.6 0 2.1 2 2.1 4.7 0-2.7.5-4.7 2.1-4.7 1.1 0 2.1.8 2.1 2.1 0 1.9-2.2 2.6-4.2 2.6Z" />
    </svg>
  );
}

function RatingPill({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-bold text-ink shadow-md">
      <Star className="h-3 w-3 text-accent2" />
      {rating.toFixed(1)}
    </span>
  );
}

export default function Home() {
  const restaurants = getRestaurants();
  const featured = restaurants[0];

  return (
    <div>
      {/* Header compacto */}
      <div className="anim-fade-up flex items-baseline justify-between px-5 pb-4 pt-7">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-brand-500">
          BetFood
        </h1>
        <p className="text-xs font-semibold text-ink/45">Jogue na mesa, ganhe no prato</p>
      </div>

      {/* Banner-herói */}
      {featured && (
        <div className="anim-fade-up px-5" style={{ animationDelay: "60ms" }}>
          <Link
            to={`/r/${featured.id}`}
            onClick={() => play("tap")}
            className="press relative block h-52 overflow-hidden rounded-card shadow-lg"
          >
            <FoodPhoto src={featured.photo} alt={featured.name} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="font-display text-3xl font-bold leading-none text-white">
                Jogou, ganhou.
              </h2>
              <p className="mt-1.5 text-sm font-medium text-white/85">
                Prêmios de verdade nas melhores casas de Natal.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white">
                Jogar agora
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Lista de restaurantes */}
      <div className="px-5 pb-4 pt-7">
        <div
          className="anim-fade-up mb-3 flex items-baseline justify-between"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="font-display text-lg font-bold tracking-tight">Casas parceiras</h2>
          <span className="text-xs font-semibold text-ink/35">{restaurants.length} em Natal</span>
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
                style={{ animationDelay: `${160 + i * 70}ms` }}
              >
                <div className="relative">
                  <FoodPhoto src={r.photo} alt={r.name} className="h-40" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute right-3 top-3">
                    <RatingPill rating={r.rating} />
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink">
                    {r.cuisine}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="truncate font-display text-[17px] font-bold">{r.name}</h3>
                    <span className="shrink-0 text-xs font-medium text-ink/45">
                      {r.neighborhood}
                    </span>
                  </div>
                  {big && (
                    <div className="mt-2 flex items-center gap-1.5 text-[13px]">
                      <GiftIcon className="h-4 w-4 shrink-0 text-accent2" />
                      <span className="text-ink/50">Prêmios até:</span>
                      <span className="truncate font-bold text-brand-600">{big.label}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <p
          className="anim-fade-up mt-7 text-center text-xs leading-relaxed text-ink/40"
          style={{ animationDelay: `${160 + restaurants.length * 70}ms` }}
        >
          Uma jogada grátis por dia em cada casa.
          <br />
          Código da mesa libera jogadas extras.
        </p>
      </div>
    </div>
  );
}
