import { useState, type ReactNode } from "react";
import {
  generateTableCodes,
  getRestaurantCoupons,
  getRestaurants,
  getTableCodes,
} from "../lib/store";
import { play } from "../lib/sound";

/** Foto com skeleton shimmer enquanto carrega. */
function Photo({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-surface ${
        loaded ? "" : "animate-pulse"
      } ${className}`}
    >
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  chip,
  delay,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  chip: string;
  delay: number;
}) {
  return (
    <div
      className="anim-fade-up rounded-card border border-ink/10 bg-white p-4 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${chip}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
        >
          {icon}
        </svg>
      </div>
      <div className="font-display text-4xl font-bold leading-none tabular-nums text-ink">
        {value}
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.15em] text-ink/45">
        {label}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "press flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm disabled:opacity-30";
  return (
    <div className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/45">
        {label}
      </span>
      <div className="flex items-center justify-between gap-1 rounded-card bg-paper p-1.5">
        <button
          type="button"
          className={btn}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
        <button
          type="button"
          className={btn}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
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
      {/* Cabeçalho */}
      <div className="anim-fade-up border-b border-ink/10 px-5 pb-7 pt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
          Painel do parceiro
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sua casa</h1>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/60">
          Gere códigos de mesa e acompanhe o movimento da sua casa.
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {/* Seletor de restaurante com foto */}
        <div className="anim-fade-up mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
          Restaurante
        </div>
        <div className="anim-fade-up -mx-5 mb-6 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {restaurants.map((r) => {
            const on = r.id === selected;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r.id)}
                className={`press flex shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors ${
                  on ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-white"
                }`}
              >
                <Photo src={r.photo} alt={r.name} className="h-8 w-8 rounded-full" />
                <span
                  className={`whitespace-nowrap text-sm font-semibold ${
                    on ? "text-brand-700" : "text-ink/70"
                  }`}
                >
                  {r.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Métricas */}
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <Metric
            label="Códigos gerados"
            value={codes.length}
            delay={60}
            chip="bg-brand-50 text-brand-600"
            icon={
              <>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <path d="M14 14h3v3h-3zM20 17v3h-3" />
              </>
            }
          />
          <Metric
            label="Códigos usados"
            value={codesUsed}
            delay={130}
            chip="bg-surface text-ink/60"
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
              </>
            }
          />
          <Metric
            label="Cupons ganhos"
            value={coupons.length}
            delay={200}
            chip="bg-accent2/15 text-accent2"
            icon={
              <>
                <path d="M3 11.5v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5Z" />
                <path d="M14 7.5v2M14 12v2M14 16.5v2" />
              </>
            }
          />
          <Metric
            label="Cupons resgatados"
            value={couponsRedeemed}
            delay={270}
            chip="bg-brand-100 text-brand-700"
            icon={
              <path d="m12 3 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 15.6l-5.1 2.8 1.1-5.6L3.8 8.9l5.7-.7z" />
            }
          />
        </div>

        {/* Gerador com steppers */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "340ms" }}
        >
          <div className="mb-4 font-display text-base font-bold">Gerar códigos de mesa</div>
          <div className="mb-4 flex gap-3">
            <Stepper label="Códigos" value={qty} min={1} max={50} onChange={setQty} />
            <Stepper
              label="Jogadas por código"
              value={credits}
              min={1}
              max={20}
              onChange={setCredits}
            />
          </div>
          <button
            className="press w-full rounded-card bg-brand-500 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
            onClick={() => {
              play("tap");
              generateTableCodes(selected, qty, credits);
              forceUpdate((n) => n + 1);
            }}
          >
            Gerar {qty} {qty === 1 ? "código" : "códigos"} · {credits}{" "}
            {credits === 1 ? "jogada" : "jogadas"} cada
          </button>
        </div>

        {/* Lista de códigos */}
        <div
          className="anim-fade-up mb-2 flex items-baseline justify-between"
          style={{ animationDelay: "400ms" }}
        >
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/40">
            Códigos da casa
          </h2>
          <span className="text-[11px] font-semibold text-ink/35">
            {codesUsed}/{codes.length} usados
          </span>
        </div>
        {codes.length === 0 && (
          <p
            className="anim-fade-up rounded-card border border-dashed border-ink/20 bg-white p-5 text-center text-xs text-ink/40"
            style={{ animationDelay: "440ms" }}
          >
            Nenhum código gerado ainda — crie a primeira leva acima.
          </p>
        )}
        <div
          className="anim-fade-up divide-y divide-ink/5 overflow-hidden rounded-card border border-ink/10 bg-white shadow-sm empty:hidden"
          style={{ animationDelay: "440ms" }}
        >
          {codes.map((c) => (
            <div
              key={c.code}
              className={`flex items-center justify-between px-4 py-3 ${
                c.usedAt ? "opacity-40" : ""
              }`}
            >
              <span className="font-display text-base font-bold tracking-[0.2em]">{c.code}</span>
              {c.usedAt ? (
                <span className="rounded-full bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/45">
                  Usado
                </span>
              ) : (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700">
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
