export interface AddressComponent {
  types?: string[];
  shortText?: string;
  short_name?: string;
  longText?: string;
  long_name?: string;
}

export interface PlacePrediction {
  placeId?: string;
  text?: { text?: string };
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  toPlace: () => GooglePlace;
}

export interface PlaceSuggestion {
  placePrediction: PlacePrediction;
}

export interface GooglePlace {
  fetchFields: (opts: { fields: string[] }) => Promise<void>;
  addressComponents?: AddressComponent[];
  formattedAddress?: string;
  location?: { lat: () => number; lng: () => number };
  id?: string;
}

export interface GoogleMap {
  setCenter: (position: { lat: number; lng: number }) => void;
}

export interface GoogleMarker {
  setPosition: (position: { lat: number; lng: number }) => void;
}

export interface PlacesLibrary {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      sessionToken: object;
      includedRegionCodes: string[];
      language: string;
    }) => Promise<{ suggestions?: PlaceSuggestion[] }>;
  };
}

export interface GoogleNamespace {
  maps: {
    importLibrary: (name: "places") => Promise<PlacesLibrary>;
    Map: new (
      element: HTMLElement,
      options: {
        center: { lat: number; lng: number };
        zoom: number;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
      },
    ) => GoogleMap;
    Marker: new (options: {
      position: { lat: number; lng: number };
      map: GoogleMap;
    }) => GoogleMarker;
  };
}

let loadPromise: Promise<GoogleNamespace> | null = null;

declare global {
  interface Window {
    __qmapsInitMaps?: () => void;
    google?: GoogleNamespace;
  }
}

export const mapsBrowserKey: string | undefined =
  import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

export const isMapsConfigured = () => !!mapsBrowserKey;

/**
 * Loads the Google Maps JS API once (async + callback pattern).
 * Resolves with the global `google` namespace, or rejects if not configured.
 */
export function loadGoogleMaps(): Promise<GoogleNamespace> {
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
