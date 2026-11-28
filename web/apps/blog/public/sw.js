// dev.goraebap 정적 사이트용 경량 서비스 워커.
// 빌드 시 vite.config.ts가 __PWA_CACHE_VERSION__을 현재 빌드 해시로 치환한다.
const CACHE_PREFIX = "goraebap-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}__PWA_CACHE_VERSION__`;
const CORE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 디자인 시스템 레지스트리(/r/)와 데모 iframe(/demos/)은 항상 최신 네트워크 응답을 사용한다.
  if (url.pathname.startsWith("/r/") || url.pathname.startsWith("/demos/")) return;

  // 문서 탐색(HTML): 온라인에서는 최신 배포본을 우선 받고, 오프라인일 때 캐시로 폴백한다.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = (await cache.match(request)) || (await cache.match("/"));
          return (
            cached ||
            new Response("오프라인 상태입니다. 네트워크에 연결한 뒤 다시 시도해 주세요.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
    return;
  }

  // 해시된 정적 번들(/assets/): 캐시 우선
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  // 아이콘·이미지·매니페스트: 캐시 즉시 반환 + 백그라운드 갱신
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/thumbnails/") ||
    url.pathname.startsWith("/banners/") ||
    url.pathname === "/favicon.svg" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      }),
    );
  }
});
