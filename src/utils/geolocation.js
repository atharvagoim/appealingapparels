/** Wraps the browser Geolocation API in a promise. */
export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location access was denied. You can still enter your address manually."));
        } else {
          reject(new Error("Couldn't get your current location."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Reverse-geocodes coordinates to an address using OpenStreetMap's free
 * Nominatim API. Returns a best-effort street line and PIN code — city and
 * state are looked up separately from the PIN via India Post for accuracy.
 */
export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`
  );
  if (!res.ok) throw new Error("Couldn't determine your address from this location.");

  const data = await res.json();
  const a = data?.address || {};

  const postalCode = a.postcode || "";
  const road = [a.house_number, a.road].filter(Boolean).join(" ");
  const area = a.suburb || a.neighbourhood || a.village || "";
  const line1 = [road, area].filter(Boolean).join(", ");

  return { postalCode, line1 };
}
