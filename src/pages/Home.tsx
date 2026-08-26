import { Link } from "react-router-dom";
import { getRestaurants } from "../lib/store";

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="mb-1 text-2xl font-black">BetFood</h1>
      <p className="mb-6 text-sm text-white/60">
        Jogue nos restaurantes parceiros de Natal e ganhe cupons de verdade.
      </p>
      <div className="grid gap-3">
        {getRestaurants().map((r) => (
          <Link
            key={r.id}
            to={`/r/${r.id}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="text-2xl">{r.emoji}</div>
            <div className="font-bold">{r.name}</div>
            <div className="text-xs text-white/50">
              {r.cuisine} · {r.neighborhood}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
