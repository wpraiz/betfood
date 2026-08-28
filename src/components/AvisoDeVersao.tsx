import { useEffect, useRef, useState } from "react";

/**
 * Aviso de versão nova.
 *
 * Navegação é network-first, então qualquer recarga completa já pega o deploy
 * novo. O problema é quem NÃO recarrega: o app instalado na tela de início do
 * iPhone fica aberto por dias. A pessoa segue num bundle de ontem sem nenhum
 * sinal — inclusive numa demonstração, mostrando uma versão velha achando que
 * é a atual (foi o custo do ciclo 46: 18h de deploys invisíveis).
 *
 * Por que NÃO usar o evento de atualização do service worker: `sw.js` é
 * idêntico entre builds, então o navegador não vê diferença nenhuma e o evento
 * nunca dispara. E quando dispara, dispara na carga em que o usuário JÁ está na
 * versão nova — avisaria errado.
 *
 * O sinal honesto é outro: comparar o build que ESTE documento carregou
 * (`__BUILD_ID__`, congelado no bundle) com o que o servidor está publicando
 * agora (`version.json`). Diferente = este documento está velho.
 */

/** Espaço mínimo entre consultas: voltar pro app não pode virar enxurrada. */
const INTERVALO_MS = 60_000;

export default function AvisoDeVersao() {
  const [temNova, setTemNova] = useState(false);
  const ultimaChecagem = useRef(0);

  useEffect(() => {
    let vivo = true;

    const checar = async () => {
      if (temNova) return;
      const agora = Date.now();
      if (agora - ultimaChecagem.current < INTERVALO_MS) return;
      ultimaChecagem.current = agora;
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { id } = await res.json();
        if (vivo && id && id !== __BUILD_ID__) setTemNova(true);
      } catch {
        // Sem rede (o app funciona offline): tenta de novo na próxima volta.
      }
    };

    const aoVoltar = () => {
      if (document.visibilityState === "visible") void checar();
    };

    void checar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [temNova]);

  if (!temNova) return null;

  return (
    <div
      role="status"
      className="anim-fade-up fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)]"
    >
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="press flex min-h-11 items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-white shadow-lg shadow-ink/25"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-2.6-6.4" />
          <path d="M21 3v6h-6" />
        </svg>
        <span className="text-xs font-bold">Versão nova · toque pra atualizar</span>
      </button>
    </div>
  );
}
