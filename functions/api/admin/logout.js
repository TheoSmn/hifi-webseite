// POST /api/admin/logout
import { json, destroySession } from "../../lib/admin-auth.js";

export async function onRequestPost({ request, env }) {
  const cookie = await destroySession(env.DB, request);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
