const CACHE_NAME = "sudoku-v2";

self.addEventListener("install", (event) => {
  // Activate immediately without waiting for old SW clients to close
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  // Delete old caches but do NOT call clients.claim().
  // clients.claim() forces SW to take over already-open pages mid-flight,
  // which causes Next.js to detect stale HMR chunks and reload — creating a loop.
  // Without it, this SW controls all future navigations which is enough for offline.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);

      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached ?? new Response("Offline", { status: 503 }));

      if (cached) {
        networkFetch.catch(() => {});
        return cached;
      }

      return networkFetch;
    }),
  );
});
