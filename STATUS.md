# STATUS — BetFood POC

Atualizado: 2026-08-26 (fim de tarde)

## O que estávamos fazendo

POC completa pra apresentação de hoje com o Allan: app de mini-games
recompensadores pra restaurantes de Natal. Dia inteiro de iteração de design
guiada pelo José até travar em: **iFood épico, claro, sem emoji, games-first,
dopaminérgico** (fichas, XP, streak, som, motion).

## Pronto (commitado em main, GitHub wpraiz/betfood)

- App completo: onboarding /welcome, Home com fotos, 4 games (roleta, raspadinha, quiz, memória), carteira de cupons, painel do parceiro.
- 13 SFX ElevenLabs em public/sounds + src/lib/sound.ts.
- Economia de fichas + XP/níveis + streak em src/lib/store.ts.
- 6 skills em .claude/skills (frontend-design, ui-ux-pro-max, web-design-guidelines, react-best-practices, new-game, release-apk, demo-poc).
- CLAUDE.md atualizado com a direção visual e as regras.

## Em andamento / próxima ação

1. Workflow "betfood-epico-ifood": verificador final (build + teste de browser + commit) — conferir se commitou.
2. **Passe dopaminérgico final** (aguardando o commit do verificador pra não conflitar): HUD no Layout (fichas com count-up + tick, bônus diário pulsando, streak, nível), Home games-first (roleta-herói girando com luzes + shimmer, thumbnails ricas dos jogos, restaurantes abaixo), near-miss na roleta, XP flutuante no resultado.
3. Build + push + **deploy preview na Vercel** (José já autorizou preview? — ele pediu o plano; o "sobe" final é dele). Team: jose-icaro-bezerra-clementes-projects.

## Bloqueios / atenção

- Disco C: viveu 0 bytes hoje; ~7 GB livres após limpezas. Faxina pendente.
- Wiki jibcl-wiki não conhece este projeto (nasceu hoje).
