/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Injecté au build par vite-plugin-pwa (injectManifest) : assets à mettre en cache.
precacheAndRoute(self.__WB_MANIFEST);
