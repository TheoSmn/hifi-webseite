// Gemeinsame Helfer für den Admin-Bereich (Login, Sitzungen).
// Diese Datei exportiert keine onRequest-Handler und ist daher keine eigene Route.

export const COOKIE = "hifi_admin";
const SESSION_MS = 12 * 60 * 60 * 1000; // 12 Stunden eingeloggt bleiben

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

export const sha256 = async (text) =>
  toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));

export async function pbkdf2(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations: 100000 },
    key,
    256
  );
  return toHex(bits);
}

// Vergleich in konstanter Zeit
export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const readCookie = (request) => {
  const header = request.headers.get("Cookie") || "";
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : null;
};

export async function createSession(db, username) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM admin_sessions WHERE expires < ?").bind(now),
    db
      .prepare("INSERT INTO admin_sessions (token_hash, username, expires) VALUES (?, ?, ?)")
      .bind(await sha256(token), username, now + SESSION_MS),
  ]);
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS / 1000}`;
}

export async function destroySession(db, request) {
  const token = readCookie(request);
  if (token) await db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

// Gibt den eingeloggten Benutzernamen zurück oder null.
export async function currentUser(db, request) {
  const token = readCookie(request);
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = await db
    .prepare("SELECT username FROM admin_sessions WHERE token_hash = ? AND expires > ?")
    .bind(await sha256(token), Date.now())
    .first();
  return row ? row.username : null;
}
