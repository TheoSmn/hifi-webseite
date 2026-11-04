// GET /api/admin/me  -> wer ist eingeloggt?
import { json, currentUser } from "../../lib/admin-auth.js";

export async function onRequestGet({ request, env }) {
  const username = await currentUser(env.DB, request);
  if (!username) return json({ error: "Nicht eingeloggt" }, 401);
  return json({ username });
}
