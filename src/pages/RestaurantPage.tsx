import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { GAMES, prefetchGame } from "../games";
import GameThumb from "../components/GameThumb";
import {
  availablePlays,
  CHIP_COST,
  getChips,
  getRestaurant,
  redeemTableCode,
} from "../lib/store";
import { play } from "../lib/sound";

/** Foto com skeleton shimmer enquanto carrega. */
function FoodPhoto({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
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

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Ícone próprio por jogo: roleta, raspadinha, quiz, memória. */
const GAME_ICONS: Record<string, React.ReactNode> = {
  roleta: (
    <svg {...iconProps} className="h-6 w-6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18" />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  ),
  raspadinha: (
    <svg {...iconProps} className="h-6 w-6">
      <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
      <path d="m7.5 15 4-6M11 15.5l4.5-7M14.5 15.5l3-4.5" />
    </svg>
  ),
  quiz: (
    <svg {...iconProps} className="h-6 w-6">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H13l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
      <path d="M10.2 8.3a2 2 0 0 1 3.8.7c0 1.3-1.9 1.5-1.9 2.6" />
      <path d="M12.1 13.7h.01" />
    </svg>
  ),
  memoria: (
    <svg {...iconProps} className="h-6 w-6">
      <rect x="4" y="6.5" width="9.5" height="13" rx="1.8" />
      <path d="M8.75 11.5v3M7.25 13h3" />
      <path d="M9.5 6.5V5.4a1.9 1.9 0 0 1 1.9-1.9H18a1.9 1.9 0 0 1 1.9 1.9v9.2a1.9 1.9 0 0 1-1.9 1.9h-1.5" />
    </svg>
  ),
};

function Star({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.6l2.85 5.9 6.4.9-4.66 4.6 1.12 6.5L12 17.4l-5.71 3.1 1.12-6.5L2.75 9.4l6.4-.9L12 2.6Z" />
    </svg>
  );
}

export default function RestaurantPage() {
  const { restaurantId = "" } = useParams();
  const restaurant = getRestaurant(restaurantId);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [chancesAbertas, setChancesAbertas] = useState(false);
  const [params, setParams] = useSearchParams();
  const [, forceUpdate] = useState(0);

  // Chegou pelo QR do cartão da mesa (`?c=CODIGO`): credita sozinho. Digitar
  // seis caracteres sentado à mesa era o maior atrito do fluxo inteiro, e o
  // cartão já é físico — quem o tem na mão está no salão.
  const codigoDoQr = params.get("c");
  const jaCreditou = useRef(false);
  useEffect(() => {
    if (!codigoDoQr || jaCreditou.current) return;
    jaCreditou.current = true;
    const r = redeemTableCode(codigoDoQr);
    play(r.ok ? "coupon" : "wrong");
    setMsg({ ok: r.ok, text: r.message });
    // Tira o código da URL: recarregar a página não pode tentar de novo nem
    // deixar o aviso preso na tela para sempre.
    setParams({}, { replace: true });
    forceUpdate((n) => n + 1);
  }, [codigoDoQr, setParams]);

  if (!restaurant)
    return <div className="p-5 text-sm text-ink/70">Restaurante não encontrado.</div>;
  const plays = availablePlays(restaurant.id);
  const chips = getChips();
  const pesoTotal = restaurant.prizes.reduce((s, p) => s + p.weight, 0);

  const redeem = () => {
    if (!code.trim()) return;
    const r = redeemTableCode(code);
    play(r.ok ? "coupon" : "wrong");
    setMsg({ ok: r.ok, text: r.message });
    setCode("");
    forceUpdate((n) => n + 1);
  };


  return (
    <div>
      {/* Hero com foto do restaurante */}
      <div className="relative h-48">
        <FoodPhoto src={restaurant.photo} alt={restaurant.name} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <Link
          to="/"
          aria-label="Voltar"
          className="press absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-lg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
        <div className="anim-fade-up absolute inset-x-0 bottom-0 p-5">
          <h1 className="font-display text-[26px] font-bold leading-tight text-white">
            {restaurant.name}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink shadow-md">
              <Star className="h-3 w-3 text-accent2" />
              {restaurant.rating.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-white/85">
              {restaurant.cuisine} · {restaurant.neighborhood}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-5">
        {/* Jogadas + resgate de código */}
        <div
          className="anim-fade-up rounded-card bg-white p-5 shadow-md"
          style={{ animationDelay: "80ms" }}
        >
          {/* O topo da tela mostra FICHAS e aqui mostrava JOGADAS: duas unidades
              pra mesma coisa confundem. O número grande agora é o mesmo do HUD,
              com a conversão escrita embaixo. */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink/65">
                Suas fichas
              </span>
              <p className="mt-0.5 text-xs text-ink/65">
                {plays > 0
                  ? `Dá pra ${plays} ${plays === 1 ? "jogada" : "jogadas"} · ${CHIP_COST} fichas cada`
                  : `Cada jogada custa ${CHIP_COST} fichas — o código da mesa repõe`}
              </p>
            </div>
            <span className="font-display text-5xl font-bold leading-none tabular-nums text-brand-500">
              {chips}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            {/* Este é o campo que TODO cliente usa, sentado à mesa, digitando
                6 caracteres num teclado de celular. Sem estes atributos o iOS
                autocapitaliza como frase, sugere correção e o "Enter" não vira
                ação — o mesmo tratamento que o campo do caixa já tinha. */}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && redeem()}
              placeholder="Código da mesa"
              aria-label="Código da mesa"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-sm font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/65 focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={redeem}
              className="press min-h-11 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors active:bg-brand-700"
            >
              Resgatar
            </button>
          </div>
          {msg && (
            <p
              className={`anim-pop mt-2.5 text-[13px] font-semibold ${
                msg.ok ? "text-brand-600" : "text-ink/70"
              }`}
            >
              {msg.text}
            </p>
          )}
        </div>

        {/* Onde fica. O cupom só vale nesta casa e dura 24h — quem ganha jogando
            de casa precisa saber pra onde ir. O link abre o mapa do aparelho. */}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${restaurant.name}, ${restaurant.address}, ${restaurant.neighborhood}, Natal RN`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => play("tap")}
          className="press anim-fade-up mt-3 flex items-center gap-3 rounded-card bg-white p-4 shadow-sm"
          style={{ animationDelay: "100ms" }}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
            >
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-ink">{restaurant.address}</span>
            <span className="mt-0.5 block text-[11px] text-ink/70">
              {restaurant.neighborhood} · toque pra abrir no mapa
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-ink/65"
          >
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </a>

        {/* Prêmios e chances, do lado do JOGADOR. O painel do parceiro já
            mostrava isso ao dono; esconder do cliente seria a lógica de
            cassino, e o app se apresenta como o contrário disso. Mesmos
            números, calculados dos pesos do sorteio. */}
        <div className="anim-fade-up mt-7" style={{ animationDelay: "120ms" }}>
          <button
            type="button"
            onClick={() => {
              play("tap");
              setChancesAbertas((v) => !v);
            }}
            aria-expanded={chancesAbertas}
            className="press flex min-h-11 w-full items-center justify-between gap-3 rounded-card bg-white px-4 shadow-sm"
          >
            <span className="text-left">
              <span className="block font-display text-[15px] font-bold">
                Prêmios desta casa
              </span>
              <span className="mt-0.5 block text-[11px] text-ink/70">
                Veja a chance real de cada um
              </span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-ink/65 transition-transform ${
                chancesAbertas ? "rotate-180" : ""
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {chancesAbertas && (
            <ul className="anim-fade-up mt-2 divide-y divide-ink/10 rounded-card bg-white px-4 shadow-sm">
              {restaurant.prizes.map((p) => {
                const chance = pesoTotal > 0 ? Math.round((p.weight / pesoTotal) * 100) : 0;
                const semPremio = p.tier === "none";
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span
                      className={`min-w-0 flex-1 truncate text-[13px] ${
                        semPremio ? "text-ink/70" : "font-semibold text-ink"
                      }`}
                    >
                      {p.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${
                        semPremio
                          ? "bg-surface text-ink/70"
                          : p.tier === "big"
                            ? "bg-accent2/15 text-[#8a5a00]"
                            : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      {chance}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Jogos */}
        <div
          className="anim-fade-up mb-3 mt-7 flex items-baseline justify-between"
          style={{ animationDelay: "140ms" }}
        >
          <h2 className="font-display text-lg font-bold tracking-tight">Escolha seu jogo</h2>
          <span className="text-xs font-semibold text-ink/65">{GAMES.length} jogos</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g, i) => (
            <Link
              key={g.id}
              to={`/r/${restaurant.id}/jogar/${g.id}`}
              onPointerDown={() => prefetchGame(g.id)}
              onClick={() => play("tap")}
              className="anim-fade-up press overflow-hidden rounded-card bg-white shadow-md"
              style={{ animationDelay: `${180 + i * 70}ms` }}
            >
              <div className="h-24">
                <GameThumb id={g.id} />
              </div>
              <div className="p-3">
                <div className="font-display text-[15px] font-bold leading-snug">{g.name}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-ink/70">{g.tagline}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
