import { useState } from "react";
import {
  generateTableCodes,
  getRestaurantCoupons,
  getRestaurants,
  getTableCodes,
} from "../lib/store";

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-ink/10 bg-white p-3.5 shadow-sm">
      <div className="font-display text-3xl font-bold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.15em] text-ink/45">
        {label}
      </div>
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

  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="border-b border-ink/10 px-5 pb-7 pt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
          Painel do parceiro
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sua casa</h1>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/60">
          Gere códigos de mesa e acompanhe o movimento da sua casa.
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        <label className="mb-5 block">
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Restaurante
          </span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        {/* Métricas */}
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <Metric label="Códigos gerados" value={codes.length} />
          <Metric label="Códigos usados" value={codesUsed} />
          <Metric label="Cupons ganhos" value={coupons.length} />
          <Metric label="Cupons resgatados" value={couponsRedeemed} />
        </div>

        {/* Gerador */}
        <div className="mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm">
          <div className="mb-3 font-display text-base font-semibold">Gerar códigos de mesa</div>
          <div className="mb-4 flex items-end gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/45">
                Quantidade
              </span>
              <input
                type="number"
                min={1}
                max={50}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-full rounded-card border border-ink/15 bg-paper px-3 py-2 text-center font-display text-lg font-bold tabular-nums focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/45">
                Jogadas por código
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={credits}
                onChange={(e) =>
                  setCredits(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                }
                className="w-full rounded-card border border-ink/15 bg-paper px-3 py-2 text-center font-display text-lg font-bold tabular-nums focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>
          <button
            className="w-full rounded-card bg-brand-600 py-3 text-sm font-semibold text-white transition-colors active:bg-brand-700"
            onClick={() => {
              generateTableCodes(selected, qty, credits);
              forceUpdate((n) => n + 1);
            }}
          >
            Gerar {qty} {qty === 1 ? "código" : "códigos"} ({credits}{" "}
            {credits === 1 ? "jogada" : "jogadas"} cada)
          </button>
        </div>

        {/* Lista de códigos */}
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Códigos da casa
          </h2>
          <span className="text-[11px] font-semibold text-ink/35">
            {codesUsed}/{codes.length} usados
          </span>
        </div>
        {codes.length === 0 && (
          <p className="rounded-card border border-dashed border-ink/20 bg-white p-5 text-center text-xs text-ink/40">
            Nenhum código gerado ainda — crie a primeira leva acima.
          </p>
        )}
        <div className="divide-y divide-ink/10 rounded-card border border-ink/10 bg-white shadow-sm empty:hidden">
          {codes.map((c) => (
            <div
              key={c.code}
              className={`flex items-center justify-between px-4 py-2.5 ${
                c.usedAt ? "opacity-40" : ""
              }`}
            >
              <span className="font-display text-base font-bold tracking-[0.2em]">{c.code}</span>
              {c.usedAt ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/45">
                  Usado
                </span>
              ) : (
                <span className="bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700">
                  {c.credits} {c.credits === 1 ? "jogada" : "jogadas"}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
