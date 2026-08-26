// Data layer da POC: tudo em localStorage, com API síncrona simples.
// Trocar por Supabase depois é substituir este módulo mantendo as assinaturas.
import type { Coupon, Prize, Restaurant, TableCode } from "./types";
import { RESTAURANTS } from "./seed";

const KEY = "betfood-v1";

interface DB {
  coupons: Coupon[];
  tableCodes: TableCode[];
  credits: Record<string, number>; // por restaurante
  lastFreePlay: Record<string, string>; // ISO date (yyyy-mm-dd) por restaurante
  xp: number;
  streak: number; // dias seguidos jogando
  lastPlayDay: string | null; // yyyy-mm-dd da última jogada (qualquer casa)
  chips: number; // moeda global do app (fichas)
  lastBonusDay: string | null; // yyyy-mm-dd do último bônus diário resgatado
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as Partial<DB>;
      // Defensivo: estado antigo ou corrompido nunca deve derrubar a demo.
      return {
        coupons: Array.isArray(db.coupons) ? db.coupons : [],
        tableCodes: Array.isArray(db.tableCodes) ? db.tableCodes : [],
        credits: db.credits && typeof db.credits === "object" ? db.credits : {},
        lastFreePlay:
          db.lastFreePlay && typeof db.lastFreePlay === "object" ? db.lastFreePlay : {},
        xp: typeof db.xp === "number" ? db.xp : 0,
        streak: typeof db.streak === "number" ? db.streak : 0,
        lastPlayDay: typeof db.lastPlayDay === "string" ? db.lastPlayDay : null,
        chips: typeof db.chips === "number" ? db.chips : WELCOME_CHIPS,
        lastBonusDay: typeof db.lastBonusDay === "string" ? db.lastBonusDay : null,
      };
    }
  } catch {
    /* estado corrompido: recomeça */
  }
  // Primeira visita: já nasce com histórico de demonstração, pra o painel do
  // parceiro contar uma história em vez de abrir zerado no pitch.
  return withDemoData({
    coupons: [],
    tableCodes: [],
    credits: {},
    lastFreePlay: {},
    xp: 0,
    streak: 0,
    lastPlayDay: null,
    chips: WELCOME_CHIPS,
    lastBonusDay: null,
  });
}

function save(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* cota cheia ou modo privado: a sessão segue só em memória */
  }
}

// --- Dados de demonstração -------------------------------------------------
// O painel do parceiro precisa contar uma história no pitch. Estes registros
// nascem com a primeira visita, são marcados com `demo: true` e podem ser
// apagados por clearDemoData() antes de uma demonstração ao vivo de geração.

const DAY = 86_400_000;

function seededCode(seed: number): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  let s = seed;
  for (let i = 0; i < 6; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    out += chars[Math.floor((s / 2147483648) * chars.length)];
  }
  return out;
}

function withDemoData(db: DB): DB {
  const now = Date.now();
  let seed = 7;
  RESTAURANTS.forEach((r, ri) => {
    // ~12 códigos por casa, dois terços já usados
    for (let i = 0; i < 12; i++) {
      seed += 17;
      const used = i % 3 !== 0;
      db.tableCodes.push({
        code: seededCode(seed + ri * 100),
        restaurantId: r.id,
        credits: 3,
        createdAt: new Date(now - ((i % 7) + 1) * DAY).toISOString(),
        usedAt: used ? new Date(now - (i % 7) * DAY + 3_600_000).toISOString() : null,
        demo: true,
      });
    }
    // ~3 cupons por casa, metade já resgatada
    for (let i = 0; i < 3; i++) {
      seed += 31;
      const prize = r.prizes[i % (r.prizes.length - 1)];
      const wonAt = new Date(now - ((i * 2) % 6) * DAY - 7_200_000);
      db.coupons.push({
        id: `demo-${r.id}-${i}`,
        restaurantId: r.id,
        gameId: ["roleta", "raspadinha", "quiz", "memoria"][(i + ri) % 4],
        prizeLabel: prize.label,
        code: seededCode(seed + ri * 7),
        wonAt: wonAt.toISOString(),
        expiresAt: new Date(wonAt.getTime() + DAY).toISOString(),
        redeemedAt: i % 2 === 0 ? new Date(wonAt.getTime() + 5_400_000).toISOString() : null,
        demo: true,
      });
    }
  });
  db.coupons.sort((a, b) => b.wonAt.localeCompare(a.wonAt));
  return db;
}

/** Remove tudo que veio da semente de demonstração (mantém o que o José jogou). */
export function clearDemoData() {
  const db = load();
  db.tableCodes = db.tableCodes.filter((t) => !t.demo);
  db.coupons = db.coupons.filter((c) => !c.demo);
  save(db);
}

export function hasDemoData(): boolean {
  const db = load();
  return db.tableCodes.some((t) => t.demo) || db.coupons.some((c) => c.demo);
}

export function getRestaurants(): Restaurant[] {
  return RESTAURANTS;
}

export function getRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find((r) => r.id === id);
}

// --- Fichas ----------------------------------------------------------------
// Moeda global: cada jogada custa CHIP_COST; bônus diário e códigos da mesa
// recarregam. Novo usuário começa com bônus de boas-vindas.

export const CHIP_COST = 10; // fichas por jogada
export const WELCOME_CHIPS = 50;
export const DAILY_BONUS_CHIPS = 30;

export function getChips(): number {
  const db = load();
  return db.chips ?? 0;
}

