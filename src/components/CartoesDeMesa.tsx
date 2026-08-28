import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import QrCode from "./QrCodeLazy";
import { CHIP_COST } from "../lib/store";
import type { TableCode } from "../lib/types";

/**
 * Folha de cartões pra recortar e pôr na mesa.
 *
 * É a ponte física que faltava: o painel mandava "imprima como QR" e não
 * gerava QR nenhum, então o dono da casa teria que produzir isso por fora.
 * Cada cartão tem QR PRÓPRIO, com o código embutido (`?c=CODIGO`): quem
 * aponta a câmera cai na casa certa já com as fichas creditadas, sem digitar
 * nada. O código impresso embaixo é a saída manual — leitor de QR falhando em
 * mesa mal iluminada não pode travar o cliente.
 *
 * Vai num portal em `document.body` porque a impressão esconde `#root`
 * inteiro (regra em index.css): assim o cartão não herda nada do app —
 * nem barra, nem HUD, nem fundo colorido gastando tinta.
 */
export default function CartoesDeMesa({
  codigos,
  casa,
  link,
  onFechar,
}: {
  codigos: TableCode[];
  casa: string;
  link: string;
  onFechar: () => void;
}) {
  const fechar = useRef<HTMLButtonElement>(null);

  // A folha cobre o app inteiro: é modal de fato, então Escape fecha e o foco
  // entra nela. Sem isso, quem usa teclado continuava tabulando pelo painel
  // atrás da folha, invisível.
  useEffect(() => {
    fechar.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return createPortal(
    <div
      id="impressao"
      className="fixed inset-0 z-[60] overflow-auto bg-white p-4 pt-[env(safe-area-inset-top)]"
      role="dialog"
      aria-modal="true"
      aria-label="Cartões de mesa para imprimir"
    >
      <div className="nao-imprime mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-base font-bold">
            {codigos.length} {codigos.length === 1 ? "cartão" : "cartões"} pra imprimir
          </div>
          <p className="text-xs text-ink/70">Recorte e deixe um em cada mesa.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            ref={fechar}
            onClick={onFechar}
            className="press min-h-11 rounded-full border border-ink/15 px-4 text-xs font-bold text-ink/70"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="press min-h-11 rounded-full bg-ink px-4 text-xs font-bold text-white"
          >
            Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {codigos.map((c) => (
          <div
            key={c.code}
            className="flex break-inside-avoid flex-col items-center gap-2 rounded-xl border border-dashed border-black/35 p-3 text-center"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-black/60">
              Jogue enquanto espera
            </div>
            <QrCode value={`${link}?c=${c.code}`} size={104} />
            <div className="text-[10px] leading-tight text-black/60">
              Aponte a câmera — as fichas caem sozinhas
            </div>
            <div className="font-display text-lg font-bold tracking-[0.12em] text-black">
              {c.code}
            </div>
            <div className="text-[10px] leading-tight text-black/60">
              vale {c.credits * CHIP_COST} fichas · {casa}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
