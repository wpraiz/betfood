import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  couponExpiresAt,
  getCoupons,
  getPlayerStats,
  getRestaurant,
  redeemCoupon,
} from "../lib/store";
import { empacotarCupom } from "../lib/cupomToken";
import type { Coupon } from "../lib/types";
import { play } from "../lib/sound";
import FoodPhoto, { thumb } from "../components/FoodPhoto";
import HowItWorks from "../components/HowItWorks";
import QrCode from "../components/QrCodeLazy";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.9" />
      <path d="M12 17.1h.01" />
    </svg>
  );
}

/**
 * Validade do cupom (24h após o ganho). `expiresAt` é opcional no tipo — cupom
 * antigo, salvo antes do campo existir, simplesmente não mostra validade.
 */
function expiryInfo(expiresAt: string | undefined, now: number) {
  if (!expiresAt) return null;
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return null;
  if (at <= now) return { expired: true, label: "Expirado" };

  const d = new Date(at);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dia = d.toDateString();
  const quando =
    dia === new Date(now).toDateString()
      ? "hoje"
      : dia === new Date(now + 86400000).toDateString()
        ? "amanhã"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { expired: false, label: `Vale até ${hora} de ${quando}` };
}

/** URL do app sem a rota — o QR precisa de link absoluto pra abrir em OUTRO aparelho. */
function linkBase(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export default function Wallet() {
  const [, forceUpdate] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [ampliado, setAmpliado] = useState<{ code: string; casa: string; premio: string; token: string } | null>(
    null
  );
  // Cupom vence em 24h: sem este tick a tela mostraria "Vale até" pra sempre em
  // quem deixou o app aberto.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const coupons = getCoupons();
  const stats = getPlayerStats();
  const estaValido = (c: Coupon) => !c.redeemedAt && !expiryInfo(c.expiresAt, now)?.expired;
  const active = coupons.filter(estaValido).length;

  // O cliente abre esta tela na frente do garçom: o cupom que vale tem que
  // estar na primeira dobra. Usados e vencidos viram histórico recolhido.
  const validos = coupons.filter(estaValido);
  const historico = coupons.filter((c) => !estaValido(c));
  const visiveis = historicoAberto ? [...validos, ...historico] : validos;

  return (
    <div>
      {/* Cabeçalho com contador de cupons ativos */}
      <div className="border-b border-ink/10 px-5 pb-7 pt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-600">
              Carteira
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Meus cupons</h1>
          </div>
          <div className="anim-pop shrink-0 rounded-card bg-brand-50 px-4 py-2.5 text-center">
            <div className="font-display text-3xl font-bold leading-none tabular-nums text-brand-600">
              {active}
            </div>
            {/* brand-700 cheio, sem /70: a transparência dava 3,94 de contraste
                sobre o brand-50 do chip (mínimo 4,5). */}
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-brand-700">
              {active === 1 ? "ativo" : "ativos"}
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-ink/70">
          {active > 0
            ? "Prêmio ganho é prêmio seu. Mostra o código pro garçom — vale 24h, só na casa que emitiu."
            : "Seus prêmios caem aqui, prontos pra usar."}
        </p>
      </div>

      <div className="px-5 pb-4 pt-6">
        {/* Empty state ilustrado */}
        {coupons.length === 0 && (
          <div className="anim-fade-up rounded-card border border-dashed border-ink/20 bg-white px-6 py-10 text-center">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto h-16 w-16 text-ink/25"
            >
              <path d="M5 20v-3a2 2 0 0 1 2-2h34a2 2 0 0 1 2 2v3a4 4 0 0 0 0 8v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a4 4 0 0 0 0-8Z" />
              <path d="M31 15v3M31 22.5v3M31 30v3" />
              <path d="m16 20.5 1.5 2.8 3.1.5-2.2 2.2.5 3.1-2.9-1.5-2.9 1.5.5-3.1-2.2-2.2 3.1-.5z" />
            </svg>
            <p className="mt-4 font-display text-lg font-bold">Nenhum cupom ainda</p>
            <p className="mx-auto mt-1 max-w-[28ch] text-xs leading-relaxed text-ink/70">
              Escolhe uma casa, joga e o prêmio cai direto aqui.
            </p>
            <Link
              to="/"
              className="press mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 text-sm font-bold text-white transition-colors active:bg-brand-600"
            >
              Ir jogar
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {visiveis.map((c, i) => {
            const r = getRestaurant(c.restaurantId);
            const used = Boolean(c.redeemedAt);
            const info = expiryInfo(c.expiresAt, now);
            // "Expirado" é um estado próprio: cupom que venceu SEM ter sido
            // usado. Quem já usou continua mostrando só "Usado".
            const expired = !used && Boolean(info?.expired);
            // opacity forte derruba o contraste abaixo de AA (medido 2,45 num
            // caso equivalente no painel). O cupom gasto fica discreto por
            // saturação/carimbo, não por transparência que apaga o texto.
            const dim = used ? "opacity-70" : expired ? "opacity-75" : "";
            const stripe = used ? "#dedbda" : expired ? "#a9a4a2" : "#e31b28";
            return (
              <div
                key={c.id}
                className="anim-fade-up relative overflow-hidden rounded-card bg-white shadow-sm"
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
              >
                {/* Faixa lateral: cor da marca quando vale, cinza quando não */}
                <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} />

                {/* Restaurante + prêmio */}
                <div className={dim}>
                  {/* A casa vira link: o cupom só vale lá, e é de onde se chega
                      ao endereço e ao mapa (ciclo 49). Antes era texto morto. */}
                  <Link
                    to={`/r/${c.restaurantId}`}
                    onClick={() => play("tap")}
                    className="press flex items-center gap-3 p-4 pb-2.5 pl-5"
                  >
                    {/* alt vazio: o nome da casa está no texto ao lado. */}
                    {r && (
                      <FoodPhoto
                        src={thumb(r.photo, 160)}
                        alt=""
                        className="h-11 w-11 rounded-full"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{r?.name}</div>
                      <div className="mt-0.5 truncate text-[11px] text-ink/70">
                        {r?.address ?? new Date(c.wonAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ink/65"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Link>
                  <div className="px-4 pb-3 pl-5 font-display text-lg font-bold leading-snug">
                    {c.prizeLabel}
                  </div>
                </div>

                {/* Validade — fora do bloco esmaecido pra continuar legível */}
                {!used && info && (
                  <div className="px-4 pb-3 pl-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        expired ? "bg-surface text-ink/70" : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      {info.label}
                    </span>
                  </div>
                )}

                {/* Linha de recorte: tracejado + notches */}
                <div className="relative flex items-center">
                  <div className="absolute -left-3 h-6 w-6 rounded-full bg-paper" />
                  <div className="mx-4 ml-5 flex-1 border-t-2 border-dashed border-ink/10" />
                  <div className="absolute -right-3 h-6 w-6 rounded-full bg-paper" />
                </div>

                {/* Código + ação */}
                <div className={`flex items-end justify-between gap-3 p-4 pl-5 pt-3 ${dim}`}>
                  {/* Toque no código abre em tela cheia: quem lê é o garçom, de
                      pé, no salão escuro, olhando o celular do cliente. */}
                  <button
                    type="button"
                    disabled={used || expired}
                    onClick={() => {
                      play("tap");
                      setAmpliado({
                        code: c.code,
                        casa: r?.name ?? "",
                        premio: c.prizeLabel,
                        token: empacotarCupom(c, new Date(couponExpiresAt(c)).getTime()),
                      });
                    }}
                    className="press min-w-0 text-left disabled:cursor-default"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ink/65">
                      Código do cupom
                      {!used && !expired && <span className="ml-1 normal-case">· toque pra ampliar</span>}
                    </div>
                    <div
                      className={`mt-0.5 font-display text-3xl font-bold tracking-[0.12em] ${
                        used || expired ? "text-ink/70" : "text-brand-600"
                      }`}
                    >
                      {c.code}
                    </div>
                  </button>
                  {!used && !expired && (
                    <button
                      className="press inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white px-4 text-xs font-bold text-ink/70 transition-colors active:bg-surface"
                      onClick={() => {
                        play("tap");
                        redeemCoupon(c.id);
                        forceUpdate((n) => n + 1);
                      }}
                    >
                      Marcar usado
                    </button>
                  )}
                </div>

                {/* Carimbo: "Usado" (vermelho) e "Expirado" (tinta) são estados
                    diferentes e têm carimbos diferentes de propósito. */}
                {(used || expired) && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span
                      className={`-rotate-12 rounded-md border-[3px] px-4 py-1 font-display text-2xl font-bold uppercase tracking-[0.3em] ${
                        used
                          ? "border-brand-600/35 text-brand-600/40"
                          : "border-ink/25 text-ink/60"
                      }`}
                    >
                      {used ? "Usado" : "Expirado"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Só histórico: a lista de válidos fica vazia e a tela pareceria
            quebrada sem uma linha explicando e um caminho de volta. */}
        {validos.length === 0 && historico.length > 0 && !historicoAberto && (
          <div className="anim-fade-up rounded-card border border-dashed border-ink/20 bg-white px-6 py-8 text-center">
            <p className="font-display text-base font-bold">Nenhum cupom válido agora</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-xs leading-relaxed text-ink/70">
              Os anteriores já foram usados ou venceram. Joga de novo pra ganhar outro.
            </p>
            <Link
              to="/"
              className="press mt-5 inline-block rounded-full bg-brand-500 px-7 py-3 text-sm font-bold text-white transition-colors active:bg-brand-600"
            >
              Ir jogar
            </Link>
          </div>
        )}

        {/* Histórico: usados e vencidos ficam fora do caminho, mas acessíveis */}
        {historico.length > 0 && (
          <button
            type="button"
            onClick={() => {
              play("tap");
              setHistoricoAberto((v) => !v);
            }}
            aria-expanded={historicoAberto}
            className="press mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/15 text-[13px] font-bold text-ink/70"
          >
            {historicoAberto
              ? "Esconder usados e vencidos"
              : `Ver usados e vencidos (${historico.length})`}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform ${historicoAberto ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Seu histórico: mesma lógica de mostrar a chance antes de jogar
          (ciclo 44) — quem joga tem direito de ver a própria realidade, não só
          os momentos bons. Aparece só depois da primeira partida. */}
      {stats.plays > 0 && (
        <div className="px-5">
          <div className="anim-fade-up rounded-card bg-white p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/70">
              Seu histórico
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/70">
              Você jogou{" "}
              <strong className="font-bold text-ink">
                {stats.plays} {stats.plays === 1 ? "vez" : "vezes"}
              </strong>{" "}
              e ganhou{" "}
              <strong className="font-bold text-ink">
                {stats.wins} {stats.wins === 1 ? "prêmio" : "prêmios"}
              </strong>
              {stats.plays >= 5 && (
                <> — {Math.round((stats.wins / stats.plays) * 100)}% das partidas</>
              )}
              .
            </p>
          </div>
        </div>
      )}

      {/* Rodapé: regra do cupom sempre a um toque, sem beco sem saída */}
      <div className="px-5 pb-8">
        <button
          type="button"
          onClick={() => {
            play("tap");
            setHelpOpen(true);
          }}
          aria-haspopup="dialog"
          aria-expanded={helpOpen}
          className="press mx-auto flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold text-ink/70 active:bg-surface"
        >
          <HelpIcon className="h-4 w-4" />
          Como funciona / regras do cupom
        </button>
      </div>

      {/* Código em tela cheia: fundo escuro e tipo enorme pra leitura à
          distância, num salão com pouca luz. Fecha com um toque em qualquer
          lugar — ninguém quer caçar botão com o garçom esperando. */}
      {ampliado && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Código ${ampliado.code}`}
          onClick={() => setAmpliado(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink px-6 text-center"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">
              {ampliado.casa}
            </p>
            <p className="mt-2 font-display text-lg font-bold text-white/90">{ampliado.premio}</p>
          </div>
          <p className="font-display text-[12vw] font-black leading-none tracking-[0.08em] text-white">
            {ampliado.code}
          </p>

          {/* O cupom nasce no celular do cliente e o caixa valida no aparelho da
              CASA, que nunca viu esse código (nesta POC o estado é local). O QR
              faz o cupom viajar: a câmera nativa do caixa abre o painel já com
              ele. Digitar o código continua funcionando quando é o mesmo
              aparelho. Ver src/lib/cupomToken.ts. */}
          <div className="rounded-2xl bg-white p-2.5">
            <QrCode value={`${linkBase()}#/parceiro?v=${ampliado.token}`} size={168} />
          </div>
          <p className="max-w-[26ch] text-xs leading-relaxed text-white/60">
            O caixa pode apontar a câmera no código — ou digitar {ampliado.code}.
            Toque pra fechar.
          </p>
        </div>
      )}

      <HowItWorks open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
