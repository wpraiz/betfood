/* Thumbnail rica por jogo (arte CSS) — usada na Home e na página da casa. */

const WHEEL_GRADIENT = `conic-gradient(
  #f5a623 0deg 45deg, #ffffff 45deg 90deg,
  #ea1d2c 90deg 135deg, #fbd6d8 135deg 180deg,
  #f5a623 180deg 225deg, #ffffff 225deg 270deg,
  #ea1d2c 270deg 315deg, #fbd6d8 315deg 360deg
)`;

export { WHEEL_GRADIENT };

export default function GameThumb({ id }: { id: string }) {
  if (id === "roleta")
    return (
      <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
        <div
          className="anim-spin-slow h-16 w-16 rounded-full border-2 border-white/80"
          style={{ background: WHEEL_GRADIENT }}
        />
        <span className="absolute bottom-1.5 right-2 text-[10px] font-black uppercase tracking-wider text-white/70">
          Gire
        </span>
      </div>
    );
  if (id === "raspadinha")
    return (
      <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-accent2 to-[#c77f00]">
        <div className="h-14 w-20 -rotate-6 rounded-lg bg-white shadow-md">
          <div className="mx-2 mt-2 h-4 rounded bg-surface" />
          <div className="relative mx-2 mt-1.5 h-5 overflow-hidden rounded bg-[#c9ccd4]">
            <div className="absolute -left-1 top-1 h-8 w-10 rotate-[-20deg] bg-accent2/70" />
          </div>
        </div>
        <span className="absolute bottom-1.5 right-2 text-[10px] font-black uppercase tracking-wider text-white/70">
          Raspe
        </span>
      </div>
    );
  if (id === "quiz")
    return (
      <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-ink to-[#4a4644]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md">
          <span className="font-display text-2xl font-black text-brand-500">?</span>
        </div>
        <span className="absolute bottom-1.5 right-2 text-[10px] font-black uppercase tracking-wider text-white/60">
          Responda
        </span>
      </div>
    );
  return (
    <div className="relative flex h-full items-center justify-center gap-1.5 bg-gradient-to-br from-brand-100 to-accent2/60">
      <div className="h-14 w-10 -rotate-6 rounded-lg border-2 border-white bg-brand-500 shadow" />
      <div className="flex h-14 w-10 rotate-6 items-center justify-center rounded-lg border-2 border-white bg-white shadow">
        <span className="font-display text-lg font-black text-brand-500">B</span>
      </div>
      <span className="absolute bottom-1.5 right-2 text-[10px] font-black uppercase tracking-wider text-ink/50">
        Combine
      </span>
    </div>
  );
}
