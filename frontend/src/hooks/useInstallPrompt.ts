import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function detectIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Appareil mobile/tablette : écran tactile principal (pointer: coarse), UA mobile, ou iPadOS
// (qui se présente comme un Mac mais avec écran multi-touch). Indépendant de la largeur de fenêtre.
function detectMobileDevice() {
  const nav = window.navigator;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    /android|iphone|ipad|ipod|mobile/i.test(nav.userAgent) ||
    (/macintosh/i.test(nav.userAgent) && nav.maxTouchPoints > 1)
  );
}

// État au niveau module : beforeinstallprompt peut se déclencher avant le montage
// de tout composant, donc on l'écoute dès l'import du module (importé dans main.tsx).
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let standalone = typeof window !== 'undefined' && detectStandalone();
const isIOS = typeof window !== 'undefined' && detectIos();
const isMobileDevice = typeof window !== 'undefined' && detectMobileDevice();
const listeners = new Set<() => void>();
// Snapshot immuable : useSyncExternalStore exige une référence stable entre deux changements.
let snapshot = { canInstall: false, isStandalone: standalone };

function emit() {
  snapshot = { canInstall: deferredPrompt !== null, isStandalone: standalone };
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    standalone = true;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

async function install() {
  if (!deferredPrompt) return;
  const evt = deferredPrompt;
  await evt.prompt();
  await evt.userChoice;
  // L'événement n'est utilisable qu'une fois.
  deferredPrompt = null;
  emit();
}

export function useInstallPrompt() {
  const { canInstall, isStandalone } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    canInstall,
    isStandalone,
    isIOS,
    isMobileDevice,
    install,
    // API utilisée par UserMenu : toujours visible tant que l'app n'est pas
    // installée ; sans beforeinstallprompt, on retombe sur des instructions manuelles.
    isVisible: !isStandalone,
    canPromptNative: canInstall,
    isIos: isIOS,
    promptInstall: install,
  };
}
