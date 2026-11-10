export interface LinkPreview {
  title: string | null;
  image_url: string | null;
}

const PREVIEW_ENDPOINT = 'https://api.microlink.io/';
const PREVIEW_TIMEOUT_MS = 8000;

/** Lien http(s) valide, ou null. */
export function parseHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Aperçu d'un lien via Microlink, appelé depuis le navigateur (CORS).
 * Le résultat est copié dans l'idée à l'enregistrement : les lecteurs n'appellent jamais le service.
 * Échoue (throw) si le service est indisponible ou ne trouve rien : l'appelant propose alors la saisie manuelle.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);

  try {
    const res = await fetch(`${PREVIEW_ENDPOINT}?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('Aperçu indisponible');

    const json = await res.json();
    const data = json?.data;
    if (json?.status !== 'success' || !data) throw new Error('Aperçu indisponible');

    const title = typeof data.title === 'string' ? data.title.trim().slice(0, 120) : '';
    const image = typeof data.image?.url === 'string' ? parseHttpsUrl(data.image.url) : null;
    if (!title && !image) throw new Error('Aperçu indisponible');

    return { title: title || null, image_url: image };
  } finally {
    window.clearTimeout(timer);
  }
}