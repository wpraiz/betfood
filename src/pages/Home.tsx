import { Link } from "react-router-dom";
import { getRestaurants } from "../lib/store";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-700/40 to-transparent px-4 pb-8 pt-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 top-8 h-32 w-32 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-100">
            🌴 Natal/RN
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Bet<span className="text-brand-500">Food</span>
          </h1>
          <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-white/70">
            Jogue na mesa, ganhe na hora.{" "}
            <span className="font-semibold text-brand-100">Cupons de verdade</span> nos restaurantes
            parceiros de Natal. 🎁
          </p>
        </div>
      </div>

      {/* Lista de restaurantes */}
      <div className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Restaurantes parceiros
          </h2>
          <span className="text-xs font-semibold text-brand-500">
            {getRestaurants().length} casas
          </span>
        </div>
        <div className="grid gap-3">
          {getRestaurants().map((r) => (
            <Link
              key={r.id}
              to={`/r/${r.id}`}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-white/5 p-4 transition-transform active:scale-[0.98]"
              style={{
                borderColor: `${r.accent}55`,
                boxShadow: `0 0 24px -8px ${r.accent}40, inset 0 1px 0 rgba(255,255,255,0.06)`,
              }}
            >
              {/* faixa de accent */}
              <div
                className="absolute inset-y-0 left-0 w-1 rounded-r"
                style={{ background: r.accent }}
              />
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ background: `${r.accent}22` }}
              >
                {r.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-bold">{r.name}</span>
                  <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-500">
                    parceiro
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-white/50">
                  {r.cuisine} · 📍 {r.neighborhood}
                </div>
                <div className="mt-1 line-clamp-1 text-xs text-white/40">{r.description}</div>
              </div>
              <span
                className="shrink-0 text-lg transition-transform group-active:translate-x-0.5"
                style={{ color: r.accent }}
              >
                ›
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-white/30">
          1 jogada grátis por dia em cada casa · códigos da mesa liberam extras 🎲
        </p>
      </div>
    </div>
  );
}
