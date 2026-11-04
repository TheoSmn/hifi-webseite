-- Startdaten aus "Lager 2026-27.xlsx" (Tabelle1). Nur einmal ausführen,
-- sonst entstehen doppelte Einträge:
--   npx wrangler d1 execute hifi-chat --remote --file=db/lager-import.sql

INSERT INTO lager (artikelnummer, name, ek_netto, vk_netto, eingekauft, verkauft, updated_at, updated_by) VALUES
  ('MP16',  'MacBook Pro 16" M4 Max', 2650, 3999, 0, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('M401',  'Mac Studio M4 Max',      2250, 3499, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('M403',  'MacBook Pro 14" M4 Max', 2300, 3499, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('M402',  'MacBook Pro 16" M4 Pro', 2050, 3099, 2, 1, strftime('%s','now') * 1000, 'Excel-Import'),
  ('MA01',  'MacBook Air 15"',        1200, 1899, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('Mi01',  'iMac 24" High-End',      1450, 2299, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('MP01',  'Mac Pro',                4900, 7499, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('PD01',  'Pro Display XDR',        3600, 5499, 8, 2, strftime('%s','now') * 1000, 'Excel-Import'),
  ('AM01',  'AirPods Max',             350,  599, 3, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('MM01',  'Magic Mouse',              55,   99, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('MK01',  'Magic Keyboard',           80,  129, 1, 0, strftime('%s','now') * 1000, 'Excel-Import'),
  ('USBC1', 'USB-C Ladekabel 2 m',      10,   20, 5, 0, strftime('%s','now') * 1000, 'Excel-Import');
