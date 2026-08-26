// SFX do app (arquivos gerados via ElevenLabs em public/sounds/).
// play() é fire-and-forget e nunca quebra o fluxo se o áudio falhar.

const NAMES = [
  "spin",
  "win",
  "lose",
  "scratch",
  "coupon",
  "tap",
  "flip",
  "correct",
  "wrong",
  "shimmer",
  "levelup",
  "tick",
  "jackpot",
] as const;

export type SoundName = (typeof NAMES)[number];

const MUTE_KEY = "betfood-mute";
const cache = new Map<SoundName, HTMLAudioElement>();

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  if (muted) stopAll();
}

function get(name: SoundName): HTMLAudioElement {
  let a = cache.get(name);
  if (!a) {
    a = new Audio(`${import.meta.env.BASE_URL}sounds/${name}.mp3`);
    a.preload = "auto";
    cache.set(name, a);
  }
  return a;
}

/** Toca um efeito. loop=true pra sons contínuos (raspadinha); pare com stop(). */
export function play(name: SoundName, opts?: { loop?: boolean; volume?: number }) {
  if (isMuted()) return;
  try {
    const a = get(name);
    a.loop = opts?.loop ?? false;
    a.volume = opts?.volume ?? 0.6;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {
    /* áudio bloqueado/indisponível: segue o jogo */
  }
}

export function stop(name: SoundName) {
  const a = cache.get(name);
  if (a) {
    a.pause();
    a.currentTime = 0;
  }
}

export function stopAll() {
  for (const name of NAMES) stop(name);
}
