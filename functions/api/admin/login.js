// POST /api/admin/login  { username, password }
import { json, pbkdf2, safeEqual, createSession } from "../../lib/admin-auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Server nicht konfiguriert" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const username = String(body.username || "").trim().toLowerCase().slice(0, 50);
  const password = String(body.password || "").slice(0, 200);

  const user = await env.DB.prepare("SELECT username, salt, hash FROM admin_users WHERE username = ?")
    .bind(username)
    .first();

  // Auch bei unbekanntem Benutzer einen Hash rechnen, damit die Antwortzeit gleich bleibt.
  const hash = await pbkdf2(password, user ? user.salt : "00000000000000000000000000000000");
  if (!user || !safeEqual(hash, user.hash)) {
    return json({ error: "Benutzername oder Passwort falsch" }, 401);
  }

  const cookie = await createSession(env.DB, user.username);
  return json({ username: user.username }, 200, { "Set-Cookie": cookie });
}
