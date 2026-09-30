# HiFi — Highest Fidelity (Übungsfirma)

Statische Produktwebseite für die fiktive Übungsfirma **HiFi**. Reines HTML/CSS/JS ohne Build-Schritt — bereit für Cloudflare Pages.

## Struktur

```
HiFi-Webseite/
├── index.html
├── css/style.css
├── js/main.js
├── assets/logo.png
└── README.md
```

## Lokal ansehen

Einfach `index.html` per lokalem Server öffnen (z. B. `npx serve .`), damit relative Pfade und Skripte korrekt laden.

## Deployment auf Cloudflare Pages

**Option A — Drag & Drop (am einfachsten):**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → *Workers & Pages* → *Create* → *Pages* → *Upload assets*.
2. Diesen Ordner (`HiFi-Webseite`) per Drag & Drop hochladen.
3. Fertig — Cloudflare vergibt automatisch eine `*.pages.dev`-URL.

**Option B — Wrangler CLI:**
```bash
npm install -g wrangler
wrangler pages deploy "HiFi-Webseite" --project-name=hifi-webseite
```

Kein Build-Command, kein Output-Verzeichnis nötig — der Ordner selbst ist bereits das fertige Deployment.

## Hinweis

Diese Website ist ein **Übungsprojekt**. HiFi ist keine echte Firma, alle Produkte und Preise sind frei erfunden.
