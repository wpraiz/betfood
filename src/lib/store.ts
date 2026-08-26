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
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* estado corrompido: recomeça */
  }
  return { coupons: [], tableCodes: [], credits: {}, lastFreePlay: {} };
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

// --- Jogadas ---------------------------------------------------------------
// 1 jogada grátis por dia por restaurante; códigos da mesa liberam extras.

export function availablePlays(restaurantId: string): number {
  const db = load();
  const today = new Date().toISOString().slice(0, 10);
  const free = db.lastFreePlay[restaurantId] === today ? 0 : 1;
  return free + (db.credits[restaurantId] ?? 0);
}

export function consumePlay(restaurantId: string): boolean {
  const db = load();
  const today = new Date().toISOString().slice(0, 10);
  if (db.lastFreePlay[restaurantId] !== today) {
    db.lastFreePlay[restaurantId] = today;
    save(db);
    return true;
  }
  if ((db.credits[restaurantId] ?? 0) > 0) {
    db.credits[restaurantId] -= 1;
    save(db);
    return true;
  }
  return false;
}

export function redeemTableCode(code: string): { ok: boolean; message: string; restaurantId?: string } {
  const norm = code.trim().toUpperCase();
  const db = load();
  const tc = db.tableCodes.find((t) => t.code === norm);
  if (!tc) return { ok: false, message: "Código não encontrado. Confira com o restaurante." };
  if (tc.usedAt) return { ok: false, message: "Esse código já foi usado." };
  tc.usedAt = new Date().toISOString();
  db.credits[tc.restaurantId] = (db.credits[tc.restaurantId] ?? 0) + tc.credits;
  save(db);
  return { ok: true, message: `+${tc.credits} jogadas liberadas!`, restaurantId: tc.restaurantId };
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
