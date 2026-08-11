let loadPromise: Promise<typeof google> | null = null;

declare global {
  interface Window {
    __qmapsInitMaps?: () => void;
    google?: any;
  }
}

export const mapsBrowserKey: string | undefined =
  import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

export const isMapsConfigured = () => !!mapsBrowserKey;

/**
 * Loads the Google Maps JS API once (async + callback pattern).
 * Resolves with the global `google` namespace, or rejects if not configured.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!mapsBrowserKey) {
      reject(new Error("maps_not_configured"));
      return;
    }
    if (window.google?.maps?.Map) {
      resolve(window.google);
      return;
    }

    window.__qmapsInitMaps = () => resolve(window.google);

    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsBrowserKey)}` +
      `&libraries=places&loading=async&callback=__qmapsInitMaps&language=fr-CA&region=CA` +
      (channel ? `&channel=${encodeURIComponent(channel)}` : "");
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("maps_load_failed"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
