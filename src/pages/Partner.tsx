import { useRef, useState, type ReactNode } from "react";
import confetti from "canvas-confetti";
import {
  clearDemoData,
  couponExpiresAt,
  DAILY_BONUS_CHIPS,
  WELCOME_CHIPS,
  generateTableCodes,
  getPendingCoupons,
  getRestaurantCoupons,
  getRestaurants,
  getTableCodes,
  hasCustomPrizes,
  hasDemoData,
  isPartnerUnlocked,
  lockPartner,
  getPartnerPin,
  setPartnerPin,
  resetPrizeLabels,
  setPrizeLabel,
  redeemCouponByCode,
  type RedeemByCodeResult,
} from "../lib/store";
import { play } from "../lib/sound";
import FoodPhoto, { thumb } from "../components/FoodPhoto";
import QrCode from "../components/QrCode";
import CartoesDeMesa from "../components/CartoesDeMesa";
import TravaParceiro from "../components/TravaParceiro";

const CONFETTI_COLORS = ["#e31b28", "#f5a623", "#ffffff"];
const CODIGOS_VISIVEIS = 5; // resto entra em "ver todos"

/** "26/08/2026 às 19:04" — o parceiro precisa do horário, não só do dia. */
function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const dia = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}

/** Quanto falta pra expirar, em linguagem de balcão. */
function timeLeftLabel(until: Date, now: number): string {
  const ms = until.getTime() - now;
  if (ms <= 0) return "expirado";
  const horas = Math.floor(ms / 3_600_000);
  const minutos = Math.floor((ms % 3_600_000) / 60_000);
  if (horas >= 1) return `vence em ${horas}h${minutos > 0 ? ` ${minutos}min` : ""}`;
  return `vence em ${Math.max(1, minutos)}min`;
}

