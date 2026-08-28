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
  lastRegenAt: number | null; // epoch ms do último crédito automático de fichas
  seenLevel?: number; // último nível já comemorado na tela
  prizeLabels?: Record<string, Record<string, string>>; // casa → prêmio → rótulo da casa
  totalPlays?: number; // partidas pagas (histórico do jogador)
  totalWins?: number; // partidas que renderam cupom
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
        lastRegenAt: typeof db.lastRegenAt === "number" ? db.lastRegenAt : Date.now(),
        seenLevel: typeof db.seenLevel === "number" ? db.seenLevel : undefined,
        prizeLabels:
          db.prizeLabels && typeof db.prizeLabels === "object" ? db.prizeLabels : undefined,
        totalPlays: typeof db.totalPlays === "number" ? db.totalPlays : undefined,
        totalWins: typeof db.totalWins === "number" ? db.totalWins : undefined,
      };
    }
  } catch {
    /* estado corrompido: recomeça */
  }
  // Primeira visita: já nasce com histórico de demonstração, pra o painel do
  // parceiro contar uma história em vez de abrir zerado no pitch. Grava na hora
  // — senão cada leitura reconstruiria a semente e o estado só existiria em RAM.
  const fresh = withDemoData({
    coupons: [],
    tableCodes: [],
    credits: {},
    lastFreePlay: {},
    xp: 0,
    streak: 0,
    lastPlayDay: null,
    chips: WELCOME_CHIPS,
    lastBonusDay: null,
    lastRegenAt: Date.now(),
  });
  save(fresh);
  return fresh;
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

// 4 cupons por casa, um de cada estado — o painel precisa poder demonstrar
// validação com sucesso, "já usado" e "expirado" sem depender de sorte.
const DEMO_COUPONS = [
  { agoMs: 7_200_000, redeemed: false }, // pendente: ganho há 2h, ainda vale
  { agoMs: DAY + 7_200_000, redeemed: true }, // resgatado ontem
  { agoMs: 3 * DAY, redeemed: false }, // expirado: passou das 24h
  { agoMs: 5 * DAY, redeemed: true }, // resgatado há 5 dias
];

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
    DEMO_COUPONS.forEach((d, i) => {
      seed += 31;
      const prize = r.prizes[i % (r.prizes.length - 1)];
      const wonAt = new Date(now - d.agoMs);
      db.coupons.push({
        id: `demo-${r.id}-${i}`,
        restaurantId: r.id,
        gameId: ["roleta", "raspadinha", "quiz", "memoria"][(i + ri) % 4],
        prizeLabel: prize.label,
        code: seededCode(seed + ri * 7),
        wonAt: wonAt.toISOString(),
        expiresAt: new Date(wonAt.getTime() + DAY).toISOString(),
        redeemedAt: d.redeemed ? new Date(wonAt.getTime() + 5_400_000).toISOString() : null,
        demo: true,
      });
    });
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

// --- Tabela de prêmios editável -------------------------------------------
// O painel afirma ao dono que "a tabela de prêmios é sua". Pra isso ser verdade
// ele precisa poder trocar o texto do prêmio. Só o RÓTULO é editável: os pesos
// (a chance de cada faixa) continuam do produto, senão a economia vira outra
// coisa a cada casa. Cupons já ganhos guardam o texto da época e não mudam.

/** Aplica os rótulos que a casa personalizou, sem tocar no seed. */
function comRotulos(r: Restaurant, db: DB): Restaurant {
  const ov = db.prizeLabels?.[r.id];
  if (!ov) return r;
  return {
    ...r,
    prizes: r.prizes.map((p) => (ov[p.id] ? { ...p, label: ov[p.id] } : p)),
  };
}

export function setPrizeLabel(restaurantId: string, prizeId: string, label: string) {
  const limpo = label.trim().slice(0, 60);
  if (!limpo) return;
  const db = load();
  db.prizeLabels = db.prizeLabels ?? {};
  db.prizeLabels[restaurantId] = { ...(db.prizeLabels[restaurantId] ?? {}), [prizeId]: limpo };
  save(db);
}

/** Devolve a casa aos prêmios originais do produto. */
export function resetPrizeLabels(restaurantId: string) {
  const db = load();
  if (!db.prizeLabels?.[restaurantId]) return;
  delete db.prizeLabels[restaurantId];
  save(db);
}

export function hasCustomPrizes(restaurantId: string): boolean {
  return Boolean(load().prizeLabels?.[restaurantId]);
}

export function getRestaurants(): Restaurant[] {
  const db = load();
  return RESTAURANTS.map((r) => comRotulos(r, db));
}

export function getRestaurant(id: string): Restaurant | undefined {
  const found = RESTAURANTS.find((r) => r.id === id);
  return found ? comRotulos(found, load()) : undefined;
}

// --- Fichas ----------------------------------------------------------------
// Moeda global: cada jogada custa CHIP_COST; bônus diário e códigos da mesa
// recarregam. Novo usuário começa com bônus de boas-vindas.

