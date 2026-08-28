import { Suspense, lazy } from "react";

/**
 * QR sob demanda.
 *
 * O encoder (`qrcode-generator`) pesa ~23 KB. Importado direto pela carteira,
 * ele entrava no bundle inicial e todo mundo pagava por um QR que só aparece
 * quando alguém abre o cupom em tela cheia ou imprime os cartões da mesa — o
 * oposto do que o ciclo 63 acabou de fazer com os sons.
 *
 * Com um `lazy` compartilhado, os dois usos (carteira e painel) puxam o MESMO
 * chunk, e só no momento em que um QR precisa existir de fato.
 */
const QrCode = lazy(() => import("./QrCode"));

export default function QrCodeLazy({ value, size = 132 }: { value: string; size?: number }) {
  return (
    <Suspense
      fallback={
        // Espaço reservado do tamanho exato: sem isso o layout salta quando o
        // código chega, e no cartão impresso isso desalinharia o recorte.
        <div
          style={{ width: size, height: size }}
          className="animate-pulse rounded bg-ink/10"
          aria-hidden="true"
        />
      }
    >
      <QrCode value={value} size={size} />
    </Suspense>
  );
}
