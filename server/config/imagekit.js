import ImageKit from "imagekit";

/**
 * ImageKit client for server-side uploads (Admin → product photo upload).
 * All three values come from the ImageKit dashboard → Developer options → API keys.
 * Left unconfigured in development is fine — the upload route reports a clear
 * 503 instead of crashing the server, so the rest of the app keeps working.
 */
const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

export const imagekitConfigured = Boolean(
  IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT
);

const imagekit = imagekitConfigured
  ? new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    })
  : null;

export default imagekit;
