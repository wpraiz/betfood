import { Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { getGame } from "../games";
import { ImmersiveContext } from "../components/Layout";
import type { GameResult } from "../lib/types";
import {
  availablePlays,
  awardCoupon,
  canClaimDailyBonus,
  CHIP_COST,
  claimDailyBonus,
  consumePlay,
  DAILY_BONUS_CHIPS,
  drawPrize,
  getChips,
  getRestaurant,
  msToNextChip,
  REGEN_AMOUNT,
  XP_PER_PLAY,
  XP_PER_WIN,
} from "../lib/store";
import { formatCountdown } from "../components/Hud";
import { isMuted, play, setMuted, stop } from "../lib/sound";

const CONFETTI_COLORS = ["#e31b28", "#f5a623", "#ffffff"];

// Quem joga várias rodadas seguidas ouve a mesma frase toda vez e o app começa
// a soar automático. Sorteadas por rodada; a derrota nunca cobra nem provoca.
const MANCHETES_VITORIA = ["Deu prêmio!", "É seu!", "Ganhou agora", "Boa, saiu prêmio"];
const MANCHETES_DERROTA = ["Não foi dessa vez", "Passou perto", "Ficou pra próxima"];
const CONSOLOS = [
  "A sorte muda rápido por aqui. Respira e vem de novo.",
  "Tem mais ficha chegando — daqui a pouco você tenta outra.",
  "Quem joga de novo costuma sair com alguma coisa.",
  "Sem drama: a próxima rodada é logo ali.",
];

const sorteia = (lista: string[]) => lista[Math.floor(Math.random() * lista.length)];

/** Selo de XP que sobe e some, celebrando o ganho da rodada. */
function XpBadge({ amount }: { amount: number }) {
  return (
    <>
      <style>{`@keyframes xp-float{0%{opacity:0;transform:translateY(10px) scale(.8)}25%{opacity:1;transform:translateY(0) scale(1.08)}75%{opacity:1;transform:translateY(-4px) scale(1)}100%{opacity:0;transform:translateY(-22px) scale(.95)}}`}</style>
      <span
        className="inline-block rounded-full bg-accent2/20 px-3 py-1 text-xs font-black tabular-nums text-[#8a5a00]"
        style={{ animation: "xp-float 2.4s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
      >
        +{amount} XP
      </span>
    </>
  );
}

/** Esqueleto enquanto o chunk do jogo chega — nunca tela branca. */
function GameSkeleton() {
  return (
    <div className="flex flex-col items-center gap-5 px-5 py-4" aria-busy="true" aria-live="polite">
      <div className="h-3 w-40 animate-pulse rounded-full bg-ink/10" />
      <div className="h-64 w-full max-w-[340px] animate-pulse rounded-card bg-ink/10" />
      <div className="h-12 w-full max-w-[280px] animate-pulse rounded-full bg-ink/10" />
      <p className="text-xs font-semibold text-ink/65">Preparando o jogo…</p>
    </div>
  );
}

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

export default function GamePlay() {
  const { restaurantId = "", gameId = "" } = useParams();
  const navigate = useNavigate();
  const restaurant = getRestaurant(restaurantId);
  const game = getGame(gameId);
  const { setImmersive } = useContext(ImmersiveContext);
  const [result, setResult] = useState<GameResult | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  // Sorteadas uma vez por montagem: a frase não pode trocar a cada re-render.
  const [frases] = useState(() => ({
    vitoria: sorteia(MANCHETES_VITORIA),
    derrota: sorteia(MANCHETES_DERROTA),
    consolo: sorteia(CONSOLOS),
  }));
  const [muted, setMutedState] = useState(() => isMuted());

  // Cobrança justa: abrir o jogo é de graça. A ficha só sai quando o jogo chama
  // startPlay() no gesto que inicia a rodada de verdade. Na montagem apenas
  // OLHAMOS o saldo (availablePlays) pra já mostrar "fichas acabaram" a quem
  // não tem como jogar — sem cobrar nada.
  const [noChips, setNoChips] = useState(() => availablePlays(restaurantId) < 1);
  const [chips, setChips] = useState(() => getChips());
  const chargedRef = useRef(false);

  // Sem fichas, a espera precisa ter prazo visível — e o saldo volta sozinho.
  const [nextChip, setNextChip] = useState<string | null>(null);
  useEffect(() => {
    if (!noChips) return;
    const tick = () => {
      const c = getChips();
      setChips(c);
      setNextChip(formatCountdown(msToNextChip()));
      if (c >= CHIP_COST) setNoChips(false); // recarregou: libera o jogo
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [noChips]);

  /**
   * Cobra a rodada uma única vez (o ref sobrevive ao double-render do
   * StrictMode e a chamadas repetidas do jogo). `false` = sem saldo: o jogo não
   * começa e caímos na tela de reposição.
   */
  const startPlay = useCallback(() => {
    if (chargedRef.current) return true;
    if (!consumePlay(restaurantId)) {
      setNoChips(true);
      return false;
    }
    chargedRef.current = true;
    setChips(getChips()); // re-renderiza o contador da barra do jogo
    return true;
  }, [restaurantId]);

  // Só o jogo em si esconde o app. Resultado e "fichas acabaram" devolvem
  // HUD (fichas/bônus) e tab bar — sem isso a tela vira beco sem saída.
  // (rota/jogo inválido também devolve o shell: erro sem tab bar seria beco.)
  const inMatch = !!restaurant && !!game && !noChips && !result;
  useEffect(() => {
    setImmersive(inMatch);
    return () => setImmersive(false);
  }, [inMatch, setImmersive]);

  // Ambiente sonoro discreto durante a partida (para ao sair ou ao terminar).
  useEffect(() => {
    if (!noChips && !result && !muted) {
      play("shimmer", { loop: true, volume: 0.12 });
    } else {
      stop("shimmer");
    }
    return () => stop("shimmer");
  }, [noChips, result, muted]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) play("tap");
  };

  // Celebração (ou lamento) quando o resultado chega.
  useEffect(() => {
    if (!result) return;
    const won = result.won && result.prize && result.prize.tier !== "none";
    if (won) {
      play("win");
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors: CONFETTI_COLORS });
      const t1 = setTimeout(
        () =>
          confetti({
            particleCount: 55,
            spread: 110,
            startVelocity: 38,
            origin: { x: 0.2, y: 0.4 },
            colors: CONFETTI_COLORS,
          }),
        260
      );
      const t2 = setTimeout(
        () =>
          confetti({
            particleCount: 55,
            spread: 110,
            startVelocity: 38,
            origin: { x: 0.8, y: 0.4 },
            colors: CONFETTI_COLORS,
          }),
        440
      );
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    play("lose", { volume: 0.5 });
  }, [result]);

  if (!restaurant || !game)
    return <div className="p-5 text-sm text-ink/70">Jogo não encontrado.</div>;

  // --- Sem fichas ----------------------------------------------------------
  if (noChips && !result) {
    const canClaim = canClaimDailyBonus();
    // O bônus devolve o jogo na hora: credita e volta pra mesa. A ficha só sai
    // quando a rodada começar de verdade (startPlay).
    const claimBonus = () => {
      const r = claimDailyBonus();
      if (!r.ok) return;
      play("jackpot");
      setChips(getChips());
      if (availablePlays(restaurant.id) >= 1) setNoChips(false);
    };

    return (
      <div className="px-6 pb-12 pt-16 text-center">
        <div className="anim-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M5 19 19 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p
          className="anim-fade-up mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/65"
          style={{ animationDelay: "80ms" }}
        >
          {restaurant.name}
        </p>
        <h1
          className="anim-fade-up mt-2 font-display text-3xl font-bold tracking-tight"
          style={{ animationDelay: "140ms" }}
        >
          Suas fichas acabaram
        </h1>
        <p
          className="anim-fade-up mx-auto mt-3 max-w-[32ch] text-sm leading-relaxed text-ink/70"
          style={{ animationDelay: "200ms" }}
        >
          Cada jogada custa {CHIP_COST} fichas. Você tem {chips} agora — dá pra repor sem
          sair daqui.
        </p>

        {/* Espera com prazo é espera tolerável: o saldo se recompõe sozinho. */}
        {nextChip && (
          <p
            className="anim-fade-up mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink/70 shadow-sm"
            style={{ animationDelay: "240ms" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-4 w-4 text-brand-500"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            +{REGEN_AMOUNT} fichas em <span className="tabular-nums">{nextChip}</span>
          </p>
        )}

        <div
          className="anim-fade-up mx-auto mt-8 grid max-w-xs gap-3"
          style={{ animationDelay: "280ms" }}
        >
          {canClaim && (
            <button
              onClick={claimBonus}
              className="press min-h-11 rounded-full bg-brand-500 px-6 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
            >
              Resgatar bônus de hoje · +{DAILY_BONUS_CHIPS} fichas
            </button>
          )}
          <Link
            to="/parceiro"
            onClick={() => play("tap")}
            className={`press flex min-h-11 items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition-colors ${
              canClaim
                ? "border border-ink/15 bg-white text-ink active:bg-surface"
                : "bg-brand-500 text-white active:bg-brand-600"
            }`}
          >
            Gerar um código no painel do parceiro
          </Link>
          <Link
            to="/"
            onClick={() => play("tap")}
            className="press flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-ink/70 underline underline-offset-4 transition-colors active:text-ink"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  // --- Resultado -----------------------------------------------------------
  if (result) {
    const won = result.won && result.prize && result.prize.tier !== "none";
    const manchete = won ? frases.vitoria : frases.derrota;
    const consolo = frases.consolo;

    if (won && result.prize)
      return (
        <div className="px-6 pb-12 pt-12 text-center">
          <p className="anim-fade-up text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/65">
            {restaurant.name}
          </p>
          <h1
            className="anim-fade-up mt-2 font-display text-4xl font-bold tracking-tight"
            style={{ animationDelay: "60ms" }}
          >
            {manchete}
          </h1>
          <div className="mt-2">
            <XpBadge amount={XP_PER_PLAY + XP_PER_WIN} />
          </div>

          {/* Ticket do cupom */}
          <div
            className="anim-pop relative mx-auto mt-7 max-w-xs overflow-hidden rounded-card bg-white text-left shadow-lg shadow-ink/10"
            style={{ animationDelay: "180ms" }}
          >
            <div className="h-1.5 bg-accent2" />
            <div className="flex items-center gap-3 p-4 pb-2.5">
              <Photo src={restaurant.photo} alt={restaurant.name} className="h-11 w-11 rounded-full" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{restaurant.name}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a5a00]">
                  Prêmio da rodada
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 font-display text-xl font-bold leading-snug">
              {result.prize.label}
            </div>

            {/* Linha de recorte */}
            <div className="relative flex items-center">
              <div className="absolute -left-3 h-6 w-6 rounded-full bg-paper" />
              <div className="mx-4 flex-1 border-t-2 border-dashed border-ink/10" />
              <div className="absolute -right-3 h-6 w-6 rounded-full bg-paper" />
            </div>

            <div className="p-4 pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/65">
                Código do cupom
              </div>
              {couponCode && (
                <div className="mt-1 font-display text-4xl font-bold tracking-[0.12em] text-brand-600">
                  {couponCode}
                </div>
              )}
              <p className="mt-2 text-xs font-semibold text-ink/70">Mostra pro garçom e pronto.</p>
              {/* O cupom vale 24h e só nesta casa: dizer onde ela fica é parte
                  do prêmio, não detalhe. Abre o mapa do aparelho. */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${restaurant.name}, ${restaurant.address}, ${restaurant.neighborhood}, Natal RN`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => play("tap")}
                className="press mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 underline underline-offset-4"
              >
                {restaurant.address} · como chegar
              </a>
            </div>
          </div>

          <div className="anim-fade-up mx-auto mt-8 grid max-w-xs gap-2.5" style={{ animationDelay: "340ms" }}>
            <button
              className="press rounded-full bg-brand-500 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
              onClick={() => navigate(`/r/${restaurant.id}`)}
            >
              Jogar de novo
            </button>
            <Link
              to="/cupons"
              className="press rounded-full border border-ink/15 bg-white py-3.5 text-sm font-bold text-ink transition-colors active:bg-surface"
            >
              Meus cupons
            </Link>
          </div>
        </div>
      );

    // Derrota: leve e encorajadora.
    return (
      <div className="px-6 pb-12 pt-16 text-center">
        <div className="anim-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface text-ink/65">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </div>
        <h1
          className="anim-fade-up mt-6 font-display text-3xl font-bold tracking-tight"
          style={{ animationDelay: "80ms" }}
        >
          {manchete}
        </h1>
        <div className="mt-2">
          <XpBadge amount={XP_PER_PLAY} />
        </div>
        <p
          className="anim-fade-up mx-auto mt-3 max-w-[30ch] text-sm leading-relaxed text-ink/70"
          style={{ animationDelay: "140ms" }}
        >
          {consolo}
        </p>
        <div className="anim-fade-up mt-8" style={{ animationDelay: "220ms" }}>
          <button
            className="press rounded-full bg-brand-500 px-8 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
            onClick={() => navigate(`/r/${restaurant.id}`)}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  // --- Jogo em andamento (modo imersivo) -----------------------------------
  const GameComponent = game.component;
  return (
    <div className="relative min-h-dvh">
      {/* Ambiente da casa: foto desfocada ao fundo, quase imperceptível */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-[0.13] blur-2xl saturate-150"
        style={{ backgroundImage: `url(${restaurant.photo})` }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-paper/60 via-paper/85 to-paper" />

      {/* Barra do jogo: sair + nome + mudo + fichas (o resto do app sai de cena).
          Padding do topo respeita o notch do iPhone; alvos com 44px. */}
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Link
          to={`/r/${restaurant.id}`}
          onClick={() => play("tap")}
          className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur"
          aria-label="Sair do jogo"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5 text-ink/70"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
        {/* h1 de verdade: toda tela precisa de um cabeçalho principal pra quem
            navega por leitor de tela saber onde está (as telas de jogo não
            tinham nenhum — axe: page-has-heading-one). */}
        <h1 className="min-w-0 truncate font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink/70">
          {game.name}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Ativar som" : "Desativar som"}
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-ink/70"
              aria-hidden
            >
              <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
              {muted ? (
                <path d="m16 9.5 4 5M20 9.5l-4 5" />
              ) : (
                <>
                  <path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4" />
                  <path d="M18.4 6.2a8.5 8.5 0 0 1 0 11.6" />
                </>
              )}
            </svg>
          </button>
          <div className="flex h-11 items-center gap-1 rounded-full bg-ink px-3">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="#f5a623" />
              <circle cx="12" cy="12" r="6" fill="#fff3d6" />
            </svg>
            <span className="text-[11px] font-black tabular-nums text-white">{chips}</span>
          </div>
        </div>
      </div>
      {/* O jogo chega em chunk próprio (React.lazy): esqueleto no lugar da espera. */}
      <Suspense fallback={<GameSkeleton />}>
        <GameComponent
          restaurant={restaurant}
          drawPrize={() => drawPrize(restaurant)}
          startPlay={startPlay}
          onFinish={(r) => {
            if (r.won && r.prize && r.prize.tier !== "none") {
              const c = awardCoupon(restaurant.id, game.id, r.prize.label);
              setCouponCode(c.code);
            }
            setResult(r);
          }}
        />
      </Suspense>
    </div>
  );
}
