import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { play, stop } from "../../lib/sound";
import type { GameProps, Prize } from "../../lib/types";

const BRUSH_RADIUS = 24; // px (CSS), pincel redondo
const REVEAL_THRESHOLD = 0.55; // >55% raspado => revela tudo
const SAMPLE_EVERY_N_EVENTS = 8; // amostra alpha a cada N pointermoves
const MAX_DPR = 2; // acima disso o canvas só custa memória
// Canvas offscreen minúsculo pra medir o % raspado: o alpha sobrevive ao
// drawImage, então 96x52 basta e lê ~5k px em vez de milhões.
const SAMPLE_W = 96;
const SAMPLE_H = 52;
const CHIP_EVERY_N_EVENTS = 3; // solta uma lasca a cada N pointermoves
const MAX_CHIPS = 30; // máximo de lascas vivas ao mesmo tempo
const CHIP_LIFE_MS = 620; // vida da lasca (casada com o keyframe)

const CONFETTI_COLORS = ["#ea1d2c", "#f5a623", "#ffffff"];
const CHIP_COLORS = ["#aab0ba", "#c7ccd4", "#9aa0ab", "#dfe3e9"];

function Raspadinha({ restaurant, drawPrize, startPlay, onFinish }: GameProps) {
  // Sorteia uma única vez, na montagem. Sortear não custa nada — a ficha só sai
  // na primeira raspada de verdade (startPlay em handlePointerDown).
  const [prize] = useState<Prize>(() => drawPrize());
  const won = prize.tier !== "none";

  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chipLayerRef = useRef<HTMLDivElement>(null);
  const chipCountRef = useRef(0);
  const scratchingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const moveCountRef = useRef(0);
  const revealedRef = useRef(false);
  const finishedRef = useRef(false);
  const startedRef = useRef(false); // rodada já cobrada?

  // Timeouts da revelação: cancelados no unmount pra som/confetti não caírem na
  // tela seguinte nem creditar cupom de rodada abandonada (padrão da roleta).
  const timeoutsRef = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  }, []);

  // Garante que o loop de raspagem para se o componente desmontar no meio.
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
      stop("scratch");
    };
  }, []);

  // Pinta a camada metálica (com devicePixelRatio pra não borrar).
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Base metálica premium: prata com veios quentes de champanhe.
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#a7adb8");
    grad.addColorStop(0.16, "#eef1f5");
    grad.addColorStop(0.32, "#8f96a2");
    grad.addColorStop(0.46, "#d9cfc0"); // veio champanhe
    grad.addColorStop(0.58, "#f2f4f7");
    grad.addColorStop(0.72, "#9aa0ab");
    grad.addColorStop(0.86, "#e3e0d8");
    grad.addColorStop(1, "#a3a9b4");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Brilho radial no centro, como metal escovado sob luz.
    const halo = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.65);
    halo.addColorStop(0, "rgba(255,255,255,0.35)");
    halo.addColorStop(0.5, "rgba(255,255,255,0.08)");
    halo.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // Reflexos diagonais sutis.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#ffffff";
    for (let x = -h; x < w + h; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 14, 0);
      ctx.lineTo(x + 14 - h, h);
      ctx.lineTo(x - h, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Fios dourados finos cruzando na outra diagonal (toque de bilhete premiado).
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#f5a623";
    ctx.lineWidth = 1.5;
    for (let x = -h; x < w + h; x += 58) {
      ctx.beginPath();
      ctx.moveTo(x + h, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.restore();

    // Texto convite.
    ctx.fillStyle = "#4d525a";
    ctx.font = "800 17px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RASPE AQUI", w / 2, h / 2 - 12);
    ctx.font = "500 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#666b73";
    ctx.fillText("use o dedo e descubra seu prêmio", w / 2, h / 2 + 12);
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({ won, prize });
  }, [onFinish, won, prize]);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setRevealed(true);
    setProgress(100);
    stop("scratch");
    if (won) {
      // Sons em camadas: impacto da vitória + cupom carimbando logo depois.
      play("win");
      later(() => play("coupon", { volume: 0.8 }), 300);
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
      later(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.68 },
          colors: CONFETTI_COLORS,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.68 },
          colors: CONFETTI_COLORS,
        });
      }, 180);
    } else {
      play("lose", { volume: 0.55 });
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(won ? [60, 40, 120] : 60);
    }
    later(finish, 1500);
  }, [won, finish, later]);

  // Amostra o alpha pra estimar o % raspado. Em vez de ler o canvas inteiro
  // (megabytes em DPR alto), reduz pra um canvas offscreen de 96x52 — o alpha
  // sobrevive ao drawImage, então a proporção de área raspada se mantém.
  const measureScratched = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    let sample = sampleCanvasRef.current;
    if (!sample) {
      sample = document.createElement("canvas");
      sample.width = SAMPLE_W;
      sample.height = SAMPLE_H;
      sampleCanvasRef.current = sample;
    }
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    sctx.clearRect(0, 0, SAMPLE_W, SAMPLE_H);
    sctx.drawImage(canvas, 0, 0, SAMPLE_W, SAMPLE_H);
    const data = sctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;

    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) cleared++;
    }
    const ratio = cleared / (SAMPLE_W * SAMPLE_H);
    setProgress(Math.round(ratio * 100));
    if (ratio > REVEAL_THRESHOLD) reveal();
  }, [reveal]);

  // Solta uma lasca (span DOM) na posição do pointer; leve, sem re-render.
  const spawnChip = useCallback((x: number, y: number) => {
    const layer = chipLayerRef.current;
    if (!layer || chipCountRef.current >= MAX_CHIPS) return;
    chipCountRef.current++;

    const chip = document.createElement("span");
    chip.className = "rasp-chip";
    const size = 3 + Math.random() * 4;
    chip.style.width = `${size}px`;
    chip.style.height = `${size * (0.6 + Math.random() * 0.6)}px`;
    chip.style.left = `${x + (Math.random() - 0.5) * 18}px`;
    chip.style.top = `${y + (Math.random() - 0.5) * 10}px`;
    chip.style.background = CHIP_COLORS[Math.floor(Math.random() * CHIP_COLORS.length)];
    chip.style.setProperty("--chip-dx", `${(Math.random() - 0.5) * 34}px`);
    chip.style.setProperty("--chip-rot", `${(Math.random() - 0.5) * 260}deg`);
    layer.appendChild(chip);

    window.setTimeout(() => {
      chip.remove();
      chipCountRef.current--;
    }, CHIP_LIFE_MS);
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const scratchAt = (
    canvas: HTMLCanvasElement,
    point: { x: number; y: number },
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    const last = lastPointRef.current;
    if (last) {
      // Traço contínuo entre os pontos, pra não pontilhar em movimento rápido.
      ctx.beginPath();
      ctx.lineWidth = BRUSH_RADIUS * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    lastPointRef.current = point;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealedRef.current) return;
    // Primeiro toque na camada = início real da rodada: cobra aqui, uma vez só.
    if (!startedRef.current) {
      if (!startPlay()) return;
      startedRef.current = true;
    }
    scratchingRef.current = true;
    lastPointRef.current = null;
    play("scratch", { loop: true, volume: 0.5 });
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = getCoordinates(e);
    scratchAt(e.currentTarget, point);
    spawnChip(point.x, point.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scratchingRef.current || revealedRef.current) return;
    const point = getCoordinates(e);
    scratchAt(e.currentTarget, point);
    moveCountRef.current++;
    if (moveCountRef.current % CHIP_EVERY_N_EVENTS === 0) {
      spawnChip(point.x, point.y);
    }
    if (moveCountRef.current % SAMPLE_EVERY_N_EVENTS === 0) {
      measureScratched();
    }
  };

  const handlePointerUp = () => {
    if (!scratchingRef.current) return;
    scratchingRef.current = false;
    lastPointRef.current = null;
    stop("scratch");
    if (!revealedRef.current) measureScratched();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 text-ink">
      {/* Keyframes locais: shine varrendo a camada, lascas caindo, flash dourado */}
      <style>{`
        @keyframes rasp-shine-sweep {
          0% { transform: translateX(-160%) skewX(-18deg); }
          55%, 100% { transform: translateX(260%) skewX(-18deg); }
        }
        .rasp-shine {
          animation: rasp-shine-sweep 2.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes rasp-chip-fall {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--chip-dx, 0px), 64px) rotate(var(--chip-rot, 120deg)); }
        }
        .rasp-chip {
          position: absolute;
          border-radius: 1px;
          pointer-events: none;
          box-shadow: 0 0.5px 1px rgba(32,30,29,0.3);
          animation: rasp-chip-fall ${CHIP_LIFE_MS}ms cubic-bezier(0.3, 0.4, 0.6, 1) both;
        }
        @keyframes rasp-gold-flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        .rasp-gold-flash {
          animation: rasp-gold-flash 0.9s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .rasp-shine { animation: none; opacity: 0; }
          .rasp-chip { animation: none; opacity: 0; }
          .rasp-gold-flash { animation: none; opacity: 0; }
        }
      `}</style>

      {/* Bilhete: moldura em gradiente vermelho→âmbar */}
      <div
        className="anim-fade-up w-full max-w-sm rounded-card p-[2.5px] shadow-lg shadow-brand-500/20"
        style={{ background: "linear-gradient(135deg, #ea1d2c 0%, #cf1626 45%, #f5a623 100%)" }}
      >
        <div className="relative overflow-hidden rounded-[calc(1.25rem-2.5px)] bg-white">
          {/* Furos laterais estilo bilhete */}
          <div className="absolute -left-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-accent2/70 bg-paper" />
          <div className="absolute -right-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-accent2/70 bg-paper" />

          {/* Cabeçalho com o nome da casa */}
          <div
            className="relative px-5 py-4 text-white"
            style={{ background: "linear-gradient(120deg, #ea1d2c 0%, #cf1626 70%, #a81220 100%)" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
              Raspadinha BetFood
            </p>
            <p className="mt-0.5 font-display text-xl font-extrabold leading-tight">
              {restaurant.name}
            </p>
            {/* Fio dourado separando o cabeçalho da área de jogo */}
            <div
              className="absolute inset-x-0 bottom-0 h-[3px]"
              style={{ background: "linear-gradient(90deg, transparent, #f5a623 20%, #ffc95e 50%, #f5a623 80%, transparent)" }}
            />
          </div>

          {/* Área raspável */}
          <div ref={wrapRef} className="relative h-48 select-none">
            {/* Resultado escondido sob a camada */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 text-center ${
                revealed ? "anim-pop" : ""
              }`}
            >
              {won ? (
                <>
                  {prize.tier === "big" && (
                    <span className="rounded-full bg-accent2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                      Prêmio top
                    </span>
                  )}
                  <p className="font-display text-3xl font-extrabold leading-tight text-brand-600">
                    {prize.label}
                  </p>
                  <p className="text-xs font-medium text-ink/70">
                    Raspou, ganhou. Mostra pro garçom e pronto.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-extrabold leading-tight text-ink/65">
                    Não foi dessa vez.
                  </p>
                  <p className="text-xs text-ink/70">A próxima raspadinha pode ser a sua.</p>
                </>
              )}
            </div>

            {/* Camada metálica */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 h-full w-full cursor-pointer transition-opacity duration-700 ${
                revealed ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            {/* Shine diagonal varrendo a camada metálica */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-300 ${
                revealed ? "opacity-0" : "opacity-100"
              }`}
            >
              <div
                className="rasp-shine absolute inset-y-[-20%] left-0 w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.55) 55%, transparent)",
                }}
              />
            </div>

            {/* Lascas caindo (partículas DOM geridas por ref) */}
            <div
              ref={chipLayerRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            />
          </div>

          {/* Rodapé do bilhete */}
          <div className="border-t border-dashed border-accent2/40 px-5 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink/65">
              Prêmio válido só hoje, só aqui
            </p>
          </div>

          {/* Flash dourado full-card na revelação */}
          {revealed && (
            <div
              aria-hidden
              className="rasp-gold-flash pointer-events-none absolute inset-0 z-20 bg-accent2"
            />
          )}
        </div>
      </div>

      {/* Progresso */}
      <div className="anim-fade-up w-full max-w-sm" style={{ animationDelay: "120ms" }}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: "linear-gradient(90deg, #ea1d2c, #f5a623)",
            }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs font-medium text-ink/70">
          {revealed
            ? "Revelado."
            : progress > 0
              ? `Raspado: ${Math.min(progress, 100)}%`
              : "Raspe a área prateada e descubra"}
        </p>

        {/* Caminho alternativo: raspar exige arrastar o dedo por mais da metade
            da área — gesto impossível pra quem tem limitação motora, e chato em
            mouse. O botão revela o MESMO resultado já sorteado; ninguém ganha
            nem perde nada por usá-lo. */}
        {!revealed && (
          <button
            type="button"
            onClick={() => {
              if (!startedRef.current) {
                if (!startPlay()) return;
                startedRef.current = true;
              }
              play("tap");
              reveal();
            }}
            className="press mx-auto mt-3 block min-h-11 rounded-full border border-ink/15 bg-white px-5 text-xs font-bold text-ink/70"
          >
            Revelar sem raspar
          </button>
        )}
      </div>
    </div>
  );
}

// Default export: o registro (id/name/tagline) mora em src/games/index.ts, que
// carrega este módulo sob demanda via React.lazy.
export default Raspadinha;
