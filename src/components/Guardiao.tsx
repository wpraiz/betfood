import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Rede de proteção contra tela branca.
 *
 * Sem isto, qualquer exceção em qualquer render desmonta a árvore inteira e
 * sobra uma página em branco — o pior desfecho possível num app que é
 * apresentado ao vivo pra dono de restaurante.
 *
 * O caso mais provável não é nem um bug de lógica: é **chunk de jogo que não
 * baixa**. Os jogos são `React.lazy`, então o `import()` acontece no toque. Duas
 * situações reais:
 *
 * 1. Offline num jogo que a pessoa nunca abriu (o service worker só tem em
 *    cache o que já foi baixado uma vez).
 * 2. Deploy novo com a aba antiga aberta: o `index` velho pede um chunk que já
 *    não existe mais no servidor.
 *
 * O caso 2 se resolve sozinho recarregando — o index novo aponta pros chunks
 * novos. Então a gente recarrega **uma vez por sessão** (trava em
 * sessionStorage, senão vira laço de recarga) e, se ainda assim falhar, mostra
 * uma saída de verdade em vez do branco.
 */

const CHAVE_RETENTATIVA = "betfood-recarregou-por-chunk";

/** Falha de `import()` dinâmico, nas várias redações de cada navegador. */
function ehFalhaDeChunk(erro: unknown): boolean {
  const msg = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro);
  return /dynamically imported module|Importing a module script failed|error loading dynamically|ChunkLoadError|Failed to fetch/i.test(
    msg,
  );
}

interface Estado {
  erro: Error | null;
  deChunk: boolean;
}

export default class Guardiao extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { erro: null, deChunk: false };

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro, deChunk: ehFalhaDeChunk(erro) };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // Sem serviço de telemetria nesta POC: o console é o que o José tem se
    // precisar entender o que aconteceu depois de uma demonstração.
    console.error("[BetFood] tela protegida pelo Guardiao:", erro, info.componentStack);

    if (!ehFalhaDeChunk(erro) || !navigator.onLine) return;
    try {
      if (sessionStorage.getItem(CHAVE_RETENTATIVA)) return;
      sessionStorage.setItem(CHAVE_RETENTATIVA, "1");
      window.location.reload();
    } catch {
      /* modo privado: segue pro aviso na tela */
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;

    const semRede = this.state.deChunk && !navigator.onLine;

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">
          {semRede ? "Esse jogo precisa de internet" : "Alguma coisa travou aqui"}
        </h1>
        <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-ink/70">
          {semRede
            ? "Os jogos que você já abriu funcionam offline. Este ainda não foi baixado — conecte e tente de novo."
            : "Nada do que você ganhou se perdeu: fichas e cupons ficam guardados no aparelho."}
        </p>

        <div className="mt-7 grid w-full max-w-[16rem] gap-2.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="press min-h-12 rounded-full bg-brand-500 font-display text-sm font-bold text-white"
          >
            Tentar de novo
          </button>
          {/* `href` cru, não `<Link>`: o router pode ser justamente o que
              quebrou, e esta tela precisa funcionar sem ele. */}
          <a
            href="#/"
            onClick={() => {
              try {
                sessionStorage.removeItem(CHAVE_RETENTATIVA);
              } catch {
                /* segue */
              }
              window.location.reload();
            }}
            className="press flex min-h-11 items-center justify-center text-xs font-semibold text-ink/70 underline underline-offset-4"
          >
            Voltar para o início
          </a>
        </div>
      </main>
    );
  }
}
