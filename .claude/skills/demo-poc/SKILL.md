---
name: demo-poc
description: Roteiro e preparação da demo/pitch da POC BetFood — sobe o dev server, reseta o estado e guia o fluxo que mais converte na apresentação. Use quando pedirem "demo", "pitch", "apresentar", "ensaiar a POC".
---

# Demo da POC

## Preparar

1. `npm run dev` → http://localhost:5199 (celular na mesma rede: `npx vite --host`).
2. Estado limpo pra ver o onboarding: **aba Parceiro → rodapé → "Recomeçar do
   zero (apresentação)"** apaga tudo do aparelho e volta pra tela de
   boas-vindas. É o jeito de apresentar pra uma pessoa depois da outra sem
   DevTools. (Aba anônima também serve; o app funciona lá, só não guarda nada.)
3. Som do dispositivo LIGADO — os SFX são metade do impacto.
4. **Wi-fi ruim no restaurante não derruba a demo**: em produção um service
   worker (`public/sw.js`) guarda o app e os 13 MP3 na primeira visita, então
   depois disso a POC abre e toca offline. Abra https://betfood.vercel.app uma
   vez no local antes de apresentar. Testar: DevTools → Network → Offline e
   recarregar, ou modo avião no celular depois de ter aberto o app uma vez.

## Roteiro (ordem que converte)

1. **Onboarding** — splash vermelho + 3 slides; encerra em "Começar".
2. **Home games-first** — roleta-herói brilhando; mostrar o HUD: fichas, bônus diário pulsando (resgatar ao vivo: +30 fichas com som).
3. **Girar a roleta** — o momento uau: luzes, som de giro, confetti, cupom com código.
4. **Meus Cupons** — o ticket com código pro garçom ("é isso que o cliente mostra").
5. **Painel do Parceiro** — trocar o chapéu: gerar códigos de mesa, mostrar métricas ("é isso que o restaurante vê").
6. **Fechar o loop** — voltar num restaurante, resgatar o código gerado (+fichas), jogar de novo.

## Mensagens-chave pro pitch

- Não é aposta: fichas não custam dinheiro; é fidelidade gamificada.
- O restaurante controla o custo (códigos e tabela de prêmios são dele).
- Mesmo código roda como webapp, PWA e APK (Capacitor).
