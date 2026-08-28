import { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * QR em SVG puro, gerado no aparelho.
 *
 * Por que SVG e não canvas/imagem de serviço externo: o cartão da mesa é feito
 * pra IMPRIMIR. Canvas sai serrilhado no papel e um `<img>` apontando pra API
 * de terceiro simplesmente não aparece se o restaurante estiver sem internet na
 * hora de imprimir — que é exatamente quando o dono vai usar isso.
 *
 * Correção de erro em nível M: o cartão fica em cima de mesa de restaurante e
 * vai levar respingo. M aguenta ~15% do código danificado.
 */
export default function QrCode({ value, size = 132 }: { value: string; size?: number }) {
  const path = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let linha = 0; linha < n; linha++) {
      for (let coluna = 0; coluna < n; coluna++) {
        if (qr.isDark(linha, coluna)) d += `M${coluna} ${linha}h1v1h-1z`;
      }
    }
    return { d, n };
  }, [value]);

  return (
    <svg
      viewBox={`-1 -1 ${path.n + 2} ${path.n + 2}`}
      width={size}
      height={size}
      role="img"
      aria-label="Código QR do link desta casa"
      shapeRendering="crispEdges"
    >
      {/* A margem clara faz parte do padrão: sem ela o leitor não acha o código. */}
      <rect x={-1} y={-1} width={path.n + 2} height={path.n + 2} fill="#ffffff" />
      <path d={path.d} fill="#201e1d" />
    </svg>
  );
}
