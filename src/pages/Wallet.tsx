import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCoupons, getRestaurant, redeemCoupon } from "../lib/store";
import { play } from "../lib/sound";
import FoodPhoto, { thumb } from "../components/FoodPhoto";
import HowItWorks from "../components/HowItWorks";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.9" />
      <path d="M12 17.1h.01" />
    </svg>
  );
}

/**
 * Validade do cupom (24h após o ganho). `expiresAt` é opcional no tipo — cupom
 * antigo, salvo antes do campo existir, simplesmente não mostra validade.
 */
function expiryInfo(expiresAt: string | undefined, now: number) {
  if (!expiresAt) return null;
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return null;
  if (at <= now) return { expired: true, label: "Expirado" };

  const d = new Date(at);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dia = d.toDateString();
  const quando =
    dia === new Date(now).toDateString()
      ? "hoje"
      : dia === new Date(now + 86400000).toDateString()
        ? "amanhã"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { expired: false, label: `Vale até ${hora} de ${quando}` };
}

export default function Wallet() {
  const [, forceUpdate] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  // Cupom vence em 24h: sem este tick a tela mostraria "Vale até" pra sempre em
  // quem deixou o app aberto.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const coupons = getCoupons();
  const active = coupons.filter(
    (c) => !c.redeemedAt && !expiryInfo(c.expiresAt, now)?.expired
  ).length;

  return (
    <div>
      {/* Cabeçalho com contador de cupons ativos */}
      <div className="border-b border-ink/10 px-5 pb-7 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
              Carteira
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Meus cupons</h1>
          </div>
          <div className="anim-pop shrink-0 rounded-card bg-brand-50 px-4 py-2.5 text-center">
            <div className="font-display text-3xl font-bold leading-none tabular-nums text-brand-600">
              {active}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-brand-700/70">
              {active === 1 ? "ativo" : "ativos"}
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/70">
          {active > 0
            ? "Prêmio ganho é prêmio seu. Mostra o código pro garçom — vale 24h, só na casa que emitiu."
            : "Seus prêmios caem aqui, prontos pra usar."}
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {/* Empty state ilustrado */}
        {coupons.length === 0 && (
          <div className="anim-fade-up rounded-card border border-dashed border-ink/20 bg-white px-6 py-10 text-center">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-16 w-16 text-ink/25"
            >
              <path d="M5 20v-3a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v3a4 4 0 0 0 0 8v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a4 4 0 0 0 0-8Z" />
              <path d="M31 15v3M31 22.5v3M31 30v3" />
              <path d="m16 20.5 1.5 2.8 3.1.5-2.2 2.2.5 3.1-2.9-1.5-2.9 1.5.5-3.1-2.2-2.2 3.1-.5z" />
            </svg>
            <p className="mt-4 font-display text-lg font-bold">Nenhum cupom ainda</p>
            <p className="mx-auto mt-1 max-w-[28ch] text-xs leading-relaxed text-ink/70">
              Escolhe uma casa, joga e o prêmio cai direto aqui.
            </p>
            <Link
              to="/"
              className="press mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 text-sm font-bold text-white transition-colors active:bg-brand-600"
            >
              Ir jogar
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {coupons.map((c, i) => {
            const r = getRestaurant(c.restaurantId);
            const used = Boolean(c.redeemedAt);
            const info = expiryInfo(c.expiresAt, now);
            // "Expirado" é um estado próprio: cupom que venceu SEM ter sido
            // usado. Quem já usou continua mostrando só "Usado".
            const expired = !used && Boolean(info?.expired);
            // opacity forte derruba o contraste abaixo de AA (medido 2,45 num
            // caso equivalente no painel). O cupom gasto fica discreto por
            // saturação/carimbo, não por transparência que apaga o texto.
            const dim = used ? "opacity-70" : expired ? "opacity-75" : "";
            const stripe = used ? "#dedbda" : expired ? "#a9a4a2" : "#e31b28";
            return (
              <div
                key={c.id}
                className="anim-fade-up relative overflow-hidden rounded-card bg-white shadow-sm"
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
              >
                {/* Faixa lateral: cor da marca quando vale, cinza quando não */}
                <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} />

                {/* Restaurante + prêmio */}
                <div className={dim}>
                  <div className="flex items-center gap-3 p-4 pb-2.5 pl-5">
                    {/* alt vazio: o nome da casa está no texto ao lado. */}
                    {r && (
                      <FoodPhoto
                        src={thumb(r.photo, 160)}
                        alt=""
                        className="h-11 w-11 rounded-full"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{r?.name}</div>
                      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/65">
                        {new Date(c.wonAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 pl-5 font-display text-lg font-bold leading-snug">
                    {c.prizeLabel}
                  </div>
                </div>

                {/* Validade — fora do bloco esmaecido pra continuar legível */}
                {!used && info && (
                  <div className="px-4 pb-3 pl-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        expired ? "bg-surface text-ink/70" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      {info.label}
                    </span>
                  </div>
                )}

                {/* Linha de recorte: tracejado + notches */}
                <div className="relative flex items-center">
                  <div className="absolute -left-3 h-6 w-6 rounded-full bg-paper" />
                  <div className="mx-4 ml-5 flex-1 border-t-2 border-dashed border-ink/10" />
                  <div className="absolute -right-3 h-6 w-6 rounded-full bg-paper" />
                </div>

                {/* Código + ação */}
                <div className={`flex items-end justify-between gap-3 p-4 pl-5 pt-3 ${dim}`}>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/65">
                      Código do cupom
                    </div>
                    <div
                      className={`mt-0.5 font-display text-3xl font-bold tracking-[0.12em] ${
                        used || expired ? "text-ink/70" : "text-brand-600"
                      }`}
                    >
                      {c.code}
                    </div>
                  </div>
                  {!used && !expired && (
                    <button
                      className="press inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white px-4 text-xs font-bold text-ink/70 transition-colors active:bg-surface"
                      onClick={() => {
                        play("tap");
                        redeemCoupon(c.id);
                        forceUpdate((n) => n + 1);
                      }}
                    >
                      Marcar usado
                    </button>
                  )}
                </div>

                {/* Carimbo: "Usado" (vermelho) e "Expirado" (tinta) são estados
                    diferentes e têm carimbos diferentes de propósito. */}
                {(used || expired) && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span
                      className={`-rotate-12 rounded-md border-[3px] px-4 py-1 font-display text-2xl font-bold uppercase tracking-[0.3em] ${
                        used
                          ? "border-brand-600/35 text-brand-600/40"
                          : "border-ink/25 text-ink/60"
                      }`}
                    >
                      {used ? "Usado" : "Expirado"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rodapé: regra do cupom sempre a um toque, sem beco sem saída */}
      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => {
            play("tap");
            setHelpOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={helpOpen}
          className="press mx-auto flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold text-ink/70 active:bg-surface"
        >
          <HelpIcon className="h-4 w-4" />
          Como funciona / regras do cupom
        </button>
      </div>

      <HowItWorks open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
