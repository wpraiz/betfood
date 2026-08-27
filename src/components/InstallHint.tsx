/**
 * Dica de instalação na tela de início — só para iPhone/iPad no Safari.
 *
 * POR QUE EXISTE
 * --------------
 * O link da POC circula por WhatsApp. No Android/Chrome existe o prompt nativo
 * de instalação (`beforeinstallprompt`); **no iOS não existe nada**. Sem uma
 * instrução explícita, o amigo abre o link, usa o app dentro do Safari (com
 * barra de endereço comendo a tela, sem ícone, sem tela cheia) e nunca vê o
 * BetFood "de verdade". A instalação lá é 100% manual:
 * Compartilhar → "Adicionar à Tela de Início".
 *
 * REGRAS DE CONVIVÊNCIA
 * ---------------------
 * - Só aparece se as TRÊS condições valerem: é iOS, é Safari, não está em
 *   standalone. Já instalado ou em outro browser, o componente não renderiza nada.
 * - Nunca na primeira impressão: espera a primeira interação (com uma folga pra
 *   não pular embaixo do dedo) ou ~8s de leitura — o que vier primeiro.
 * - Uma dispensa vale pra sempre (`betfood-install-hint` no localStorage).
 * - Quem decide se pode aparecer na tela atual é o Layout: durante a partida
 *   (modo imersivo) o componente nem é montado.
 */
import { useEffect, useRef, useState } from "react";
import { play } from "../lib/sound";

const DISMISS_KEY = "betfood-install-hint";
/** Tempo máximo de espera antes de aparecer sozinho. */
const IDLE_DELAY_MS = 8000;
/** Folga depois da primeira interação: evita a faixa surgir sob o dedo. */
const INTERACTION_DELAY_MS = 1400;

/* --- Detecção ------------------------------------------------------------ */

/** Já roda como app instalado (PWA na tela de início ou APK/webview). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    /* matchMedia indisponível: cai no legado abaixo */
  }
  // Propriedade legada e só-do-Safari: não existe nos tipos do DOM.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone/iPod/iPad — inclui o iPadOS que se disfarça de Mac no user agent. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPhone|iPod|iPad/i.test(navigator.userAgent)) return true;
  return navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform);
}

/**
 * Safari de verdade. No iOS todo browser é WebKit, mas só o Safari tem o
 * "Adicionar à Tela de Início" no menu de compartilhar — mandar essa instrução
 * pra quem está no Chrome/Firefox/Edge do iPhone seria mentira.
 */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  // CriOS = Chrome, FxiOS = Firefox, EdgiOS = Edge, OPiOS/OPT = Opera,
  // GSA = app do Google. Todos WebKit, nenhum com o item no share sheet.
  if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo/i.test(ua)) return false;
  return /Safari/i.test(ua);
}

/** Já dispensou a dica alguma vez. */
function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/* --- Ícones (SVG inline; emoji é proibido na UI) ------------------------- */

/** Ícone de compartilhar do iOS: quadrado aberto com seta pra cima saindo dele. */
function ShareIOS({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8.5 10.5H6.5A1.5 1.5 0 0 0 5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7a1.5 1.5 0 0 0-1.5-1.5h-2" />
      <path d="M12 3v11" />
      <path d="m8.4 6.4 3.6-3.6 3.6 3.6" />
    </svg>
  );
}

/** Ícone de "adicionar": quadrado com um +, ecoando o item do menu do iOS. */
function AddSquare({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function CloseLine({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

/* --- Componente ---------------------------------------------------------- */

export default function InstallHint() {
  // Avaliado uma única vez, na montagem: nada disso muda durante a sessão.
  const [eligible] = useState(() => isIOSSafari() && !isStandalone() && !wasDismissed());
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!eligible) return;

    const show = (delay: number) => {
      if (timerRef.current !== null) return; // já agendado: não reagenda
      timerRef.current = window.setTimeout(() => setVisible(true), delay);
    };

    const onFirstTouch = () => show(INTERACTION_DELAY_MS);
    // `once` garante que só a PRIMEIRA interação conta; passive não bloqueia scroll.
    window.addEventListener("pointerdown", onFirstTouch, { once: true, passive: true });
    window.addEventListener("scroll", onFirstTouch, { once: true, passive: true });

    // Rede de segurança pra quem só lê a tela sem tocar em nada.
    const idle = window.setTimeout(() => setVisible(true), IDLE_DELAY_MS);

    return () => {
      window.removeEventListener("pointerdown", onFirstTouch);
      window.removeEventListener("scroll", onFirstTouch);
      window.clearTimeout(idle);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [eligible]);

  if (!eligible || !visible) return null;

  function dismiss() {
    play("tap", { volume: 0.35 });
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* modo privado sem storage: ao menos some nesta sessão */
    }
    setVisible(false);
  }

  return (
    <div
      role="complementary"
      aria-label="Instalar o BetFood na tela de início"
      // z-30: acima da tab bar, abaixo dos sheets (picker z-40, diálogos z-50).
      // Fica ancorado logo acima da tab bar, respeitando a safe area do iPhone.
      className="anim-fade-up fixed bottom-[calc(env(safe-area-inset-bottom)+3.75rem)] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3 pb-2"
    >
      <div className="flex items-start gap-3 rounded-card border border-ink/10 bg-white px-4 py-3 shadow-lg">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        >
          <ShareIOS className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[14px] font-bold leading-tight">
            Instale o BetFood na tela de início
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">
            Toque em{" "}
            <span className="inline-flex translate-y-[3px] items-center justify-center rounded-md bg-surface px-1 py-0.5 text-ink/70">
              <ShareIOS className="h-4 w-4" />
            </span>{" "}
            na barra do Safari e depois em{" "}
            <span className="whitespace-nowrap font-semibold text-ink/70">
              <span className="inline-flex translate-y-[3px] items-center justify-center rounded-md bg-surface px-1 py-0.5">
                <AddSquare className="h-4 w-4" />
              </span>{" "}
              “Adicionar à Tela de Início”
            </span>
            . Abre em tela cheia, com ícone.
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar dica de instalação"
          className="press -mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/65 active:bg-surface"
        >
          <CloseLine className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
