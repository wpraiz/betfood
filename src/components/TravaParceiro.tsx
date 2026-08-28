import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { unlockPartner } from "../lib/store";
import { play } from "../lib/sound";

/**
 * Porta do painel do parceiro.
 *
 * O painel gera código de mesa e dá baixa em cupom. Sem trava, o cliente
 * sentado à mesa abre a aba "Parceiro", gera fichas à vontade e ainda queima
 * cupom dos outros — e é a primeira pergunta que um dono de restaurante faz ao
 * ver o app ("o cliente também vê isso?").
 *
 * Não é segurança de verdade: o dado é local e a POC não tem servidor. É trava
 * de balcão, do mesmo tipo que a gaveta do caixa — impede o acidente e o
 * oportunista, e deixa claro pra quem está comprando o produto que existe uma
 * separação entre o lado do cliente e o lado da casa.
 */
export default function TravaParceiro({ onAbrir }: { onAbrir: () => void }) {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const tentar = () => {
    if (pin.length < 4) return;
    if (unlockPartner(pin)) {
      play("coupon");
      onAbrir();
      return;
    }
    play("wrong");
    setErro(true);
    setPin("");
    campo.current?.focus();
  };

  return (
    <div className="min-h-dvh px-5 pb-24 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <div className="anim-fade-up mx-auto max-w-sm rounded-card border border-ink/10 bg-white p-6 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>

        <h1 className="mt-4 font-display text-xl font-bold">Área do restaurante</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
          Aqui é onde a casa gera os códigos de mesa e dá baixa nos cupons no
          caixa. Peça o PIN a quem cuida do salão.
        </p>

        <label htmlFor="pin-parceiro" className="mt-5 block text-xs font-bold uppercase tracking-wide text-ink/70">
          PIN de 4 dígitos
        </label>
        <input
          id="pin-parceiro"
          ref={campo}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setErro(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tentar()}
          // O teclado numérico do celular aparece direto; `password` esconde de
          // quem está do outro lado do balcão.
          inputMode="numeric"
          type="password"
          autoComplete="off"
          placeholder="••••"
          aria-invalid={erro}
          aria-describedby={erro ? "pin-erro" : undefined}
          className={`mt-2 w-full rounded-full border bg-paper px-4 py-3 text-center font-display text-2xl tracking-[0.5em] text-ink outline-none ${
            erro ? "border-brand-500" : "border-ink/15"
          }`}
        />
        {erro && (
          <p id="pin-erro" role="alert" className="mt-2 text-sm font-semibold text-brand-600">
            PIN incorreto. Tente de novo.
          </p>
        )}

        <button
          type="button"
          onClick={tentar}
          disabled={pin.length < 4}
          className="press mt-4 min-h-12 w-full rounded-full bg-brand-500 font-display text-sm font-bold text-white disabled:opacity-40"
        >
          Entrar
        </button>

        {/* Sem beco sem saída: quem caiu aqui por engano volta a jogar. */}
        <Link
          to="/"
          className="press mt-3 flex min-h-11 items-center justify-center text-xs font-semibold text-ink/70 underline underline-offset-4"
        >
          Voltar para os jogos
        </Link>
      </div>
    </div>
  );
}
