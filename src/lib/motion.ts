/**
 * Preferência de menos movimento do sistema, num lugar só.
 *
 * O CSS já desliga as animações (bloco em `src/index.css`), mas o JavaScript
 * também precisa saber: várias esperas do app existem só pra durar a animação.
 * Sem consultar isso, quem pede menos movimento fica olhando uma tela parada
 * pelo tempo do efeito que não está acontecendo (foi o caso da roleta, ciclo 38).
 *
 * Regra de uso: encurte espera DECORATIVA, nunca tempo de LEITURA. Ver o prêmio
 * e entender o resultado leva o mesmo tempo pra todo mundo.
 */
export function reduzMovimento(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );
}
