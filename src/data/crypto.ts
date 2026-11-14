/** Lightweight Web Crypto helpers for sensitive note fields / export wrapping (demo). */

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('aetherhealth-mission-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptText(plain: string, passphrase = 'aether-local'): Promise<string> {
  if (!plain) return '';
  const key = await getKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return `enc:${toBase64(iv.buffer)}:${toBase64(cipher)}`;
}

export async function decryptText(payload: string, passphrase = 'aether-local'): Promise<string> {
  if (!payload.startsWith('enc:')) return payload;
  const [, ivB64, dataB64] = payload.split(':');
  const key = await getKey(passphrase);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivB64) },
    key,
    fromBase64(dataB64),
  );
  return new TextDecoder().decode(plain);
}
