import { useState } from "react";
import { getCoupons, getRestaurant, redeemCoupon } from "../lib/store";

export default function Wallet() {
  const [, forceUpdate] = useState(0);
  const coupons = getCoupons();
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-black">🎟️ Meus Cupons</h1>
      {coupons.length === 0 && (
        <p className="text-sm text-white/50">Nenhum cupom ainda. Vá jogar! 🎡</p>
      )}
      <div className="grid gap-3">
        {coupons.map((c) => {
          const r = getRestaurant(c.restaurantId);
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 ${
                c.redeemedAt ? "border-white/10 opacity-50" : "border-brand-500 bg-brand-900/30"
              }`}
            >
              <div className="text-sm font-bold">
                {r?.emoji} {r?.name}
              </div>
              <div className="text-sm">{c.prizeLabel}</div>
              <div className="my-1 text-xl font-black tracking-widest text-brand-500">{c.code}</div>
              {c.redeemedAt ? (
                <div className="text-xs text-white/50">✔ Usado</div>
              ) : (
                <button
                  className="mt-1 rounded-lg border border-white/20 px-3 py-1 text-xs"
                  onClick={() => {
                    redeemCoupon(c.id);
                    forceUpdate((n) => n + 1);
                  }}
                >
                  Marcar como usado
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