function Metric({
  label,
  value,
  icon,
  chip,
  delay,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  chip: string;
  delay: number;
}) {
  return (
    <div
      className="anim-fade-up rounded-card border border-ink/10 bg-white p-4 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${chip}`}>
        <LineIcon>{icon}</LineIcon>
      </div>
      <div className="font-display text-4xl font-bold leading-none tabular-nums text-ink">
        {value}
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.15em] text-ink/65">
        {label}
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  // 44x44 de área clicável (mínimo de toque), círculo visual dentro.
  const btn =
    "press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/70 shadow-sm disabled:opacity-30";
  return (
    <div className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-ink/65">
        {label}
      </span>
      <div className="flex items-center justify-between gap-1 rounded-card bg-paper p-1.5">
        <button
          type="button"
          className={btn}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
        <button
          type="button"
          className={btn}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Ícone de linha 24x24 — nada de emoji na UI. */
function LineIcon({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Um argumento do bloco "Por que ter o BetFood na casa". */
function Reason({
  icon,
  chip,
  title,
  text,
}: {
  icon: ReactNode;
  chip: string;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${chip}`}>
        <LineIcon>{icon}</LineIcon>
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-bold leading-snug text-ink">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink/70">{text}</p>
      </div>
    </li>
  );
}

/** Um passo do "como funciona na prática" — aqui o número É informação. */
function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-sm font-bold tabular-nums text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="font-display text-sm font-bold leading-snug text-ink">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-ink/70">{text}</p>
      </div>
    </li>
  );
}

/**
 * Porta antes do painel. O painel tem dezenas de hooks, então a trava não pode
 * ser um early return lá dentro — precisa ser este componente separado.
 */
export default function Partner() {
  const [destravado, setDestravado] = useState(isPartnerUnlocked);
  if (!destravado) return <TravaParceiro onAbrir={() => setDestravado(true)} />;
  return <PainelParceiro aoSair={() => setDestravado(false)} />;
}

function PainelParceiro({ aoSair }: { aoSair: () => void }) {
  const restaurants = getRestaurants();
  const [selected, setSelected] = useState(restaurants[0].id);
  const [qty, setQty] = useState(5);
  const [credits, setCredits] = useState(3);
  const [, forceUpdate] = useState(0);

  // Validação de cupom no balcão
  const [typedCode, setTypedCode] = useState("");
  const [check, setCheck] = useState<{ typed: string; res: RedeemByCodeResult } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // A lista de códigos é material de consulta: mostrar 12 de uma vez empurrava
  // as ações do dia a dia (validar, gerar) pra fora da tela.
  const [verTodosCodigos, setVerTodosCodigos] = useState(false);
  // Argumento de venda: começa fechado pra não atrapalhar quem só quer operar.
  const [whyOpen, setWhyOpen] = useState(false);

  const now = Date.now();
  const codes = getTableCodes(selected);
  const coupons = getRestaurantCoupons(selected);
  const pending = getPendingCoupons(selected);
  const codesVisiveis = verTodosCodigos ? codes : codes.slice(0, CODIGOS_VISIVEIS);
  const codesUsed = codes.filter((c) => c.usedAt).length;
  // Só código ainda não usado vira cartão: imprimir um código gasto é papel
  // fora e cliente frustrado na mesa.
  const naoUsados = codes.filter((c) => !c.usedAt);
  const couponsRedeemed = coupons.filter((c) => c.redeemedAt).length;
  const restaurantName = restaurants.find((r) => r.id === selected)?.name ?? "esta casa";
  const showClearDemo = hasDemoData();

  // Este número é uma AFIRMAÇÃO feita ao dono do restaurante sobre o próprio
  // custo dele — não pode ser escrito à mão. Sai da tabela de prêmios da casa
  // selecionada: se alguém mudar os pesos, o texto acompanha.
  // Edição do rótulo do prêmio (a promessa "a tabela é sua" virando ação).
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  function salvarPremio(prizeId: string) {
    setPrizeLabel(selected, prizeId, rascunho);
    setEditando(null);
    play("coupon", { volume: 0.4 });
    forceUpdate((n) => n + 1);
  }

  const linkDaCasa = `${window.location.origin}${window.location.pathname}#/r/${selected}`;
  const [copiado, setCopiado] = useState(false);
  const [imprimindo, setImprimindo] = useState(false);
  const [trocandoPin, setTrocandoPin] = useState(false);
  const [novoPin, setNovoPin] = useState("");
  const [pinSalvo, setPinSalvo] = useState(false);
  function copiarLink() {
    play("tap");
    navigator.clipboard?.writeText(linkDaCasa).then(
      () => {
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2000);
      },
      () => {
        /* sem permissão de área de transferência: o link fica visível pra copiar à mão */
      }
    );
  }

  const casaAtual = restaurants.find((r) => r.id === selected);
  const pesoTotal = casaAtual?.prizes.reduce((s, p) => s + p.weight, 0) ?? 0;
  const pesoSemPremio =
    casaAtual?.prizes.filter((p) => p.tier === "none").reduce((s, p) => s + p.weight, 0) ?? 0;
  const chanceSemPremio = pesoTotal > 0 ? Math.round((pesoSemPremio / pesoTotal) * 100) : 0;

  /** Troca de casa zera o que era da casa anterior (código digitado e resultado). */
  function selectRestaurant(id: string) {
    setSelected(id);
    setTypedCode("");
    setCheck(null);
    setConfirmClear(false);
  }

  function validateCode() {
    const typed = typedCode.trim();
    if (!typed) {
      inputRef.current?.focus();
      return;
    }
    const res = redeemCouponByCode(selected, typed);
    setCheck({ typed, res });
    if (res.ok) {
      play("coupon");
      // Confetti discreto: é o balcão do restaurante, não a tela de vitória.
      confetti({
        particleCount: 45,
        spread: 55,
        startVelocity: 26,
        scalar: 0.8,
        origin: { y: 0.28 },
        colors: CONFETTI_COLORS,
      });
      setTypedCode(""); // pronto pro próximo cliente
    } else {
      play("wrong"); // erro mantém o texto pra corrigir o dígito errado
    }
    forceUpdate((n) => n + 1);
  }

  /** Mensagem do card de erro, por motivo. */
  function errorText(res: RedeemByCodeResult, typed: string): { title: string; hint: string } {
    if (res.reason === "ja-usado" && res.coupon?.redeemedAt) {
      return {
        title: `Esse cupom já foi usado em ${formatDateTime(res.coupon.redeemedAt)}`,
        hint: `${res.coupon.prizeLabel} — a baixa já tinha sido dada.`,
      };
    }
    if (res.reason === "expirado" && res.coupon) {
      return {
        title: `Cupom expirado em ${formatDateTime(couponExpiresAt(res.coupon))}`,
        hint: `${res.coupon.prizeLabel} — cupom vale 24h depois de ganho.`,
      };
    }
    return {
      title: "Código não encontrado nesta casa",
      hint: `Nenhum cupom com "${typed.toUpperCase()}" em ${restaurantName}. Confira as letras com o cliente.`,
    };
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="anim-fade-up border-b border-ink/10 px-5 pb-7 pt-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
          Painel do parceiro
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sua casa</h1>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/70">
          Valide cupons no caixa, gere códigos de mesa e acompanhe o movimento da sua casa.
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {/* Seletor de restaurante com foto */}
        <div className="anim-fade-up mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/65">
          Restaurante
        </div>
        <div className="anim-fade-up -mx-5 mb-6 flex gap-2.5 overflow-x-auto px-5 pb-1">
          {restaurants.map((r) => {
            const on = r.id === selected;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRestaurant(r.id)}
                className={`press flex min-h-11 shrink-0 items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors ${
                  on ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-white"
                }`}
              >
                {/* alt vazio: o nome da casa já vem no texto ao lado — repetir
                    faria o leitor de tela anunciar duas vezes. */}
                <FoodPhoto src={thumb(r.photo, 160)} alt="" className="h-8 w-8 rounded-full" />
                <span
                  className={`whitespace-nowrap text-sm font-semibold ${
                    on ? "text-brand-700" : "text-ink/70"
                  }`}
                >
                  {r.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Validar cupom — primeira coisa que o dono usa no balcão */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "20ms" }}
        >
          {/* h2 de verdade: o h3 dos cupons pendentes vem logo abaixo e a
              hierarquia precisa ser h1 → h2 → h3 pra leitor de tela. */}
          <h2 className="font-display text-base font-bold">Validar cupom</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            Digite o código que o cliente mostrou. Se estiver valendo, a baixa é dada na hora.
          </p>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              validateCode();
            }}
          >
            <input
              ref={inputRef}
              value={typedCode}
              onChange={(e) => {
                setTypedCode(e.target.value.toUpperCase());
                if (check) setCheck(null); // digitou de novo: resultado anterior sai da frente
              }}
              placeholder="XXXXXX"
              aria-label="Código do cupom"
              maxLength={12}
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              className="min-h-11 w-full min-w-0 flex-1 rounded-card border border-ink/15 bg-paper px-4 py-3 text-center font-display text-2xl font-bold uppercase tracking-[0.25em] text-ink placeholder:tracking-[0.2em] placeholder:text-ink/55 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              className="press min-h-11 shrink-0 rounded-card bg-brand-500 px-5 text-sm font-bold text-white transition-colors active:bg-brand-600 disabled:opacity-40"
              disabled={typedCode.trim().length === 0}
            >
              Validar
            </button>
          </form>

          {/* Resultado */}
          {check && check.res.ok && check.res.coupon && (
            <div className="anim-pop mt-3 rounded-card border border-emerald-600/25 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                    Cupom válido · {check.res.coupon.code}
                  </div>
                  <div className="mt-1 font-display text-lg font-bold leading-snug text-emerald-950">
                    {check.res.coupon.prizeLabel}
                  </div>
                  <div className="mt-1.5 text-xs leading-relaxed text-emerald-900/80">
                    Ganho em {formatDateTime(check.res.coupon.wonAt)} · valia até{" "}
                    {formatDateTime(couponExpiresAt(check.res.coupon))}
                  </div>
                  <div className="mt-2.5 inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                    Resgatado agora
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="press mt-3 min-h-11 w-full rounded-card border border-emerald-600/25 text-xs font-bold text-emerald-900"
                onClick={() => {
                  play("tap");
                  setCheck(null);
                  inputRef.current?.focus();
                }}
              >
                Validar outro cupom
              </button>
            </div>
          )}

          {check && !check.res.ok && (
            <div className="anim-pop mt-3 rounded-card border border-brand-500/25 bg-brand-50 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="h-4 w-4"
                  >
                    <path d="M12 7v6M12 16.5v.5" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold leading-snug text-brand-700">
                    {errorText(check.res, check.typed).title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink/70">
                    {errorText(check.res, check.typed).hint}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="press mt-3 min-h-11 w-full rounded-card border border-brand-500/25 text-xs font-bold text-brand-700"
                onClick={() => {
                  play("tap");
                  setCheck(null);
                  inputRef.current?.focus();
                }}
              >
                Tentar de novo
              </button>
            </div>
          )}

          {/* Cupons pendentes — atalho pra demo e visão do que está em aberto */}
          <div className="mt-4 border-t border-ink/10 pt-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/65">
                Cupons pendentes desta casa
              </h3>
              <span className="text-[11px] font-semibold tabular-nums text-ink/65">
                {pending.length}
              </span>
            </div>
            {pending.length === 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-ink/70">
                Nenhum cupom em aberto agora — cupom vale 24h depois de ganho.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-ink/5">
                {pending.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="press flex min-h-11 w-full items-center gap-3 py-2.5 text-left"
                      onClick={() => {
                        play("tap");
                        setTypedCode(c.code);
                        setCheck(null);
                        inputRef.current?.focus();
                      }}
                    >
                      <span className="font-display text-base font-bold tracking-[0.18em] text-brand-600">
                        {c.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-ink/70">
                        {c.prizeLabel}
                      </span>
                      <span className="shrink-0 rounded-full bg-accent2/15 px-2.5 py-1 text-[10px] font-bold text-[#8a5a00]">
                        {timeLeftLabel(couponExpiresAt(c), now)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="mb-6 grid grid-cols-2 gap-2.5">
          <Metric
            label="Códigos gerados"
            value={codes.length}
            delay={60}
            chip="bg-brand-50 text-brand-600"
            icon={
              <>
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <path d="M14 14h3v3h-3zM20 17v3h-3" />
              </>
            }
          />
          <Metric
            label="Códigos usados"
            value={codesUsed}
            delay={130}
            chip="bg-surface text-ink/60"
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
              </>
            }
          />
          <Metric
            label="Cupons ganhos"
            value={coupons.length}
            delay={200}
            chip="bg-accent2/15 text-accent2"
            icon={
              <>
                <path d="M3 11.5v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2.5 2.5 0 0 0 0-5Z" />
                <path d="M14 7.5v2M14 12v2M14 16.5v2" />
              </>
            }
          />
          <Metric
            label="Cupons resgatados"
            value={couponsRedeemed}
            delay={270}
            chip="bg-brand-100 text-brand-700"
            icon={
              <path d="m12 3 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 15.6l-5.1 2.8 1.1-5.6L3.8 8.9l5.7-.7z" />
            }
          />
        </div>

        {/* Número cru não diz nada pro dono; a leitura sim. Só aparece quando há
            base pra falar de proporção — senão viraria "0% de 0". */}
        {(codes.length > 0 || coupons.length > 0) && (
          <p
            className="anim-fade-up mt-3 text-[13px] leading-relaxed text-ink/70"
            style={{ animationDelay: "300ms" }}
          >
            {codes.length > 0 && (
              <>
                <strong className="font-bold text-ink">
                  {Math.round((codesUsed / codes.length) * 100)}%
                </strong>{" "}
                dos códigos entregues viraram jogada
              </>
            )}
            {codes.length > 0 && coupons.length > 0 && " · "}
            {coupons.length > 0 && (
              <>
                <strong className="font-bold text-ink">
                  {couponsRedeemed} de {coupons.length}
                </strong>{" "}
                cupons ganhos voltaram pra casa
              </>
            )}
            .
          </p>
        )}

        {/* Gerador com steppers */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "340ms" }}
        >
          <div className="mb-4 font-display text-base font-bold">Gerar códigos de mesa</div>
          <div className="mb-4 flex gap-3">
            <Stepper label="Códigos" value={qty} min={1} max={50} onChange={setQty} />
            <Stepper
              label="Jogadas por código"
              value={credits}
              min={1}
              max={20}
              onChange={setCredits}
            />
          </div>
          <button
            className="press w-full rounded-card bg-brand-500 py-3.5 text-sm font-bold text-white transition-colors active:bg-brand-600"
            onClick={() => {
              play("tap");
              generateTableCodes(selected, qty, credits);
              forceUpdate((n) => n + 1);
            }}
          >
            Gerar {qty} {qty === 1 ? "código" : "códigos"} · {credits}{" "}
            {credits === 1 ? "jogada" : "jogadas"} cada
          </button>
        </div>

        {/* Sua tabela de prêmios: o painel afirma que a tabela é do dono, então
            ela precisa estar VISÍVEL — é a primeira pergunta que ele faz. A
            chance sai dos pesos, não é escrita à mão. */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "310ms" }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-display text-base font-bold">Sua tabela de prêmios</div>
            {hasCustomPrizes(selected) && (
              <button
                type="button"
                onClick={() => {
                  play("tap");
                  resetPrizeLabels(selected);
                  setEditando(null);
                  forceUpdate((n) => n + 1);
                }}
                className="press shrink-0 text-[11px] font-semibold text-ink/65 underline underline-offset-4"
              >
                Voltar ao padrão
              </button>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            É daqui que sai todo prêmio desta casa — e só daqui. Toque num prêmio
            pra trocar o que ele oferece; a chance de cada um é o peso no sorteio.
          </p>
          <ul className="mt-3 divide-y divide-ink/10">
            {(casaAtual?.prizes ?? []).map((p) => {
              const chance = pesoTotal > 0 ? Math.round((p.weight / pesoTotal) * 100) : 0;
              const semPremio = p.tier === "none";
              // Em edição: input no lugar do texto. Só o rótulo muda — a chance
              // é do produto e continua ao lado, pra ninguém achar que mexeu.
              if (editando === p.id) {
                return (
                  <li key={p.id} className="flex items-center gap-2 py-2">
                    <input
                      autoFocus
                      value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") salvarPremio(p.id);
                        if (e.key === "Escape") setEditando(null);
                      }}
                      maxLength={60}
                      className="min-h-11 min-w-0 flex-1 rounded-card border border-brand-500 bg-paper px-3 text-[13px] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => salvarPremio(p.id)}
                      className="press min-h-11 shrink-0 rounded-full bg-ink px-4 text-xs font-bold text-white"
                    >
                      Salvar
                    </button>
                  </li>
                );
              }
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  {semPremio ? (
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink/65">
                      {p.label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        play("tap");
                        setRascunho(p.label);
                        setEditando(p.id);
                      }}
                      className="press flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                        {p.label}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-ink/40"
                      >
                        <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
                        <path d="m14.5 5.5 4 4" />
                      </svg>
                    </button>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${
                      semPremio
                        ? "bg-surface text-ink/65"
                        : p.tier === "big"
                          ? "bg-accent2/15 text-[#8a5a00]"
                          : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {chance}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Link direto da casa: é o que vira QR na mesa ou vai pro Instagram.
            Agora funciona até pra quem nunca abriu o app — o onboarding devolve
            a pessoa nesta casa em vez de despejar na Home (ciclo 29). */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "320ms" }}
        >
          <div className="font-display text-base font-bold">Link desta casa</div>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            Manda pro cliente ou imprime como QR na mesa. Quem abrir cai direto
            em {restaurantName}, mesmo sem nunca ter usado o app.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="shrink-0 rounded-xl border border-ink/10 bg-white p-1.5">
              <QrCode value={linkDaCasa} size={92} />
            </div>
            <div className="min-w-0 flex-1">
              <code className="block truncate rounded-full bg-paper px-3 py-2.5 text-[12px] text-ink/70">
                {linkDaCasa}
              </code>
              <button
                type="button"
                onClick={copiarLink}
                className="press mt-2 min-h-11 w-full rounded-full bg-ink px-4 text-xs font-bold text-white"
              >
                {copiado ? "Copiado" : "Copiar link"}
              </button>
            </div>
          </div>
          {naoUsados.length > 0 && (
            <button
              type="button"
              onClick={() => setImprimindo(true)}
              className="press mt-3 min-h-11 w-full rounded-full border border-ink/15 px-4 text-xs font-bold text-ink/70"
            >
              Imprimir cartões de mesa ({naoUsados.length})
            </button>
          )}
        </div>

        {/* Como funciona na prática — liga os blocos que já estão nesta tela */}
        <div
          className="anim-fade-up mb-3 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "360ms" }}
        >
          <div className="font-display text-base font-bold">Como funciona na prática</div>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">
            Três passos, todos nesta mesma tela.
          </p>
          <ol className="mt-4 space-y-4">
            <Step
              n={1}
              title="Entregue o código na mesa"
              text="Gere a leva em “Gerar códigos de mesa”, aqui em cima, e passe o código na comanda, no cartão da mesa ou de boca."
            />
            <Step
              n={2}
              title="O cliente joga e ganha o cupom"
              text="Ele digita o código no app, recebe as jogadas que você definiu e joga ali mesmo. Se premiar, o cupom cai na carteira dele valendo 24 horas."
            />
            <Step
              n={3}
              title="Você valida no caixa"
              text="Na hora de fechar a conta, digite o código do cupom em “Validar cupom”, no topo desta tela. A baixa é dada na hora e o mesmo cupom não passa duas vezes."
            />
          </ol>
        </div>

        {/* Por que ter o BetFood na casa — colapsável, fechado por padrão */}
        <div
          className="anim-fade-up mb-6 rounded-card border border-ink/10 bg-white p-4 shadow-sm"
          style={{ animationDelay: "400ms" }}
        >
          <button
            type="button"
            aria-expanded={whyOpen}
            aria-controls="por-que-betfood"
            className="press flex min-h-11 w-full items-center justify-between gap-3 text-left"
            onClick={() => {
              play("tap");
              setWhyOpen((v) => !v);
            }}
          >
            <span className="min-w-0">
              <span className="block font-display text-base font-bold">
                Por que ter o BetFood na casa
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink/70">
                O que isso muda no seu salão, em quatro pontos.
              </span>
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-ink/70 transition-transform duration-200 ${
                whyOpen ? "rotate-180" : ""
              }`}
            >
              <LineIcon className="h-4 w-4">
                <path d="m6 9 6 6 6-6" />
              </LineIcon>
            </span>
          </button>

          {whyOpen && (
            <ul id="por-que-betfood" className="anim-fade-up mt-4 space-y-4 border-t border-ink/10 pt-4">
              <Reason
                chip="bg-brand-50 text-brand-600"
                title="O cliente fica mais tempo — e volta"
                text="A jogada acontece na mesa, enquanto ele espera o pedido. O cupom que ele ganha vale 24 horas e só nesta casa: pra usar, ele precisa voltar aqui."
                icon={
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7.5V12l3 2" />
                  </>
                }
              />
              <Reason
                chip="bg-accent2/15 text-[#8a5a00]"
                title="Você define o prêmio e só paga quando ele volta"
                text={`A tabela de prêmios é sua: nada sai dela sem você ter posto lá. Qualquer pessoa pode jogar com as fichas de cortesia do app — isso é o que traz gente nova — e os códigos que você entrega dão fichas extras a quem já está na mesa. Nem toda jogada premia: a faixa “não foi dessa vez” pesa ${chanceSemPremio}% do sorteio. E o custo só existe quando alguém aparece aqui com um cupom válido.`}
                icon={
                  <>
                    <path d="M4 7h8M17 7h3M4 17h3M12 17h8" />
                    <circle cx="14.5" cy="7" r="2.2" />
                    <circle cx="9.5" cy="17" r="2.2" />
                  </>
                }
              />
              <Reason
                chip="bg-surface text-ink/70"
                title="Não é aposta e não custa nada pro cliente"
                text={`As fichas são do próprio app: ele ganha ${WELCOME_CHIPS} ao entrar e mais ${DAILY_BONUS_CHIPS} por dia. Não se compram fichas e não há dinheiro do cliente em jogo em momento nenhum.`}
                icon={
                  <>
                    <path d="M12 3.5 5 6.2v5c0 4.2 2.9 7.6 7 9.3 4.1-1.7 7-5.1 7-9.3v-5Z" />
                    <path d="m9.2 12 2 2 3.6-4" />
                  </>
                }
              />
              <Reason
                chip="bg-brand-100 text-brand-700"
                title="Dá pra medir"
                text="Códigos gerados, códigos usados, cupons ganhos e cupons resgatados ficam nas quatro métricas desta tela. Você vê quanto entregou e quanto voltou pro caixa."
                icon={
                  <>
                    <path d="M4 20h16" />
                    <path d="M7.5 20v-5M12 20V8M16.5 20v-8" />
                  </>
                }
              />
            </ul>
          )}
        </div>

        {/* Lista de códigos */}
        <div
          className="anim-fade-up mb-2 flex items-baseline justify-between"
          style={{ animationDelay: "460ms" }}
        >
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink/65">
            Códigos da casa
          </h2>
          <span className="text-[11px] font-semibold text-ink/65">
            {codesUsed}/{codes.length} usados
          </span>
        </div>
        {codes.length === 0 && (
          <p
            className="anim-fade-up rounded-card border border-dashed border-ink/20 bg-white p-5 text-center text-xs text-ink/70"
            style={{ animationDelay: "500ms" }}
          >
            Nenhum código gerado ainda — crie a primeira leva acima.
          </p>
        )}
        <div
          className="anim-fade-up divide-y divide-ink/5 overflow-hidden rounded-card border border-ink/10 bg-white shadow-sm empty:hidden"
          style={{ animationDelay: "500ms" }}
        >
          {codesVisiveis.map((c) => (
            <div key={c.code} className="flex items-center justify-between px-4 py-3">
              {/* Código usado é apagado pela COR, não por opacity: opacity-40
                  derrubava o contraste pra 2,45 (mínimo 4,5) e o dono do
                  restaurante ainda precisa conseguir ler o código. */}
              <span
                className={`font-display text-base font-bold tracking-[0.2em] ${
                  c.usedAt ? "text-ink/65" : ""
                }`}
              >
                {c.code}
              </span>
              {c.usedAt ? (
                <span className="rounded-full bg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-ink/65">
                  Usado
                </span>
              ) : (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700">
                  {c.credits} {c.credits === 1 ? "jogada" : "jogadas"}
                </span>
              )}
            </div>
          ))}
        </div>

        {codes.length > CODIGOS_VISIVEIS && (
          <button
            type="button"
            onClick={() => {
              play("tap");
              setVerTodosCodigos((v) => !v);
            }}
            aria-expanded={verTodosCodigos}
            className="press mt-3 min-h-11 w-full rounded-full border border-ink/15 text-[13px] font-bold text-ink/70"
          >
            {verTodosCodigos
              ? "Mostrar só os recentes"
              : `Ver todos os ${codes.length} códigos`}
          </button>
        )}

        {/* Rodapé: zerar a semente antes de gerar códigos ao vivo no pitch */}
        {showClearDemo && (
          <div className="mt-8 border-t border-ink/10 pt-5 text-center">
            {confirmClear ? (
              <div className="anim-fade-up">
                <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-ink/70">
                  Apagar os códigos e cupons de exemplo de todas as casas? Só sai o que veio da
                  demonstração — o que você gerou e jogou fica.
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <button
                    type="button"
                    className="press min-h-11 rounded-full border border-ink/15 bg-white px-5 text-xs font-bold text-ink/70"
                    onClick={() => {
                      play("tap");
                      setConfirmClear(false);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="press min-h-11 rounded-full bg-brand-500 px-5 text-xs font-bold text-white transition-colors active:bg-brand-600"
                    onClick={() => {
                      play("tap");
                      clearDemoData();
                      setConfirmClear(false);
                      setCheck(null);
                      setTypedCode("");
                      forceUpdate((n) => n + 1);
                    }}
                  >
                    Apagar exemplos
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="press inline-flex min-h-11 items-center px-4 text-xs font-semibold text-ink/65 underline underline-offset-4"
                onClick={() => {
                  play("tap");
                  setConfirmClear(true);
                }}
              >
                Limpar dados de demonstração
              </button>
            )}
          </div>
        )}

        {/* Ferramenta de apresentação: entre uma pessoa e outra, volta o app ao
            estado de estreia (inclusive o onboarding). Fica aqui, nos bastidores
            do painel, longe de quem só está jogando. */}
        <div className="mt-6 text-center">
          {confirmReset ? (
            <div className="anim-fade-up">
              <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-ink/70">
                Recomeçar do zero apaga <strong>tudo</strong> deste aparelho — fichas, cupons,
                códigos e progresso — e mostra a tela de boas-vindas de novo. Serve pra
                apresentar pra outra pessoa.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  className="press min-h-11 rounded-full border border-ink/15 bg-white px-5 text-xs font-bold text-ink/70"
                  onClick={() => {
                    play("tap");
                    setConfirmReset(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="press min-h-11 rounded-full bg-ink px-5 text-xs font-bold text-white"
                  onClick={() => {
                    try {
                      Object.keys(localStorage)
                        .filter((k) => k.startsWith("betfood-"))
                        .forEach((k) => localStorage.removeItem(k));
                    } catch {
                      /* modo privado: segue e recarrega mesmo assim */
                    }
                    window.location.hash = "#/welcome";
                    window.location.reload();
                  }}
                >
                  Apagar tudo e recomeçar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="press inline-flex min-h-11 items-center px-4 text-xs font-semibold text-ink/65 underline underline-offset-4"
              onClick={() => {
                play("tap");
                setConfirmReset(true);
              }}
            >
              Recomeçar do zero (apresentação)
            </button>
          )}

          {/* Acesso: sair devolve o aparelho ao cliente; trocar o PIN é o que
              faz a trava ser da CASA e não do app. */}
          <div className="mt-4 border-t border-ink/10 pt-4">
            {trocandoPin ? (
              <div>
                <label htmlFor="novo-pin" className="block text-xs font-bold uppercase tracking-wide text-ink/70">
                  Novo PIN (4 dígitos)
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="novo-pin"
                    value={novoPin}
                    onChange={(e) => {
                      setNovoPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setPinSalvo(false);
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={getPartnerPin()}
                    className="min-w-0 flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-center font-display text-lg tracking-[0.4em] outline-none"
                  />
                  <button
                    type="button"
                    disabled={novoPin.length < 4}
                    onClick={() => {
                      if (setPartnerPin(novoPin)) {
                        play("coupon");
                        setPinSalvo(true);
                        setNovoPin("");
                      }
                    }}
                    className="press min-h-11 shrink-0 rounded-full bg-ink px-4 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Salvar
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink/70">
                  {pinSalvo ? "PIN trocado. Ele vale no próximo acesso." : `PIN atual: ${getPartnerPin()}`}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    play("tap");
                    lockPartner();
                    aoSair();
                  }}
                  className="press min-h-11 rounded-full border border-ink/15 px-4 text-xs font-bold text-ink/70"
                >
                  Sair do painel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    play("tap");
                    setTrocandoPin(true);
                  }}
                  className="press min-h-11 rounded-full border border-ink/15 px-4 text-xs font-bold text-ink/70"
                >
                  Trocar PIN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {imprimindo && (
        <CartoesDeMesa
          codigos={naoUsados}
          casa={restaurantName}
          link={linkDaCasa}
          onFechar={() => setImprimindo(false)}
        />
      )}
    </div>
  );
}
