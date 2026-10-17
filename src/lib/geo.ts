export type Coords = { latitude: number; longitude: number; accuracy: number };
export type GeoFailure = "unsupported" | "denied" | "unavailable";

/** Reads the device position once. Rejects with a GeoFailure so screens can offer the village fallback. */
export function getPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject("unsupported" satisfies GeoFailure);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (e) => reject((e.code === e.PERMISSION_DENIED ? "denied" : "unavailable") satisfies GeoFailure),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 5 * 60_000 },
    );
  });
}
