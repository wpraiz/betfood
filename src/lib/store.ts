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
      const db = JSON.parse(raw) as DB;
      // migração: estados salvos antes da economia de fichas
      if (typeof db.chips !== "number") db.chips = WELCOME_CHIPS;
      if (db.lastBonusDay === undefined) db.lastBonusDay = null;
      return db;
    }
  } catch {
    /* estado corrompido: recomeça */
  }
  return {
    coupons: [],
    tableCodes: [],
    credits: {},
    lastFreePlay: {},
    xp: 0,
    streak: 0,
    lastPlayDay: null,
    chips: WELCOME_CHIPS,
    lastBonusDay: null,
  };
}

function save(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
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

const LEVELS = [
  { name: "Garfo de Bronze", min: 0 },
  { name: "Garfo de Prata", min: 100 },
  { name: "Garfo de Ouro", min: 250 },
  { name: "Chef da Casa", min: 500 },
  { name: "Lenda de Natal", min: 1000 },
];

export interface Progress {
  xp: number;
  streak: number;
  level: number; // 1-based
  levelName: string;
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
    id: crypto.randomUUID(),
    restaurantId,
    gameId,
    prizeLabel,
    code: shortCode(),
    wonAt: new Date().toISOString(),
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
