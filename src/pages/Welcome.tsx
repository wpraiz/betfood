// Onboarding épico do BetFood: splash vermelho + 3 slides deslizáveis + CTA.
// Autocontido: estados internos controlam splash, slide ativo e efeitos.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { getRestaurants } from "../lib/store";
import { play } from "../lib/sound";
import FoodPhoto, { thumb } from "../components/FoodPhoto";

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];

/* --- Ícones (linha, stroke 1.8) ---------------------------------------- */

function UtensilsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 17.3l-5.4 3.2 1.4-6.1L3.3 10l6.2-.5L12 3.8l2.5 5.7 6.2.5-4.7 4.4 1.4 6.1z" />
    </svg>
  );
}

/* --- Página ------------------------------------------------------------- */

export default function Welcome() {
  const navigate = useNavigate();
  const restaurants = getRestaurants();
  const heroPhoto = restaurants[0];

  // Splash: visível -> saindo (fade) -> removido.
  const [splash, setSplash] = useState<"on" | "leaving" | "off">("on");
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const couponFxDone = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setSplash("leaving"), 1600);
    const t2 = window.setTimeout(() => setSplash("off"), 2100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Celebração única quando o slide do cupom entra em cena.
  useEffect(() => {
    if (idx === 1 && splash === "off" && !couponFxDone.current) {
      couponFxDone.current = true;
      play("coupon", { volume: 0.5 });
      confetti({
        particleCount: 80,
        spread: 75,
        startVelocity: 32,
        origin: { y: 0.5 },
        colors: CONFETTI_COLORS,
        disableForReducedMotion: true,
      });
    }
  }, [idx, splash]);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== idx) setIdx(next);
  }

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function finish() {
    if (finished.current) return;
    finished.current = true;
    play("tap");
    localStorage.setItem("betfood-onboarded", "1");
    navigate("/");
  }

  // Classe de entrada só quando o slide está ativo — o conteúdo "chega" junto.
  const on = (active: boolean, anim: string) => (active ? anim : "opacity-0");

  const last = idx === 2;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-paper">
      {/* Pular — discreto no topo, muda de cor sobre a foto do slide 1 */}
      {splash === "off" && (
        <button
          onClick={finish}
          className={`press anim-fade-up absolute right-4 top-4 z-20 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-colors ${
            idx === 0 ? "bg-black/40 text-white backdrop-blur-sm" : "bg-ink/5 text-ink/70"
          }`}
        >
          Pular
        </button>
      )}

      {/* Trilho de slides (scroll-snap horizontal) */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Slide 1 — Jogue enquanto espera (foto full-bleed) */}
        <section className="relative flex w-full shrink-0 snap-center flex-col justify-end overflow-hidden">
          <div className="absolute inset-0">
            <FoodPhoto src={heroPhoto.photo} alt={heroPhoto.name} className="h-full w-full" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative z-10 px-6 pb-8 text-white">
            <p
              className={`mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-white/70 ${on(idx === 0, "anim-fade-up")}`}
            >
              Enquanto o pedido não chega
            </p>
            <h2
              className={`font-display text-4xl font-black leading-[1.05] tracking-tight ${on(idx === 0, "anim-fade-up")}`}
              style={{ animationDelay: "80ms" }}
            >
              Jogue enquanto
              <br />
              espera
            </h2>
            <p
              className={`mt-3 max-w-[30ch] font-display text-[15px] leading-relaxed text-white/80 ${on(idx === 0, "anim-fade-up")}`}
              style={{ animationDelay: "160ms" }}
            >
              Roleta, raspadinha, quiz e memória direto da mesa. Sua espera vale jogada.
            </p>
          </div>
        </section>

        {/* Slide 2 — Ganhe prêmios de verdade (mock de cupom) */}
        <section className="relative flex w-full shrink-0 snap-center flex-col overflow-hidden bg-paper">
          <div className="flex flex-1 items-center justify-center px-8">
            <div className="relative w-full max-w-[300px]">
              {/* cartão de fundo pra dar profundidade */}
              <div
                className={`absolute inset-0 translate-y-3 rotate-3 rounded-card bg-brand-100 ${on(idx === 1, "anim-fade-up")}`}
              />
              {/* cupom */}
              <div
                className={`relative -rotate-2 rounded-card bg-white p-6 shadow-xl shadow-ink/10 ${on(idx === 1, "anim-pop")}`}
                style={{ animationDelay: "120ms" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full bg-accent2/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "#8a5a00" }}
                  >
                    Prêmio
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                    <UtensilsIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl font-black leading-tight tracking-tight">
                  Sobremesa grátis
                </p>
                <p className="mt-1 text-[13px] text-ink/70">{restaurants[1].name}</p>
                {/* picote */}
                <div className="relative my-5">
                  <div className="border-t-2 border-dashed border-ink/15" />
                  <span className="absolute -left-9 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
                  <span className="absolute -right-9 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/65">
                    Código
                  </span>
                  <span className="font-display text-lg font-black tracking-[0.22em] text-brand-600">
                    BF-7Q2K
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pb-8">
            <p
              className={`mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-brand-600 ${on(idx === 1, "anim-fade-up")}`}
              style={{ animationDelay: "200ms" }}
            >
              Recompensa de verdade
            </p>
            <h2
              className={`font-display text-4xl font-black leading-[1.05] tracking-tight ${on(idx === 1, "anim-fade-up")}`}
              style={{ animationDelay: "280ms" }}
            >
              Ganhe prêmios
              <br />
              de verdade
            </h2>
            <p
              className={`mt-3 max-w-[32ch] font-display text-[15px] leading-relaxed text-ink/70 ${on(idx === 1, "anim-fade-up")}`}
              style={{ animationDelay: "360ms" }}
            >
              Deu prêmio, o cupom cai na hora na sua carteira. Mostra pro garçom e pronto.
            </p>
          </div>
        </section>

        {/* Slide 3 — Nos melhores restaurantes de Natal (mosaico) */}
        <section className="relative flex w-full shrink-0 snap-center flex-col overflow-hidden bg-paper">
          <div className="flex flex-1 items-center px-6 pt-14">
            <div className="grid w-full grid-cols-2 gap-2.5">
              {restaurants.map((r, i) => (
                <div
                  key={r.id}
                  className={`relative aspect-square overflow-hidden rounded-2xl ${on(idx === 2, "anim-pop")}`}
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {/* As 4 fotos do mosaico só entram quando o usuário sai do
                      slide 1. Carregá-las de cara dobra o peso de imagem da
                      estreia (medido: 219 KB, a última chegando em 1,56s no 4G)
                      por causa de um slide que muita gente nem vê. */}
                  <div className="absolute inset-0 bg-surface">
                    {idx >= 1 && (
                      <FoodPhoto src={thumb(r.photo, 400)} alt={r.name} className="h-full w-full" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-ink shadow-sm">
                    <StarIcon className="h-3 w-3 text-accent2" />
                    {r.rating.toFixed(1)}
                  </span>
                  <span className="absolute inset-x-2.5 bottom-2 truncate text-[12px] font-bold text-white">
                    {r.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 pb-8">
            <p
              className={`mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-brand-600 ${on(idx === 2, "anim-fade-up")}`}
              style={{ animationDelay: "300ms" }}
            >
              Casas de exemplo · Natal/RN
            </p>
            <h2
              className={`font-display text-4xl font-black leading-[1.05] tracking-tight ${on(idx === 2, "anim-fade-up")}`}
              style={{ animationDelay: "380ms" }}
            >
              Nos melhores
              <br />
              restaurantes de Natal
            </h2>
            <p
              className={`mt-3 max-w-[32ch] font-display text-[15px] leading-relaxed text-ink/70 ${on(idx === 2, "anim-fade-up")}`}
              style={{ animationDelay: "460ms" }}
            >
              Casas de exemplo pra você conhecer o BetFood, de Ponta Negra à Praia do Forte.
            </p>
          </div>
        </section>
      </div>

      {/* Barra inferior: dots + CTA */}
      <div className="z-10 px-6 pb-8 pt-2">
        <div className="mb-1 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o passo ${i + 1}`}
              aria-current={i === idx ? "step" : undefined}
              onClick={() => goTo(i)}
              /* alvo de 44x44 (px-2 + h-11) com o ponto visual pequeno dentro */
              className="flex h-11 w-11 items-center justify-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-7 bg-brand-500" : "w-2 bg-ink/25"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            if (last) {
              finish();
            } else {
              play("tap", { volume: 0.4 });
              goTo(idx + 1);
            }
          }}
          className="press flex w-full items-center justify-center gap-2.5 rounded-full bg-brand-500 py-4 font-display text-lg font-bold text-white shadow-lg shadow-brand-500/30 transition-colors active:bg-brand-600"
        >
          {last ? "Começar" : "Próximo"}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Splash por cima de tudo, sai com fade */}
      {splash !== "off" && (
        <div
          className={`absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-brand-500 transition-opacity duration-500 ${
            splash === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          {/* anéis decorativos */}
          <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full border border-white/10" />
          <div className="anim-pop flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-brand-500 shadow-xl shadow-brand-700/40">
            <UtensilsIcon className="h-9 w-9" />
          </div>
          <h1
            className="anim-pop mt-5 font-display text-5xl font-black tracking-tight text-white"
            style={{ animationDelay: "140ms" }}
          >
            BetFood
          </h1>
          <p
            className="anim-fade-up mt-2 text-[13px] font-semibold uppercase tracking-[0.3em] text-white/70"
            style={{ animationDelay: "320ms" }}
          >
            A espera virou jogo
          </p>
        </div>
      )}
    </div>
  );
}