export const CHIP_COST = 10; // fichas por jogada
export const WELCOME_CHIPS = 50;
export const DAILY_BONUS_CHIPS = 30;

// Recarga automática: quem gastou tudo não fica trancado esperando o dia virar.
// Só repõe ATÉ o teto — fichas ganhas em código da mesa ficam acima dele e não
// travam a recarga futura, mas também não somem.
export const REGEN_AMOUNT = 10; // 1 jogada
export const REGEN_INTERVAL_MS = 10 * 60_000; // a cada 10 min
export const REGEN_CAP = 50;

/**
 * Credita as fichas acumuladas desde a última recarga. Devolve true se mudou
 * algo (o chamador grava). Idempotente: sem tempo suficiente, não faz nada.
 */
function applyRegen(db: DB): boolean {
  const now = Date.now();
  const last = db.lastRegenAt ?? now;

  if ((db.chips ?? 0) >= REGEN_CAP) {
    // No teto o relógio não corre. Só regrava quando a defasagem passa de um
    // intervalo — senão o HUD (que consulta a cada 700ms) gravaria sem parar.
    if (now - last > REGEN_INTERVAL_MS) {
      db.lastRegenAt = now;
      return true;
    }
    return false;
  }

  const steps = Math.floor((now - last) / REGEN_INTERVAL_MS);
  if (steps < 1) return false;
  db.chips = Math.min(REGEN_CAP, (db.chips ?? 0) + steps * REGEN_AMOUNT);
  // Mantém o resto do tempo (não zera a fração já corrida).
  db.lastRegenAt = last + steps * REGEN_INTERVAL_MS;
  return true;
}

/** Milissegundos até a próxima ficha; null quando o saldo já está no teto. */
export function msToNextChip(): number | null {
  const db = load();
  if ((db.chips ?? 0) >= REGEN_CAP) return null;
  const last = db.lastRegenAt ?? Date.now();
  const elapsed = (Date.now() - last) % REGEN_INTERVAL_MS;
  return REGEN_INTERVAL_MS - elapsed;
}

