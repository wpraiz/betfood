import type { Coupon } from "./types";

/**
 * Cupom empacotado num texto que cabe num QR.
 *
 * Por que existe: nesta POC o estado mora no localStorage de cada aparelho. O
 * cupom nasce no celular do CLIENTE, e o caixa valida no aparelho da CASA — que
 * nunca viu aquele cupom e, portanto, jamais acharia o código. Numa demonstração
 * com dois telefones o fluxo simplesmente não fechava.
 *
 * A solução sem servidor é o próprio cupom viajar: a carteira mostra um QR, o
 * caixa aponta a câmera nativa do celular (nenhuma câmera dentro do app), o link
 * abre o painel do parceiro já com o cupom em mãos, e a baixa fica registrada no
 * aparelho da casa — que é exatamente o lugar certo pro livro-caixa dela.
 *
 * LIMITE HONESTO: isto não é assinatura. O dígito verificador pega digitação
 * errada e QR corrompido, não fraude — quem entender o formato consegue forjar
 * um cupom. Serve pra POC; validade de verdade vem quando houver servidor.
 */

interface Carga {
  /** código curto, o mesmo que a pessoa lê em voz alta */
  c: string;
  /** id da casa */
  r: string;
  /** rótulo do prêmio */
  p: string;
  /** vencimento em epoch ms */
  e: number;
}

/** Base64 que sobrevive a uma URL sem escapar nada. */
function paraBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): string {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Soma simples só pra detectar corrupção — não é segurança. */
function digito(texto: string): string {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 6);
}

export function empacotarCupom(cupom: Coupon, venceEm: number): string {
  const carga: Carga = {
    c: cupom.code,
    r: cupom.restaurantId,
    p: cupom.prizeLabel,
    e: venceEm,
  };
  const corpo = paraBase64Url(JSON.stringify(carga));
  return `${corpo}.${digito(corpo)}`;
}

export type CupomDoQr = { code: string; restaurantId: string; prizeLabel: string; expiresAt: string };

export function desempacotarCupom(token: string): CupomDoQr | null {
  try {
    const [corpo, dv] = token.split(".");
    if (!corpo || !dv || digito(corpo) !== dv) return null;
    const carga = JSON.parse(deBase64Url(corpo)) as Partial<Carga>;
    if (
      typeof carga.c !== "string" ||
      typeof carga.r !== "string" ||
      typeof carga.p !== "string" ||
      typeof carga.e !== "number"
    ) {
      return null;
    }
    return {
      code: carga.c,
      restaurantId: carga.r,
      prizeLabel: carga.p,
      expiresAt: new Date(carga.e).toISOString(),
    };
  } catch {
    return null;
  }
}
