import { useState } from "react";
import { getCoupons, getRestaurant, redeemCoupon } from "../lib/store";

export default function Wallet() {
  const [, forceUpdate] = useState(0);
  const coupons = getCoupons();
  const active = coupons.filter((c) => !c.redeemedAt).length;

  return (
    <div className="p-4">
      <h1 className="mb-1 text-2xl font-black">🎟️ Meus Cupons</h1>
      <p className="mb-5 text-sm text-white/60">
        {active > 0 ? (
          <>
            Você tem <span className="font-bold text-brand-500">{active}</span>{" "}
            {active === 1 ? "cupom pronto" : "cupons prontos"} pra usar. Mostre o código ao garçom!
          </>
        ) : (
          "Seus prêmios aparecem aqui, prontos pra mostrar ao garçom."
        )}
      </p>

      {coupons.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
          <div className="mb-2 text-4xl">🎡</div>
          <p className="text-sm font-semibold text-white/70">Nenhum cupom ainda</p>
          <p className="mt-1 text-xs text-white/40">
            Escolha um restaurante e jogue — o prêmio cai direto aqui.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {coupons.map((c) => {
          const r = getRestaurant(c.restaurantId);
          const used = Boolean(c.redeemedAt);
          const accent = r?.accent ?? "#f97316";
          return (
            <div
              key={c.id}
              className={`relative overflow-hidden rounded-2xl border ${
                used ? "border-white/10 bg-white/[0.03]" : "bg-brand-900/25"
              }`}
              style={
                used
                  ? undefined
                  : { borderColor: `${accent}66`, boxShadow: `0 0 28px -10px ${accent}55` }
              }
            >
              {/* Parte de cima do ticket: restaurante + prêmio */}
              <div className={`p-4 pb-3 ${used ? "opacity-45" : ""}`}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-lg">{r?.emoji}</span>
                  <span className="truncate">{r?.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    {new Date(c.wonAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="mt-1 text-base font-semibold" style={used ? undefined : { color: "#ffedd5" }}>
                  🎁 {c.prizeLabel}
                </div>
              </div>

              {/* Linha de recorte: tracejado + notches circulares */}
              <div className="relative flex items-center">
                <div className="absolute -left-3 h-6 w-6 rounded-full bg-ink" />
                <div className="mx-4 flex-1 border-t-2 border-dashed border-white/15" />
                <div className="absolute -right-3 h-6 w-6 rounded-full bg-ink" />
              </div>

              {/* Parte de baixo: código + ação */}
              <div className={`flex items-center justify-between gap-3 p-4 pt-3 ${used ? "opacity-45" : ""}`}>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    Código do cupom
                  </div>
                  <div
                    className="font-mono text-2xl font-black tracking-[0.25em]"
                    style={{ color: used ? undefined : accent }}
                  >
                    {c.code}
                  </div>
                </div>
                {!used && (
                  <button
                    className="shrink-0 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors active:bg-white/10"
                    onClick={() => {
                      redeemCoupon(c.id);
                      forceUpdate((n) => n + 1);
                    }}
                  >
                    Marcar usado ✔
                  </button>
                )}
              </div>

              {/* Carimbo de usado */}
              {used && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="-rotate-12 rounded-lg border-4 border-white/25 px-4 py-1 text-xl font-black uppercase tracking-widest text-white/25">
                    Usado
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
