const encoder = new TextEncoder();

export const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

export const randomUrlToken = (length = 32) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
};

export const sha256 = async (value: string) =>
  base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));

const encryptionKey = async () => {
  const configured = Deno.env.get("NINAUTH_SESSION_ENCRYPTION_KEY");
  if (!configured) throw new Error("NINAUTH_SESSION_ENCRYPTION_KEY is not configured");
  const decoded = Uint8Array.from(atob(configured), (character) => character.charCodeAt(0));
  if (decoded.length !== 32) throw new Error("NINAUTH_SESSION_ENCRYPTION_KEY must be 32 bytes");
  return crypto.subtle.importKey("raw", decoded, "AES-GCM", false, ["encrypt", "decrypt"]);
};

export const encryptVerifier = async (verifier: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(),
    encoder.encode(verifier),
  );
  return { ciphertext: base64Url(new Uint8Array(ciphertext)), iv: base64Url(iv) };
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

export const decryptVerifier = async (ciphertext: string, iv: string) => {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64Url(iv) },
    await encryptionKey(),
    decodeBase64Url(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
};