export function canClaimDailyBonus(): boolean {
  const db = load();
  const today = new Date().toISOString().slice(0, 10);
  return db.lastBonusDay !== today;
}

export function claimDailyBonus(): { ok: boolean; amount: number; chips: number } {
  const db = load();
  const today = new Date().toISOString().slice(0, 10);
  if (db.lastBonusDay === today) return { ok: false, amount: 0, chips: db.chips ?? 0 };
  db.lastBonusDay = today;
  db.chips = (db.chips ?? 0) + DAILY_BONUS_CHIPS;
  save(db);
  return { ok: true, amount: DAILY_BONUS_CHIPS, chips: db.chips };
}

export function availablePlays(_restaurantId?: string): number {
  return Math.floor(getChips() / CHIP_COST);
}

export function consumePlay(_restaurantId?: string): boolean {
  const db = load();
  if ((db.chips ?? 0) < CHIP_COST) return false;
  db.chips -= CHIP_COST;
  touchProgress(db, new Date().toISOString().slice(0, 10));
  save(db);
  return true;
}

// --- Progresso (XP, nível, streak) ----------------------------------------

export const XP_PER_PLAY = 10;
export const XP_PER_WIN = 25;

// name = curto pro HUD; title = completo pras telas com espaço
const LEVELS = [
  { name: "Bronze", title: "Garfo de Bronze", min: 0 },
  { name: "Prata", title: "Garfo de Prata", min: 100 },
  { name: "Ouro", title: "Garfo de Ouro", min: 250 },
  { name: "Chef", title: "Chef da Casa", min: 500 },
  { name: "Lenda", title: "Lenda de Natal", min: 1000 },
];

export interface Progress {
  xp: number;
  streak: number;
  level: number; // 1-based
  levelName: string; // curto (HUD)
  levelTitle: string; // completo
  levelFloor: number; // xp onde o nível atual começa
  levelCeil: number | null; // xp do próximo nível (null no último)
}

/** Atualiza streak e dá o XP da jogada. Chamado por consumePlay. */
function touchProgress(db: DB, today: string) {
  if (db.lastPlayDay !== today) {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    db.streak = db.lastPlayDay === yesterday ? (db.streak ?? 0) + 1 : 1;
    db.lastPlayDay = today;
  }
  db.xp = (db.xp ?? 0) + XP_PER_PLAY;
}

export function getProgress(): Progress {
  const db = load();
  const xp = db.xp ?? 0;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  return {
    xp,
    streak: db.streak ?? 0,
    level: idx + 1,
    levelName: LEVELS[idx].name,
    levelTitle: LEVELS[idx].title,
    levelFloor: LEVELS[idx].min,
    levelCeil: idx + 1 < LEVELS.length ? LEVELS[idx + 1].min : null,
  };
}

export function redeemTableCode(code: string): { ok: boolean; message: string; restaurantId?: string } {
  const norm = code.trim().toUpperCase();
  const db = load();
  const tc = db.tableCodes.find((t) => t.code === norm);
  if (!tc) return { ok: false, message: "Código não encontrado. Confira com o restaurante." };
  if (tc.usedAt) return { ok: false, message: "Esse código já foi usado." };
  tc.usedAt = new Date().toISOString();
  const amount = tc.credits * CHIP_COST;
  db.chips = (db.chips ?? 0) + amount;
  save(db);
  return { ok: true, message: `+${amount} fichas na sua conta!`, restaurantId: tc.restaurantId };
}

// --- Sorteio e cupons ------------------------------------------------------

export function drawPrize(restaurant: Restaurant): Prize {
  const total = restaurant.prizes.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of restaurant.prizes) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return restaurant.prizes[restaurant.prizes.length - 1];
}

function shortCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function awardCoupon(restaurantId: string, gameId: string, prizeLabel: string): Coupon {
  const db = load();
  const coupon: Coupon = {
    // randomUUID não existe em contexto não-seguro (ex.: teste por IP na LAN)
    id: crypto.randomUUID?.() ?? `c-${Date.now()}-${shortCode()}`,
    restaurantId,
    gameId,
    prizeLabel,
    code: shortCode(),
    wonAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + DAY).toISOString(), // vale 24h
    redeemedAt: null,
  };
  db.coupons.unshift(coupon);
  db.xp = (db.xp ?? 0) + XP_PER_WIN;
  save(db);
  return coupon;
}

export function getCoupons(): Coupon[] {
  return load().coupons;
}

export function redeemCoupon(id: string) {
  const db = load();
  const c = db.coupons.find((x) => x.id === id);
  if (c && !c.redeemedAt) {
    c.redeemedAt = new Date().toISOString();
    save(db);
  }
}

// --- Painel do parceiro ----------------------------------------------------

export function generateTableCodes(restaurantId: string, quantity: number, credits: number): TableCode[] {
  const db = load();
  const created: TableCode[] = Array.from({ length: quantity }, () => ({
    code: shortCode(),
    restaurantId,
    credits,
    createdAt: new Date().toISOString(),
    usedAt: null,
  }));
  db.tableCodes.push(...created);
  save(db);
  return created;
}

export function getTableCodes(restaurantId: string): TableCode[] {
  return load().tableCodes.filter((t) => t.restaurantId === restaurantId);
}

export function getRestaurantCoupons(restaurantId: string): Coupon[] {
  return load().coupons.filter((c) => c.restaurantId === restaurantId);
}
