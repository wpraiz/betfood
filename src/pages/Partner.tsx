import { useState } from "react";
import { generateTableCodes, getRestaurants, getTableCodes } from "../lib/store";

export default function Partner() {
  const restaurants = getRestaurants();
  const [selected, setSelected] = useState(restaurants[0].id);
  const [, forceUpdate] = useState(0);
  const codes = getTableCodes(selected);

  return (
    <div className="p-4">
      <h1 className="mb-1 text-2xl font-black">🏪 Painel do Parceiro</h1>
      <p className="mb-4 text-sm text-white/60">Gere códigos de mesa pros seus clientes jogarem.</p>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 w-full rounded-xl border border-white/20 bg-ink px-3 py-2"
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.emoji} {r.name}
          </option>
        ))}
      </select>
      <button
        className="mb-4 w-full rounded-xl bg-brand-600 py-3 font-bold"
        onClick={() => {
          generateTableCodes(selected, 5, 3);
          forceUpdate((n) => n + 1);
        }}
      >
        Gerar 5 códigos (3 jogadas cada)
      </button>
      <div className="grid gap-2">
        {codes.map((c) => (
          <div
            key={c.code}
            className={`flex items-center justify-between rounded-xl border border-white/10 px-4 py-2 ${
              c.usedAt ? "opacity-40" : ""
            }`}
          >
            <span className="font-black tracking-widest">{c.code}</span>
            <span className="text-xs text-white/50">
              {c.usedAt ? "usado" : `${c.credits} jogadas`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
