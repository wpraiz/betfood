---
name: release-apk
description: Gera o APK Android do BetFood via Capacitor — build web, sync e abertura no Android Studio. Use quando pedirem "gerar APK", "build android" ou "instalar no celular".
---

# Gerar APK

1. Primeira vez apenas: `npx cap add android` (cria a pasta `android/`, que está no .gitignore).
2. `npm run apk:sync` — roda o build web e sincroniza pro projeto Android.
3. APK de debug por linha de comando (não precisa do Android Studio aberto):
   `cd android && .\gradlew assembleDebug` → APK em `android/app/build/outputs/apk/debug/app-debug.apk`.
   Requer JDK 21 e Android SDK instalados; se faltar, `npm run apk:open` abre o Android Studio, que resolve dependências e gera o APK pela UI.
4. Instalar no celular via cabo: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` — ou copiar o APK pro celular.
5. **Portão irreversível:** publicar em loja ou distribuir link público é decisão do José — prepare e pare no checklist.
