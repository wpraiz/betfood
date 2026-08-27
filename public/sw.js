/* BetFood — service worker da POC (sem libs, servido cru de public/).
   Objetivo: depois da primeira visita o app abre sem internet e os 13 SFX
   já estão em disco (no iOS o som chegava depois da animação).
   Versionar CACHE é o que impede versão nova de ficar presa em cache velho. */

const CACHE = "betfood-v1";

const SOUNDS = [
  "spin", "win", "lose", "scratch", "coupon", "tap", "flip",
  "correct", "wrong", "shimmer", "levelup", "tick", "jackpot",
];

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  ...SOUNDS.map((n) => `./sounds/${n}.mp3`),
];

// allSettled: um arquivo que falhe não pode abortar a instalação inteira.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const ASSET = /\/(assets|sounds|icons)\//;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST e afins nunca passam por aqui
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Unsplash/fontes: direto pra rede

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
  } else if (ASSET.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
  }
});

// Navegação: rede primeiro (pega deploy novo), cache do index.html como rede reserva.
// HashRouter => index.html serve qualquer rota.
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cc = fresh.headers.get("cache-control") || "";
    if (fresh.status === 200 && !cc.includes("no-store")) {
      const cache = await caches.open(CACHE);
      await cache.put("./index.html", fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match("./index.html", { cacheName: CACHE });
    return cached || Response.error();
  }
}

// Assets: cache primeiro (instantâneo e offline), atualizando por baixo.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) {
    revalidate(cache, request);
    return partial(request, cached);
  }
  const fresh = await fetch(request);
  if (fresh.status === 200) await cache.put(request, fresh.clone());
  return fresh;
}

function revalidate(cache, request) {
  if (request.headers.has("range")) return;
  fetch(request)
    .then((res) => (res.status === 200 ? cache.put(request, res) : null))
    .catch(() => {});
}

// Safari pede os MP3 por Range e recusa um 200 inteiro: fatiamos o cacheado em 206.
async function partial(request, cached) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (!m || cached.status !== 200) return cached;
  const buf = await cached.arrayBuffer();
  const total = buf.byteLength;
  const suffix = m[1] === "" && m[2] !== "";
  const start = suffix ? Math.max(0, total - Number(m[2])) : Number(m[1] || 0);
  const end = suffix || m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
  if (start > end || start >= total) return new Response(null, { status: 416 });
  const slice = buf.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": cached.headers.get("content-type") || "application/octet-stream",
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${start}-${end}/${total}`,
    },
  });
}
