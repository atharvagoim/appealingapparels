import client from "./client";

/**
 * Uploads one or more image files straight from the admin's computer and
 * returns the hosted URLs (ImageKit, via the backend). The client never
 * talks to the storage provider directly — the backend holds the private
 * key — so this just posts multipart form data to our own API.
 */
export async function uploadProductImages(files, folder = "products") {
  const form = new FormData();
  Array.from(files).forEach((file) => form.append("images", file));

  // Let the browser set its own multipart boundary — overriding the
  // instance's default "Content-Type: application/json" with undefined
  // removes it for this one request instead of sending a boundary-less
  // multipart header, which the server couldn't parse.
  const { data } = await client.post("/upload/images", form, {
    params: { folder },
    headers: { "Content-Type": undefined },
  });
  return data.urls;
}
