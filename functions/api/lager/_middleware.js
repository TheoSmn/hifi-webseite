// Schützt alle /api/lager-Routen: nur eingeloggte Admin-Accounts.
import { json, currentUser } from "../../lib/admin-auth.js";

export async function onRequest(context) {
  const { request, env, data } = context;
  if (!env.DB) return json({ error: "Server nicht konfiguriert" }, 500);

  const username = await currentUser(env.DB, request);
  if (!username) return json({ error: "Nicht eingeloggt" }, 401);

  // Schreibende Anfragen nur als JSON (schützt zusätzlich vor fremden Formularen)
  const isJson = (request.headers.get("Content-Type") || "").includes("application/json");
  if ((request.method === "POST" || request.method === "PUT") && !isJson) {
    return json({ error: "Ungültige Anfrage" }, 415);
  }

  data.username = username;
  return context.next();
}
