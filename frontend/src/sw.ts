/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Injecté au build par vite-plugin-pwa (injectManifest) — assets à mettre en cache.
precacheAndRoute(self.__WB_MANIFEST);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  conversationId?: string;
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json() as PushPayload;

  event.waitUntil(
    (async () => {
      // Inutile de notifier si l'utilisateur regarde déjà cette conversation.
      if (payload.url) {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const watching = windows.some(
          (c) => c.visibilityState === 'visible' && c.focused && c.url.includes(payload.url!),
        );
        if (watching) return;
      }

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        // Une seule notification par conversation (la dernière remplace la précédente).
        tag: payload.conversationId,
        renotify: Boolean(payload.conversationId),
        data: { url: payload.url ?? '/messagerie' },
      } as NotificationOptions);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? '/messagerie';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
