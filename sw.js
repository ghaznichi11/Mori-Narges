self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Mori ❤️ Narges",
    body: "یک یادداشت جدید برایت ثبت شده ❤️",
    icon: "./icon-192.png",
    badge: "./icon-192.png"
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json()
      };
    } catch (error) {
      console.error("Push data error:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      data: {
        url: "./"
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("./");
      }
    })
  );
});
