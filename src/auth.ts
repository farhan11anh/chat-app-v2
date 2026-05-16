const SALT_ROUNDS = 100000;

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: SALT_ROUNDS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArr = Array.from(new Uint8Array(bits));
  const saltArr = Array.from(salt);
  return (
    saltArr.map((b) => b.toString(16).padStart(2, '0')).join('') +
    ':' +
    hashArr.map((b) => b.toString(16).padStart(2, '0')).join('')
  );
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: SALT_ROUNDS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const newHashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return newHashHex === hashHex;
}

export interface SessionData {
  userId: number;
  username: string;
  displayName: string;
}

export async function createSessionToken(data: SessionData, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payload = btoa(JSON.stringify(data));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return payload + '.' + sigHex;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionData | null> {
  try {
    const [payload, sigHex] = token.split('.');
    if (!payload || !sigHex) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sig = new Uint8Array(sigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payload));
    if (!valid) return null;
    return JSON.parse(atob(payload)) as SessionData;
  } catch {
    return null;
  }
}
