self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let payload = { title: "Timeless 复习提醒", body: "今天有知识卡等待复习。", url: "/" };
  try { payload = { ...payload, ...event.data.json() }; } catch (error) { void error; }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: "cortex-review",
    data: { url: payload.url },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
