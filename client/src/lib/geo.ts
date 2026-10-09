export const defaultMapCenter: [number, number] = [39.2417, -9.3128];

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function googleMapsRouteUrl(waypoints: { lat: number; lng: number }[]): string {
  if (waypoints.length === 0) return "";
  if (waypoints.length === 1) return googleMapsDirectionsUrl(waypoints[0].lat, waypoints[0].lng);

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const middle = waypoints.slice(1, -1).map((w) => `${w.lat},${w.lng}`).join("|");

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`;
  if (middle) url += `&waypoints=${encodeURIComponent(middle)}`;
  return url;
}
