// GET  /api/lager  -> alle Einträge
// POST /api/lager  -> neuen Eintrag anlegen
import { json } from "../../lib/admin-auth.js";
import { cleanItem, SELECT_FIELDS } from "../../lib/lager.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`SELECT ${SELECT_FIELDS} FROM lager ORDER BY id`).all();
  return json({ items: results });
}

export async function onRequestPost({ request, env, data }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const { item, error } = cleanItem(body);
  if (error) return json({ error }, 400);

  const row = await env.DB.prepare(
    `INSERT INTO lager (artikelnummer, name, ek_netto, vk_netto, eingekauft, verkauft, updated_at, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING ${SELECT_FIELDS}`
  )
    .bind(item.artikelnummer, item.name, item.ek_netto, item.vk_netto, item.eingekauft, item.verkauft, Date.now(), data.username)
    .first();
  return json({ item: row }, 201);
}
