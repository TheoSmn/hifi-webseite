// PUT    /api/lager/:id  -> Eintrag bearbeiten
// DELETE /api/lager/:id  -> Eintrag löschen
// POST   /api/lager/:id  -> Buchung { art: "einkauf" | "verkauf", menge }
//   Zählt Eingekauft bzw. Verkauft direkt in der Datenbank hoch, damit
//   gleichzeitige Buchungen von mehreren Accounts nicht verloren gehen.
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

export async function onRequestPost({ request, env, params, data }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }

  const id = parseId(params);
  const menge = Number(body.menge);
  const art = body.art;
  if (!id) return json({ error: "Ungültige ID" }, 400);
  if (art !== "einkauf" && art !== "verkauf") return json({ error: "Ungültige Buchungsart" }, 400);
  if (!Number.isInteger(menge) || menge < 1 || menge > 100000) {
    return json({ error: "Menge muss eine ganze Zahl ab 1 sein" }, 400);
  }

  const now = Date.now();
  const row =
    art === "einkauf"
      ? await env.DB.prepare(
          `UPDATE lager SET eingekauft = eingekauft + ?, updated_at = ?, updated_by = ?
           WHERE id = ? RETURNING ${SELECT_FIELDS}`
        )
          .bind(menge, now, data.username, id)
          .first()
      : await env.DB.prepare(
          `UPDATE lager SET verkauft = verkauft + ?, updated_at = ?, updated_by = ?
           WHERE id = ? AND eingekauft - verkauft >= ? RETURNING ${SELECT_FIELDS}`
        )
          .bind(menge, now, data.username, id, menge)
          .first();

  if (row) return json({ item: row });

  const exists = await env.DB.prepare("SELECT eingekauft - verkauft AS bestand FROM lager WHERE id = ?").bind(id).first();
  if (!exists) return json({ error: "Eintrag nicht gefunden (wurde er gelöscht?)" }, 404);
  return json(
    { error: `Nicht genug im Lager: nur ${exists.bestand} Stück vorhanden.`, bestand: exists.bestand },
    409
  );
}
