import { useState } from "react";
import {
  generateTableCodes,
  getRestaurantCoupons,
  getRestaurants,
  getTableCodes,
} from "../lib/store";

function Metric({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="text-lg">{emoji}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-brand-50">{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-white/50">{label}</div>
    </div>
  );
}

export default function Partner() {
  const restaurants = getRestaurants();
  const [selected, setSelected] = useState(restaurants[0].id);
  const [qty, setQty] = useState(5);
  const [credits, setCredits] = useState(3);
  const [, forceUpdate] = useState(0);

  const codes = getTableCodes(selected);
  const coupons = getRestaurantCoupons(selected);
  const codesUsed = codes.filter((c) => c.usedAt).length;
  const couponsRedeemed = coupons.filter((c) => c.redeemedAt).length;
  const current = restaurants.find((r) => r.id === selected);

  return (
    <div className="p-4">
      <h1 className="mb-1 text-2xl font-black">🏪 Painel do Parceiro</h1>
      <p className="mb-4 text-sm text-white/60">
        Gere códigos de mesa e acompanhe o movimento da sua casa.
      </p>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-4 w-full rounded-xl border border-white/20 bg-ink px-3 py-2.5 font-semibold"
        style={current ? { borderColor: `${current.accent}66` } : undefined}
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.emoji} {r.name}
          </option>
        ))}
      </select>

      {/* Métricas */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Metric emoji="🎫" label="Códigos gerados" value={codes.length} />
        <Metric emoji="✅" label="Códigos usados" value={codesUsed} />
        <Metric emoji="🎁" label="Cupons ganhos" value={coupons.length} />
        <Metric emoji="🍽️" label="Cupons resgatados" value={couponsRedeemed} />
      </div>

      {/* Gerador */}
      <div className="mb-5 rounded-2xl border border-brand-500/30 bg-brand-900/20 p-4">
        <div className="mb-3 text-sm font-bold text-brand-100">Gerar códigos de mesa</div>
        <div className="mb-3 flex items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Quantidade
            </span>
            <input
              type="number"
              min={1}
              max={50}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-full rounded-xl border border-white/20 bg-ink px-3 py-2 text-center font-black tabular-nums"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
              Jogadas por código
            </span>
            <input
              type="number"
              min={1}
              max={20}
              value={credits}
              onChange={(e) => setCredits(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-full rounded-xl border border-white/20 bg-ink px-3 py-2 text-center font-black tabular-nums"
            />
          </label>
        </div>
        <button
          className="w-full rounded-xl bg-brand-600 py-3 font-bold shadow-lg shadow-brand-600/30 transition-colors active:bg-brand-700"
          onClick={() => {
            generateTableCodes(selected, qty, credits);
            forceUpdate((n) => n + 1);
          }}
        >
          🎲 Gerar {qty} {qty === 1 ? "código" : "códigos"} ({credits}{" "}
          {credits === 1 ? "jogada" : "jogadas"} cada)
        </button>
      </div>

      {/* Lista de códigos */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
          Códigos da casa
        </h2>
        <span className="text-xs font-semibold text-white/40">
          {codesUsed}/{codes.length} usados
        </span>
      </div>
      {codes.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-center text-xs text-white/40">
          Nenhum código gerado ainda — crie a primeira leva acima. 👆
        </p>
      )}
      <div className="grid gap-2">
        {codes.map((c) => (
          <div
            key={c.code}
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
              c.usedAt
                ? "border-white/10 bg-white/[0.02] opacity-45"
                : "border-white/15 bg-white/5"
            }`}
          >
            <span className="font-mono text-lg font-black tracking-[0.2em]">{c.code}</span>
            {c.usedAt ? (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
                ✔ usado
              </span>
            ) : (
              <span className="rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-500">
                {c.credits} jogadas
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
