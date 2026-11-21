export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const getCurrentPosition = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => reject(new Error("Impossible d'accéder à votre position.")),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });

export const formatDistance = (meters?: number | null) => {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};
export function distanceMeters(from: Coordinates, latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  const radians = Math.PI / 180;
  const sinLat = Math.sin((latitude - from.latitude) * radians / 2);
  const sinLon = Math.sin((longitude - from.longitude) * radians / 2);
  const a = sinLat ** 2 + Math.cos(from.latitude * radians) * Math.cos(latitude * radians) * sinLon ** 2;
  return Math.round(12742000 * Math.asin(Math.sqrt(Math.min(1, a))));
}
