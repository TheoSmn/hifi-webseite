// PUT    /api/lager/:id  -> Eintrag bearbeiten
// DELETE /api/lager/:id  -> Eintrag löschen
import { json } from "../../lib/admin-auth.js";
import { cleanItem, SELECT_FIELDS } from "../../lib/lager.js";

const parseId = (params) => {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function onRequestPut({ request, env, params, data }) {
  const id = parseId(params);
  if (!id) return json({ error: "Ungültige ID" }, 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const { item, error } = cleanItem(body);
  if (error) return json({ error }, 400);

  const row = await env.DB.prepare(
    `UPDATE lager SET artikelnummer = ?, name = ?, ek_netto = ?, vk_netto = ?, eingekauft = ?, verkauft = ?,
       updated_at = ?, updated_by = ? WHERE id = ? RETURNING ${SELECT_FIELDS}`
  )
    .bind(item.artikelnummer, item.name, item.ek_netto, item.vk_netto, item.eingekauft, item.verkauft, Date.now(), data.username, id)
    .first();
  if (!row) return json({ error: "Eintrag nicht gefunden (wurde er gelöscht?)" }, 404);
  return json({ item: row });
}

export async function onRequestDelete({ env, params }) {
  const id = parseId(params);
  if (!id) return json({ error: "Ungültige ID" }, 400);
  const result = await env.DB.prepare("DELETE FROM lager WHERE id = ?").bind(id).run();
  if (!result.meta.changes) return json({ error: "Eintrag nicht gefunden" }, 404);
  return json({ ok: true });
}
