/**
 * Bottom sheet "Como funciona" — explica a economia de FICHAS e deixa explícito
 * que o BetFood NÃO é aposta.
 *
 * Por que existe: o app se chama BetFood e é apresentado a donos de restaurante.
 * A palavra "fichas" aparecia no HUD sem nenhuma explicação de onde vêm, pra que
 * servem e do que se trata. Este sheet é a resposta curta pra isso, e fecha com
 * um selo de credibilidade (sem dinheiro real, sem aposta, fichas não se compram).
 *
 * Sem estado global de propósito: cada tela que abre controla o próprio `open`.
 */
import { useEffect, useRef } from "react";
import { play } from "../lib/sound";

const lineProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* --- Ícones de linha (SVG inline; emoji é proibido na UI) ---------------- */

function ChipLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

function GiftLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
      <path d="M3 7.5h18V11H3V7.5ZM12 7.5V21" />
      <path d="M12 7.5S10.8 3 8.6 3a2.2 2.2 0 0 0 0 4.5H12Z" />
      <path d="M12 7.5S13.2 3 15.4 3a2.2 2.2 0 0 1 0 4.5H12Z" />
    </svg>
  );
}

function CalendarPlusLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 13v5M9.5 15.5h5" />
    </svg>
  );
}

function TableCodeLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3h-3zM20.5 14v3M14 20.5h7" />
    </svg>
  );
}

function TicketLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5V8Z" />
      <path d="M14 6v12" strokeDasharray="2.5 2.5" />
    </svg>
  );
}

function ClockLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

function ShieldLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <path d="M12 3l7.5 3v5.4c0 4.5-3.1 8.3-7.5 9.6-4.4-1.3-7.5-5.1-7.5-9.6V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </svg>
  );
}

function CloseLine({ className }: { className?: string }) {
  return (
    <svg {...lineProps} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

/* --- Conteúdo ------------------------------------------------------------ */

type Tone = "brand" | "amber";

const STEPS: {
  icon: (p: { className?: string }) => React.ReactElement;
  tone: Tone;
  title: string;
  detail: string;
}[] = [
  {
    icon: ChipLine,
    tone: "brand",
    title: "1 jogada = 10 fichas",
    detail: "Fichas são a moeda do app. Cada partida desconta 10 do seu saldo.",
  },
  {
    icon: GiftLine,
    tone: "amber",
    title: "Você começou com 50 fichas",
    detail: "São 5 jogadas de boas-vindas, por conta da casa.",
  },
  {
    icon: CalendarPlusLine,
    tone: "amber",
    title: "+30 fichas grátis todo dia",
    detail: "O bônus diário aparece no topo da tela. É só tocar pra pegar.",
  },
  {
    icon: TableCodeLine,
    tone: "brand",
    title: "O código da mesa credita mais fichas",
    detail: "O restaurante entrega o código na mesa; você resgata e ganha fichas.",
  },
  {
    icon: TicketLine,
    tone: "brand",
    title: "Ganhou? O cupom vai pra sua carteira",
    detail: "É só mostrar o código pro garçom na hora de fechar a conta.",
  },
  {
    icon: ClockLine,
    tone: "amber",
    title: "O cupom vale 24h",
    detail: "E só na casa que emitiu — não dá pra usar em outro restaurante.",
  },
];

/* --- Sheet --------------------------------------------------------------- */

export default function HowItWorks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // onClose vem inline das telas: guardar em ref evita re-assinar o listener a
  // cada render do pai.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Esc fecha (teclado no desktop e no iPad com teclado).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Trava o scroll do body: sem isso o Safari do iPhone rola a página atrás do
  // sheet quando o dedo passa da borda do painel.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Foco vai pro X: leitor de tela anuncia o diálogo e o Esc já funciona.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function close() {
    play("tap", { volume: 0.35 });
    onCloseRef.current();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="howitworks-title"
        onClick={(e) => e.stopPropagation()}
        className="anim-fade-up flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl bg-white"
      >
        {/* Cabeçalho fixo: puxador + título + X de 44px */}
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="howitworks-title" className="font-display text-xl font-black tracking-tight">
                Como funciona
              </h2>
              <p className="mt-0.5 text-[13px] font-medium text-ink/70">
                Você joga com fichas e ganha cupom pra usar no restaurante.
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="press -mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 active:bg-surface"
            >
              <CloseLine className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Corpo rolável */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
          <ul className="grid gap-3.5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const amber = s.tone === "amber";
              return (
                <li
                  key={s.title}
                  className="anim-fade-up flex items-start gap-3"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      amber ? "bg-accent2/20 text-[#8a5a00]" : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="font-display text-[15px] font-bold leading-tight">{s.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{s.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Selo de credibilidade — o ponto mais importante do sheet */}
          <div
            className="anim-fade-up mt-5 flex items-start gap-3 rounded-card border border-accent2/45 bg-accent2/10 p-4"
            style={{ animationDelay: "300ms" }}
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8a5a00]"
            >
              <ShieldLine className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-black leading-tight text-[#8a5a00]">
                Sem dinheiro real, sem aposta
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/70">
                As fichas são só do app: não valem dinheiro, não podem ser compradas e não
                viram dinheiro. Nada é cobrado pra jogar.
              </p>
            </div>
          </div>

        </div>

        {/* Rodapé fixo: em 390x844 o conteúdo passa do sheet e o "Entendi"
            ficava abaixo da dobra, cortado pela borda da tela. */}
        <div className="shrink-0 border-t border-ink/10 bg-white px-5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="button"
            onClick={close}
            className="press w-full rounded-full bg-brand-500 py-3.5 font-display text-[15px] font-black text-white transition-colors active:bg-brand-600"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
