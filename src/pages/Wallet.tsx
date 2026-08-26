import { useState } from "react";
import { getCoupons, getRestaurant, redeemCoupon } from "../lib/store";

export default function Wallet() {
  const [, forceUpdate] = useState(0);
  const coupons = getCoupons();
  const active = coupons.filter((c) => !c.redeemedAt).length;

  return (
    <div>
      {/* Cabeçalho editorial */}
      <div className="border-b border-ink/10 px-5 pb-7 pt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
          Carteira
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Meus cupons</h1>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/60">
          {active > 0 ? (
            <>
              Você tem <span className="font-semibold text-brand-600">{active}</span>{" "}
              {active === 1 ? "cupom pronto" : "cupons prontos"} para usar. Apresente o código
              ao garçom.
            </>
          ) : (
            "Seus prêmios aparecem aqui, prontos para apresentar ao garçom."
          )}
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {coupons.length === 0 && (
          <div className="rounded-card border border-dashed border-ink/20 bg-white p-8 text-center">
            <p className="font-display text-base font-semibold text-ink/70">Nenhum cupom ainda</p>
            <p className="mt-1 text-xs text-ink/40">
              Escolha um restaurante e jogue — o prêmio cai direto aqui.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {coupons.map((c) => {
            const r = getRestaurant(c.restaurantId);
            const used = Boolean(c.redeemedAt);
            const accent = r?.accent ?? "#5f8296";
            return (
              <div
                key={c.id}
                className="relative overflow-hidden rounded-card border border-ink/10 bg-white shadow-sm"
                style={used ? undefined : { borderLeft: `3px solid ${accent}` }}
              >
                {/* Parte de cima do ticket: restaurante + prêmio */}
                <div className={`p-4 pb-3 ${used ? "opacity-40" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50">
                      {r?.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-ink/35">
                      {new Date(c.wonAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-lg font-semibold leading-snug">
                    {c.prizeLabel}
                  </div>
                </div>

                {/* Linha de recorte: tracejado + notches circulares */}
                <div className="relative flex items-center">
                  <div className="absolute -left-3 h-6 w-6 rounded-full border-r border-ink/10 bg-paper" />
                  <div className="mx-4 flex-1 border-t border-dashed border-ink/20" />
                  <div className="absolute -right-3 h-6 w-6 rounded-full border-l border-ink/10 bg-paper" />
                </div>

                {/* Parte de baixo: código + ação */}
                <div className={`flex items-center justify-between gap-3 p-4 pt-3 ${used ? "opacity-40" : ""}`}>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/40">
                      Código do cupom
                    </div>
                    <div
                      className={`mt-0.5 font-display text-2xl font-bold tracking-[0.15em] ${
                        used ? "text-ink/60" : "text-brand-600"
                      }`}
                    >
                      {c.code}
                    </div>
                  </div>
                  {!used && (
                    <button
                      className="shrink-0 rounded-card border border-ink/15 bg-white px-3 py-2 text-xs font-semibold text-ink/70 transition-colors active:bg-surface"
                      onClick={() => {
                        redeemCoupon(c.id);
                        forceUpdate((n) => n + 1);
                      }}
                    >
                      Marcar usado
                    </button>
                  )}
                </div>

                {/* Carimbo de usado */}
                {used && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="-rotate-12 border-2 border-accent2/30 px-4 py-1 font-display text-xl font-bold uppercase tracking-[0.25em] text-accent2/40">
                      Usado
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