export function getChips(): number {
  const db = load();
  if (applyRegen(db)) save(db);
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
  applyRegen(db); // credita o que já venceu antes de cobrar
  if ((db.chips ?? 0) < CHIP_COST) {
    save(db);
    return false;
  }
  db.chips -= CHIP_COST;
  db.totalPlays = (db.totalPlays ?? 0) + 1;
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

/**
 * Consome uma subida de nível, se houver: compara o nível atual com o último já
 * comemorado e registra o novo. Devolve `null` quando não há nada a celebrar.
 *
 * Mora aqui, e não num `useRef` do HUD, porque o HUD é DESMONTADO durante a
 * partida (modo imersivo) — justamente quando o XP sobe. Um ref perderia a
 * memória e a subida passaria despercebida (foi o que aconteceu no ciclo 24).
 */
export function takeLevelUp(): { level: number; name: string; title: string } | null {
  const db = load();
  const atual = getProgress();
  const visto = typeof db.seenLevel === "number" ? db.seenLevel : atual.level;
  if (visto === atual.level) {
    if (db.seenLevel !== atual.level) {
      db.seenLevel = atual.level;
      save(db);
    }
    return null;
  }
  db.seenLevel = atual.level;
  save(db);
  // Só comemora subida; queda (reset de estado) apenas re-sincroniza.
  return atual.level > visto
    ? { level: atual.level, name: atual.levelName, title: atual.levelTitle }
    : null;
}

/**
 * Histórico do próprio jogador. Existe pelo mesmo motivo que a tabela de chances
 * aparece na página da casa (ciclo 44): quem joga tem direito de ver a própria
 * realidade, não só os momentos bons. Contabiliza a partir do ciclo 45 — quem
 * já jogava antes começa do zero, e a tela diz isso.
 */
export function getPlayerStats(): { plays: number; wins: number } {
  const db = load();
  return { plays: db.totalPlays ?? 0, wins: db.totalWins ?? 0 };
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
  db.totalWins = (db.totalWins ?? 0) + 1;
  db.xp = (db.xp ?? 0) + XP_PER_WIN;
  save(db);
  return coupon;
}

/**
 * Cupons DO JOGADOR (carteira). Exclui a semente de demonstração de propósito:
 * aqueles cupons representam clientes ANTERIORES da casa — existem só pra o
 * painel do parceiro ter histórico e ter o que validar. Mostrá-los aqui faria
 * quem abre o app pela primeira vez encontrar 16 prêmios que nunca ganhou, o
 * que destrói justamente a credibilidade que o app precisa ter.
 */
export function getCoupons(): Coupon[] {
  return load().coupons.filter((c) => !c.demo);
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

/** Cupons emitidos pela CASA (painel do parceiro) — inclui os de demonstração. */
export function getRestaurantCoupons(restaurantId: string): Coupon[] {
  return load().coupons.filter((c) => c.restaurantId === restaurantId);
}

// --- Validação de cupom no balcão -----------------------------------------
// O garçom digita o código que o cliente mostra. Tudo aqui é por casa: um
// cupom da pizzaria nunca pode ser aceito na churrascaria.

/** Tira espaços (inclusive no meio, de quem digita "AB C123") e sobe a caixa. */
function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

/**
 * Quando o cupom perde a validade. Cupons antigos podem não ter `expiresAt`;
 * pra esses vale a regra da casa: 24h a partir do ganho.
 */
export function couponExpiresAt(coupon: Coupon): Date {
  const declared = coupon.expiresAt ? Date.parse(coupon.expiresAt) : NaN;
  if (!Number.isNaN(declared)) return new Date(declared);
  return new Date(Date.parse(coupon.wonAt) + DAY);
}

export function isCouponExpired(coupon: Coupon, now: number = Date.now()): boolean {
  return couponExpiresAt(coupon).getTime() <= now;
}

/**
 * Busca o cupom desta casa pelo código, ignorando caixa e espaços.
 * Usada por `redeemCouponByCode`; exportada porque uma futura tela de consulta
 * ("só conferir, sem dar baixa") vai precisar exatamente disto.
 */
export function findCouponByCode(restaurantId: string, code: string): Coupon | undefined {
  const norm = normalizeCode(code);
  if (!norm) return undefined;
  return load().coupons.find(
    (c) => c.restaurantId === restaurantId && normalizeCode(c.code) === norm
  );
}

export interface RedeemByCodeResult {
  ok: boolean;
  reason?: "nao-encontrado" | "ja-usado" | "expirado";
  coupon?: Coupon;
}

/**
 * Valida e dá baixa no cupom. Devolve o cupom junto com o motivo pra tela
 * poder dizer *quando* foi usado / *quando* expirou, não só que deu errado.
 * "já usado" vem antes de "expirado": é a informação mais útil no balcão.
 */
export function redeemCouponByCode(restaurantId: string, code: string): RedeemByCodeResult {
  const norm = normalizeCode(code);
  if (!norm) return { ok: false, reason: "nao-encontrado" };
  const db = load();
  const coupon = db.coupons.find(
    (c) => c.restaurantId === restaurantId && normalizeCode(c.code) === norm
  );
  if (!coupon) return { ok: false, reason: "nao-encontrado" };
  if (coupon.redeemedAt) return { ok: false, reason: "ja-usado", coupon };
  if (isCouponExpired(coupon)) return { ok: false, reason: "expirado", coupon };
  coupon.redeemedAt = new Date().toISOString();
  save(db);
  return { ok: true, coupon };
}

/** Cupons da casa que ainda podem ser usados — mais recentes primeiro. */
export function getPendingCoupons(restaurantId: string): Coupon[] {
  const now = Date.now();
  return load()
    .coupons.filter(
      (c) => c.restaurantId === restaurantId && !c.redeemedAt && !isCouponExpired(c, now)
    )
    .sort((a, b) => b.wonAt.localeCompare(a.wonAt));
}

// --- Trava do painel do parceiro -------------------------------------------
//
// O painel gera código de mesa e dá baixa em cupom: nas mãos do cliente sentado
// à mesa, é ficha infinita e cupom queimado. Mora fora do `DB` de propósito —
// "Recomeçar do zero (apresentação)" limpa a operação da casa, não deve
// destravar o caixa nem esquecer o PIN que o dono escolheu.

const PIN_KEY = "betfood-parceiro-pin";
const DESTRAVADO_KEY = "betfood-parceiro-ok";

/** PIN de fábrica. O painel mostra o atual e deixa trocar. */
export const PIN_PADRAO = "1234";

export function getPartnerPin(): string {
  try {
    return localStorage.getItem(PIN_KEY) || PIN_PADRAO;
  } catch {
    return PIN_PADRAO;
  }
}

export function setPartnerPin(pin: string): boolean {
  const limpo = pin.replace(/\D/g, "");
  if (limpo.length !== 4) return false;
  try {
    localStorage.setItem(PIN_KEY, limpo);
  } catch {
    /* modo privado: segue com o PIN de fábrica */
  }
  return true;
}

/** Destravado fica no aparelho: o tablet do caixa não pede PIN o dia todo. */
export function isPartnerUnlocked(): boolean {
  try {
    return localStorage.getItem(DESTRAVADO_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockPartner(pin: string): boolean {
  if (pin.replace(/\D/g, "") !== getPartnerPin()) return false;
  try {
    localStorage.setItem(DESTRAVADO_KEY, "1");
  } catch {
    /* modo privado: destrava só nesta tela */
  }
  return true;
}

export function lockPartner(): void {
  try {
    localStorage.removeItem(DESTRAVADO_KEY);
  } catch {
    /* nada a fazer */
  }
}
