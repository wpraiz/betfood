---
name: new-game
description: Cria um novo mini-game do BetFood seguindo o contrato GameDefinition — pasta em src/games/<id>/, registro no registry e regras da casca GamePlay. Use quando pedirem "novo jogo", "adicionar mini-game" ou similar.
---

# Novo mini-game

1. Crie `src/games/<id>/index.tsx` exportando um `GameDefinition` (ver `src/lib/types.ts`):
   - `id` kebab-case, `name`, `tagline` curta em pt-BR, `emoji`, `component`.
2. O componente recebe `GameProps`:
   - `restaurant` — pra tematizar (nome, emoji, accent).
   - `drawPrize()` — sorteia na tabela de prêmios do restaurante (pode vir tier `"none"`).
   - `onFinish(result)` — chamar **exatamente uma vez** no fim; `won: prize.tier !== "none"`.
   - O game NÃO acessa `store.ts`, localStorage nem rotas — a casca `GamePlay.tsx` cuida de jogadas e cupons.
3. Registre no array `GAMES` em `src/games/index.ts`.
4. Estilo: Tailwind, mobile-first dentro de `max-w-md`, tema escuro, acento `brand-*`. Animações CSS ou canvas leves; `canvas-confetti` já está instalado pra celebração.
5. Tom: divertido e não agressivo. Perder = "não foi dessa vez" — nunca pressionar o jogador.
6. Valide com `npm run build`.
