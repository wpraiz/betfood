# BetFood

POC de app de mini-games recompensadores para restaurantes de Natal/RN. O cliente
joga (na mesa, na fila ou antes de sair de casa), ganha cupons reais e mostra o
código ao garçom; o restaurante valida esse código no caixa. Gamificação de
fidelidade — **sem dinheiro real, sem aposta, sem nada pra comprar**.

**No ar: https://betfood.vercel.app** — abre no navegador e instala pela tela de
início (iPhone: Compartilhar → Adicionar à Tela de Início). Funciona offline
depois da primeira visita.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5199
npm run build    # typecheck + build de produção
```

## Como o app funciona

- **Fichas** são a moeda: 50 de boas-vindas, cada partida custa 10.
- Repõem sozinhas (10 a cada 10 min, até 50), mais **+30 por dia** de bônus e o
  que o **código da mesa** creditar (o restaurante entrega o código ao cliente).
- Ganhou, vira **cupom com código**, válido 24h e só na casa que emitiu.
- O dono valida o código na aba **Parceiro** — a baixa é dada na hora e o mesmo
  cupom não passa duas vezes.
- Progresso: XP por partida, níveis (Bronze → Lenda) e sequência de dias.

## Roteiro da demo

1. **Onboarding** → "Começar".
2. **Home**: roleta em destaque, os quatro jogos e as casas de exemplo.
3. Jogue e ganhe → o cupom cai em **Cupons**.
4. Aba **Parceiro**: gere códigos de mesa e **valide o cupom ganho** (é o momento
   que fecha o argumento com o dono do restaurante).
5. Pra apresentar de novo do zero: **Parceiro → rodapé → "Recomeçar do zero"**.

Roteiro completo e dicas: `.claude/skills/demo-poc/SKILL.md`.

## Stack

Vite · React 18 · TypeScript · Tailwind 4 · React Router (hash) · PWA com service
worker · 13 efeitos sonoros (ElevenLabs) em `public/sounds`.

Dados ficam no aparelho (`src/lib/store.ts`, localStorage) — não há servidor nem
conta de usuário. O modelo equivalente em SQL está em `supabase/schema.sql` para
quando a POC virar produto.

Capacitor está configurado (`capacitor.config.ts`) caso um APK seja necessário,
mas o caminho escolhido foi o PWA: os testes são em iPhone, onde APK não serve.

## Convenções do projeto

`CLAUDE.md` tem a direção visual, as regras de UI (contraste, toque, safe-area),
o contrato dos mini-games e as armadilhas já descobertas. `STATUS.md` registra
cada ciclo de melhoria com o que mudou e por quê.
