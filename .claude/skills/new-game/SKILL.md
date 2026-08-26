---
name: new-game
description: Cria um novo mini-game do BetFood seguindo o contrato GameDefinition — pasta em src/games/<id>/, registro no registry, estilo iFood épico com som e motion. Use quando pedirem "novo jogo", "adicionar mini-game" ou similar.
---

# Novo mini-game

1. Leia antes: `CLAUDE.md` (direção visual) e `.claude/skills/frontend-design/SKILL.md`.
2. Crie `src/games/<id>/index.tsx` exportando um `GameDefinition` (ver `src/lib/types.ts`): `id` kebab-case, `name`, `tagline` curta pt-BR, `component`. **Sem campo emoji.**
3. O componente recebe `GameProps`:
   - `restaurant` — tematize com `name`, `accent`, `photo`.
   - `drawPrize()` — fonte ÚNICA do resultado (pode vir tier `"none"`). O jogo é apresentação; nunca decida o prêmio por conta própria.
   - `onFinish(result)` — exatamente uma vez (guarde com ref); `won = prize.tier !== "none"`. Sem acessar store/localStorage/rotas.
4. Estilo: claro, `brand-500` vermelho de ação, `accent2` âmbar pra prêmio, `rounded-card`, SEM emoji (SVG inline), motion com `.anim-fade-up`/`.anim-pop`/`.press`.
5. Som: `import { play, stop } from "../../lib/sound"` — use os 13 SFX existentes (tap, win, lose, correct, wrong, flip, tick, jackpot…). Vitória: confetti (`canvas-confetti`, cores #ea1d2c #f5a623 #ffffff) + `play("win")` (ou `jackpot` em tier big).
6. Registre em `src/games/index.ts` e adicione a thumbnail do jogo na Home (grade de jogos).
7. Valide com `npm run build`.
