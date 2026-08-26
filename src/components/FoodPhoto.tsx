// Foto de comida com skeleton shimmer, carregamento preguiçoso e fallback.
// Componente único — substitui as cópias que existiam espalhadas nas páginas.
import { useState } from "react";

type Status = "loading" | "ok" | "error";

/**
 * Reescreve o parâmetro `w=` de uma URL do Unsplash para pedir uma imagem
 * do tamanho certo (miniaturas não precisam baixar a foto do card grande).
 * Se a URL não tiver `w=`, o parâmetro é acrescentado.
 */
export function thumb(url: string, w: number): string {
  if (!url) return url;
  if (/([?&])w=\d+/.test(url)) return url.replace(/([?&])w=\d+/, `$1w=${w}`);
  return url + (url.includes("?") ? "&" : "?") + `w=${w}`;
}

export default function FoodPhoto({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const initial = (alt.trim()[0] ?? "?").toUpperCase();
  // React 18 não conhece a prop camelCase `fetchPriority` (só o 19) e joga um
  // warning de prop desconhecida no console. Emitimos o atributo já em
  // minúsculas, que é o que o browser lê.
  const priorityAttrs: Record<string, string> = priority ? { fetchpriority: "high" } : {};

  return (
    <div className={`relative shrink-0 overflow-hidden bg-surface ${className}`}>
      {/* Pulse só enquanto carrega — para tanto no sucesso quanto no erro. */}
      {status === "loading" && <div className="absolute inset-0 animate-pulse bg-surface" />}

      {status === "error" ? (
        <div
          aria-label={alt}
          role="img"
          className="flex h-full w-full items-center justify-center bg-brand-50"
        >
          <span className="font-display text-lg font-black text-brand-600">{initial}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "auto" : "async"}
          {...priorityAttrs}
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            status === "ok" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
