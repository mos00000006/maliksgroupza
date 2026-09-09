import { env } from "cloudflare:workers";

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((sum, item) => sum + item.length, 0));
  let offset = 0;
  for (const item of parts) {
    out.set(item, offset);
    offset += item.length;
  }
  return out;
}

async function hmac(keyBytes: Uint8Array, data: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

async function ensurePushTables() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS push_subscriptions_recipient_idx ON push_subscriptions (recipient_email)",
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS push_vapid_config (
      id INTEGER PRIMARY KEY CHECK (id=1),
      private_jwk TEXT NOT NULL,
      public_key TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
  ]);
}

export async function getVapidConfig() {
  await ensurePushTables();
  let row = await env.DB.prepare(
    "SELECT private_jwk,public_key FROM push_vapid_config WHERE id=1",
  ).first<{ private_jwk: string; public_key: string }>();
  if (row) return row;

  const keyPair = (await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey("raw", keyPair.publicKey));
  const candidate = {
    private_jwk: JSON.stringify(privateJwk),
    public_key: b64url(publicRaw),
  };
  await env.DB.prepare(
    "INSERT OR IGNORE INTO push_vapid_config (id,private_jwk,public_key,created_at) VALUES (1,?,?,?)",
  )
    .bind(candidate.private_jwk, candidate.public_key, new Date().toISOString())
    .run();
  row = await env.DB.prepare(
    "SELECT private_jwk,public_key FROM push_vapid_config WHERE id=1",
  ).first<{ private_jwk: string; public_key: string }>();
  return row || candidate;
}

export async function savePushSubscription(
  email: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  await ensurePushTables();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (recipient_email,endpoint,p256dh,auth,created_at,updated_at)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(endpoint) DO UPDATE SET recipient_email=excluded.recipient_email,p256dh=excluded.p256dh,auth=excluded.auth,updated_at=excluded.updated_at`,
  )
    .bind(email.toLowerCase(), subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, now, now)
    .run();
}

export async function removePushSubscription(email: string, endpoint: string) {
  await ensurePushTables();
  await env.DB.prepare(
    "DELETE FROM push_subscriptions WHERE recipient_email=? AND endpoint=?",
  )
    .bind(email.toLowerCase(), endpoint)
    .run();
}

async function vapidAuthorization(endpoint: string) {
  const config = await getVapidConfig();
  const header = b64url(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = b64url(
    encoder.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: "mailto:notifications@maliks.co.za",
      }),
    ),
  );
  const signingInput = `${header}.${payload}`;
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(config.private_jwk) as JsonWebKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      encoder.encode(signingInput),
    ),
  );
  return {
    authorization: `vapid t=${signingInput}.${b64url(signature)}, k=${config.public_key}`,
    publicKey: config.public_key,
  };
}

async function encryptPayload(payload: string, p256dh: string, auth: string) {
  const clientPublicRaw = fromB64url(p256dh);
  const authSecret = fromB64url(auth);
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicRaw,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const serverKeys = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;
  const serverPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey),
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientPublicKey },
      serverKeys.privateKey,
      256,
    ),
  );

  const prkKey = await hmac(authSecret, sharedSecret);
  const keyInfo = concat(
    encoder.encode("WebPush: info"),
    new Uint8Array([0]),
    clientPublicRaw,
    serverPublicRaw,
    new Uint8Array([1]),
  );
  const ikm = await hmac(prkKey, keyInfo);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(
    prk,
    concat(encoder.encode("Content-Encoding: aes128gcm"), new Uint8Array([0, 1])),
  )).slice(0, 16);
  const nonce = (await hmac(
    prk,
    concat(encoder.encode("Content-Encoding: nonce"), new Uint8Array([0, 1])),
  )).slice(0, 12);

  const plaintext = concat(encoder.encode(payload), new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext),
  );
  const recordSize = 4096;
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, recordSize, false);
  return concat(salt, rs, new Uint8Array([serverPublicRaw.length]), serverPublicRaw, ciphertext);
}

export async function sendPushNotification(
  recipientEmail: string,
  payload: { title: string; body: string; taskId: number; url?: string },
) {
  try {
    await ensurePushTables();
    const { results } = await env.DB.prepare(
      "SELECT endpoint,p256dh,auth FROM push_subscriptions WHERE recipient_email=?",
    )
      .bind(recipientEmail.toLowerCase())
      .all<{ endpoint: string; p256dh: string; auth: string }>();
    for (const subscription of results) {
      try {
        const [body, vapid] = await Promise.all([
          encryptPayload(JSON.stringify(payload), subscription.p256dh, subscription.auth),
          vapidAuthorization(subscription.endpoint),
        ]);
        const response = await fetch(subscription.endpoint, {
          method: "POST",
          headers: {
            Authorization: vapid.authorization,
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            TTL: "86400",
          },
          body: body.buffer as ArrayBuffer,
        });
        if (response.status === 404 || response.status === 410) {
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint=?")
            .bind(subscription.endpoint)
            .run();
        }
      } catch (error) {
        console.error("Push delivery failed", error);
      }
    }
  } catch (error) {
    console.error("Push notification setup failed", error);
  }
}
