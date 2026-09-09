const CACHE = "maliks-group-hub-shell-v8";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.svg",
  "/powerbuild-app-icon-192.png",
  "/powerbuild-app-icon-512.png",
  "/powerbuild-logo-transparent.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  let data = { title: "Maliks Group Hub", body: "You have a new task.", taskId: 0, url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/powerbuild-app-icon-192.png",
        badge: "/powerbuild-app-icon-192.png",
        tag: data.taskId ? `task-${data.taskId}` : "hub-task",
        renotify: true,
        data: { taskId: data.taskId, url: data.url || "/" },
      }),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) =>
        Promise.all(clients.map((client) => client.postMessage({ type: "hub-push-notification", notification: data }))),
      ),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({ type: "hub-open-inbox" });
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    request.mode === "navigate"
  )
    return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    }),
  );
});
