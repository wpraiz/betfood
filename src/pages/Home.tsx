import { Link } from "react-router-dom";
import { getRestaurants } from "../lib/store";

export default function Home() {
  const restaurants = getRestaurants();
  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="border-b border-ink/10 px-5 pb-8 pt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
          Natal · Rio Grande do Norte
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Bet<span className="text-brand-600">Food</span>
        </h1>
        <p className="mt-3 max-w-[34ch] font-display text-[15px] leading-relaxed text-ink/60">
          Jogue enquanto espera e ganhe recompensas de verdade nas melhores casas da cidade.
        </p>
      </div>

      {/* Lista de restaurantes */}
      <div className="px-5 pb-4 pt-7">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Casas parceiras
          </h2>
          <span className="text-[11px] font-semibold text-ink/30">{restaurants.length}</span>
        </div>
        <div className="grid gap-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              to={`/r/${r.id}`}
              className="group flex items-center gap-4 rounded-card border border-ink/10 bg-white p-4 shadow-sm transition-colors active:bg-surface"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center border font-display text-lg font-bold"
                style={{ borderColor: `${r.accent}66`, color: r.accent }}
              >
                {r.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[17px] font-semibold">{r.name}</div>
                <div className="mt-0.5 text-xs text-ink/50">
                  {r.cuisine} · {r.neighborhood}
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-ink/35">{r.description}</div>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="h-4 w-4 shrink-0 text-ink/25 transition-transform group-active:translate-x-0.5"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
        <p className="mt-7 text-center text-[11px] leading-relaxed text-ink/35">
          Uma jogada de cortesia por dia em cada casa.
          <br />
          Códigos da mesa liberam jogadas extras.
        </p>
      </div>
    </div>
  );
}
