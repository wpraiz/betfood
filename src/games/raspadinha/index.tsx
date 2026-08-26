import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { GameDefinition, GameProps, Prize } from "../../lib/types";

const BRUSH_RADIUS = 24; // px (CSS), pincel redondo
const REVEAL_THRESHOLD = 0.55; // >55% raspado => revela tudo
const SAMPLE_EVERY_N_EVENTS = 8; // amostra alpha a cada N pointermoves
const SAMPLE_STRIDE = 6; // amostra 1 pixel a cada 6 (nas duas direções)

const CONFETTI_COLORS = ["#0088b0", "#d6006c", "#201e1d", "#bd9b57"];

function Raspadinha({ restaurant, drawPrize, onFinish }: GameProps) {
  // Sorteia uma única vez, na montagem.
  const [prize] = useState<Prize>(() => drawPrize());
  const won = prize.tier !== "none";

  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const moveCountRef = useRef(0);
  const revealedRef = useRef(false);
  const finishedRef = useRef(false);

  // Pinta a camada metálica (com devicePixelRatio pra não borrar).
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Base metálica: gradiente prata.
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#b8bcc4");
    grad.addColorStop(0.25, "#e6e9ee");
    grad.addColorStop(0.5, "#9aa0ab");
    grad.addColorStop(0.75, "#dfe3e9");
    grad.addColorStop(1, "#aab0ba");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Reflexos diagonais sutis.
    ctx.save();
    ctx.globalAlpha = 0.25;
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

    // Texto convite.
    ctx.fillStyle = "#5b6068";
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RASPE AQUI", w / 2, h / 2 - 12);
    ctx.font = "500 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#71767e";
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
    if (won) {
      confetti({ particleCount: 70, spread: 55, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
    }
    window.setTimeout(finish, 1100);
  }, [won, finish]);

  // Amostra o alpha do canvas pra estimar o % raspado.
  const measureScratched = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let cleared = 0;
    let total = 0;
    const strideX = SAMPLE_STRIDE * 4;
    for (let y = 0; y < height; y += SAMPLE_STRIDE) {
      const row = y * width * 4;
      for (let x = 0; x < width * 4; x += strideX) {
        total++;
        if (data[row + x + 3] < 128) cleared++;
      }
    }
    const ratio = total > 0 ? cleared / total : 0;
    setProgress(Math.round(ratio * 100));
    if (ratio > REVEAL_THRESHOLD) reveal();
  }, [reveal]);

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
    scratchingRef.current = true;
    lastPointRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchAt(e.currentTarget, getCoordinates(e));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scratchingRef.current || revealedRef.current) return;
    scratchAt(e.currentTarget, getCoordinates(e));
    moveCountRef.current++;
    if (moveCountRef.current % SAMPLE_EVERY_N_EVENTS === 0) {
      measureScratched();
    }
  };

  const handlePointerUp = () => {
    if (!scratchingRef.current) return;
    scratchingRef.current = false;
    lastPointRef.current = null;
    if (!revealedRef.current) measureScratched();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 text-ink">
      {/* Bilhete */}
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-card border bg-white shadow-sm"
        style={{ borderColor: restaurant.accent }}
      >
        {/* Furos laterais estilo bilhete */}
        <div className="absolute -left-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
        <div className="absolute -right-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />

        {/* Cabeçalho tipográfico */}
        <div className="border-b border-ink/10 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/40">
            Raspadinha
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-ink">
            {restaurant.name}
          </p>
        </div>

        {/* Área raspável */}
        <div ref={wrapRef} className="relative h-44 select-none">
          {/* Resultado escondido sob a camada */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
            {won ? (
              <>
                <p
                  className="font-display text-xl font-semibold leading-snug"
                  style={{ color: restaurant.accent }}
                >
                  {prize.label}
                </p>
                <p className="text-xs text-ink/50">
                  Você ganhou. Apresente o cupom ao garçom.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-xl font-semibold leading-snug text-ink/60">
                  Não foi dessa vez.
                </p>
                <p className="text-xs text-ink/50">
                  A próxima raspadinha pode ser a sua.
                </p>
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
        </div>

        {/* Rodapé do bilhete */}
        <div className="border-t border-dashed border-ink/15 px-5 py-2 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/35">
            BetFood · Prêmio válido só hoje, só aqui
          </p>
        </div>
      </div>

      {/* Progresso */}
      <p className="text-xs text-ink/40">
        {revealed
          ? "Revelado."
          : progress > 0
            ? `Raspado: ${Math.min(progress, 100)}%`
            : "Raspe a área prateada para revelar"}
      </p>
    </div>
  );
}

export const raspadinha: GameDefinition = {
  id: "raspadinha",
  name: "Raspadinha",
  tagline: "Raspe e descubra seu prêmio",
  component: Raspadinha,
};
