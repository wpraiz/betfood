# BetFood 🎡🍽️

POC de app de mini-games recompensadores para restaurantes parceiros de Natal/RN.
O cliente joga (na mesa, na fila ou antes de sair de casa), ganha cupons reais e
mostra o código ao garçom. O restaurante gera **códigos de mesa** que liberam
jogadas extras durante a permanência. Gamificação de fidelidade — sem dinheiro,
sem aposta, tom leve.

## Rodar

```bash
npm install
npm run dev   # http://localhost:5199
```

## Fluxo da demo

1. **Home** → escolha um restaurante parceiro.
2. Todo mundo tem **1 jogada grátis por dia** por restaurante.
3. Aba **Parceiro** → gere códigos de mesa (é o que o restaurante faria).
4. Volte ao restaurante, digite o código → **+3 jogadas**.
5. Jogue (roleta, raspadinha, quiz, memória) → ganhe cupom → aba **Meus Cupons**.

## APK

Ver `.claude/skills/release-apk/SKILL.md` — resumo: `npx cap add android` (1ª vez),
depois `npm run apk:sync` e `gradlew assembleDebug`.

## Stack

Vite · React 18 · TypeScript · Tailwind 4 · React Router (hash) · Capacitor 7.
Dados em localStorage (`src/lib/store.ts`); schema Supabase pronto em `supabase/schema.sql`.
