/**
 * Convite — o único jeito de o usuário chamar alguém de dentro do app.
 *
 * POR QUE EXISTE
 * --------------
 * A POC cresce por boca a boca no WhatsApp. Antes disso só o José conseguia
 * distribuir o link; quem gostava do jogo não tinha como passar adiante sem
 * copiar a URL da barra do navegador (que no PWA instalado nem existe).
 *
 * ESCADA DE FALLBACK (do melhor pro pior, sem beco sem saída)
 * ----------------------------------------------------------
 * 1. `navigator.share` — no iPhone abre o share sheet nativo, com WhatsApp em
 *    primeiro lugar. É o caminho feliz e o motivo do componente existir.
 * 2. `navigator.clipboard.writeText` — copia e confirma "Link copiado" por ~2s.
 * 3. URL visível e selecionável — se nem a área de transferência colaborar
 *    (Safari fora de HTTPS, permissão negada), o usuário ainda consegue copiar
 *    na unha. Nenhum caminho termina em nada acontecendo.
 *
 * A URL nunca é hardcoded: sai de `location.origin + location.pathname`, então
 * funciona igual em vercel.app, em localhost e em qualquer domínio futuro.
 * O `pathname` (sem hash) é de propósito — o convidado entra pela Home, não na
 * tela em que quem convidou estava.
 */
import { useEffect, useRef, useState } from "react";
import { play } from "../lib/sound";

const INVITE_TITLE = "BetFood";
const INVITE_TEXT =
  "Tô jogando no BetFood: mini-games que valem cupom de verdade em restaurante aqui de Natal. " +
  "É de graça, não tem aposta e não precisa instalar nada. Bora jogar?";

/** Link de convite do host atual — sem hash, cai sempre na Home. */
function inviteUrl(): string {
  return window.location.origin + window.location.pathname;
}

/* --- Ícones (SVG inline; emoji é proibido na UI) ------------------------- */

const lineProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Nós ligados por linhas: o "compartilhar" universal, não o quadrado do iOS. */
function ShareNodes({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg {...lineProps} className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.4 10.8 7.2-4.2M8.4 13.2l7.2 4.2" />
    </svg>
  );
}

function CheckLine({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg {...lineProps} strokeWidth={2.2} className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function ChevronLine({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg {...lineProps} strokeWidth={2} className={className} aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

/* --- Componente ---------------------------------------------------------- */

type Status = "idle" | "copied" | "manual";

export default function ShareButton({
  variant = "card",
  className = "",
  style,
}: {
  variant?: "card" | "inline";
  className?: string;
  style?: React.CSSProperties;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  function flash(next: Status) {
    setStatus(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    // "manual" fica na tela: é a saída de emergência e o usuário precisa
    // conseguir selecionar a URL com calma.
    if (next === "copied") {
      timerRef.current = window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  async function share() {
    play("tap");
    const link = inviteUrl();
    setUrl(link);

    // 1. Share sheet nativo (iOS, Android, alguns desktops).
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: INVITE_TITLE, text: INVITE_TEXT, url: link });
        return;
      } catch (err) {
        // Cancelar no share sheet não é falha: não mostrar fallback nenhum,
        // senão parece que o app não entendeu o "deixa pra lá".
        if (err instanceof DOMException && err.name === "AbortError") return;
        /* qualquer outro erro (NotAllowedError etc.): tenta copiar */
      }
    }

    // 2. Área de transferência.
    try {
      await navigator.clipboard.writeText(link);
      flash("copied");
      return;
    } catch {
      /* sem permissão / contexto inseguro: mostra a URL na mão */
    }

    // 3. URL visível pra copiar manualmente.
    flash("manual");
  }

  const copied = status === "copied";

  if (variant === "inline") {
    return (
      <div className={className} style={style}>
        <button
          type="button"
          onClick={share}
          className="press inline-flex min-h-[44px] items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 font-display text-[14px] font-bold text-ink"
        >
          <span className={copied ? "text-brand-600" : "text-ink/70"} aria-hidden="true">
            {copied ? <CheckLine className="h-[18px] w-[18px]" /> : <ShareNodes className="h-[18px] w-[18px]" />}
          </span>
          {copied ? "Link copiado" : "Convidar um amigo"}
        </button>
        <ManualUrl show={status === "manual"} url={url} />
        <Live copied={copied} />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <button
        type="button"
        onClick={share}
        className="press flex w-full items-center gap-3 rounded-card border border-accent2/45 bg-accent2/10 px-4 py-3.5 text-left"
      >
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ${
            copied ? "text-brand-600" : "text-[#8a5a00]"
          }`}
        >
          {copied ? <CheckLine /> : <ShareNodes />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-bold leading-tight">
            {copied ? "Link copiado" : "Chame a galera"}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink/70">
            {copied
              ? "Agora é só colar no WhatsApp do seu amigo."
              : "Convide um amigo pra jogar — é de graça e o cupom é de verdade."}
          </span>
        </span>
        {!copied && <ChevronLine className="h-4 w-4 shrink-0 text-ink/65" />}
      </button>
      <ManualUrl show={status === "manual"} url={url} />
      <Live copied={copied} />
    </div>
  );
}

/** Último degrau: a URL na tela, selecionável, quando nada automático rolou. */
function ManualUrl({ show, url }: { show: boolean; url: string }) {
  if (!show) return null;
  return (
    <div className="anim-fade-up mt-2 rounded-card border border-ink/10 bg-white px-4 py-3">
      <p className="text-[12px] font-semibold text-ink/65">Copie e mande pro seu amigo:</p>
      <p className="mt-1 select-all break-all font-mono text-[13px] font-medium text-ink/70">
        {url}
      </p>
    </div>
  );
}

/** Confirmação também pra leitor de tela — o "Link copiado" visual é rápido. */
function Live({ copied }: { copied: boolean }) {
  return (
    <span aria-live="polite" className="sr-only">
      {copied ? "Link copiado para a área de transferência" : ""}
    </span>
  );
}
