// Prüft und bereinigt einen Lager-Eintrag aus dem Browser.
export function cleanItem(body) {
  const text = (v, max) => String(v ?? "").trim().slice(0, max);
  const num = (v) => {
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  const item = {
    artikelnummer: text(body.artikelnummer, 40),
    name: text(body.name, 120),
    ek_netto: num(body.ek_netto),
    vk_netto: num(body.vk_netto),
    eingekauft: num(body.eingekauft),
    verkauft: num(body.verkauft),
  };

  if (!item.artikelnummer) return { error: "Artikelnummer fehlt" };
  if (!item.name) return { error: "Produktname fehlt" };
  for (const key of ["ek_netto", "vk_netto"]) {
    if (!(item[key] >= 0)) return { error: "Preise müssen Zahlen ab 0 sein" };
    item[key] = Math.round(item[key] * 100) / 100;
  }
  for (const key of ["eingekauft", "verkauft"]) {
    if (!(item[key] >= 0) || !Number.isInteger(item[key])) return { error: "Stückzahlen müssen ganze Zahlen ab 0 sein" };
  }
  return { item };
}

export const SELECT_FIELDS =
  "id, artikelnummer, name, ek_netto, vk_netto, eingekauft, verkauft, updated_at, updated_by";
