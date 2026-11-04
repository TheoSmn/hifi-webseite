// HiFi Admin-Bereich: Login + gemeinsame Lagerliste
(() => {
  const $ = (id) => document.getElementById(id);
  const MWST = 1.2;

  let items = [];
  let editingId = null; // Zahl = bestehender Eintrag, "new" = neuer Eintrag
  let filter = "";

  const eur = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
  const int = new Intl.NumberFormat("de-AT");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtTime = (ms) =>
    ms ? new Date(ms).toLocaleString("de-AT", { dateStyle: "short", timeStyle: "short" }) : "";

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: options.body ? { "Content-Type": "application/json" } : {},
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401 && path !== "/api/admin/login") {
      showLogin();
      throw new Error("Bitte erneut anmelden");
    }
    if (!res.ok) throw new Error(data.error || `Fehler ${res.status}`);
    return data;
  }

  /* ---------- Login ---------- */
  function showLogin() {
    $("adminView").hidden = true;
    $("loginView").hidden = false;
    $("loginForm").username.focus();
  }

  function showAdmin(username) {
    $("loginView").hidden = true;
    $("adminView").hidden = false;
    $("userName").textContent = username;
    load();
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("button");
    $("loginError").textContent = "";
    btn.disabled = true;
    try {
      const { username } = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username: form.username.value, password: form.password.value }),
      });
      form.password.value = "";
      showAdmin(username);
    } catch (err) {
      $("loginError").textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    try { await api("/api/admin/logout", { method: "POST" }); } catch {}
    items = [];
    editingId = null;
    showLogin();
  });

  /* ---------- Daten ---------- */
  async function load() {
    try {
      const data = await api("/api/lager");
      items = data.items;
      setError("");
      $("lastSync").textContent = `Stand: ${fmtTime(Date.now())} — die Liste aktualisiert sich automatisch alle 30 Sekunden.`;
      render();
    } catch (err) {
      setError(err.message);
    }
  }

  function setError(msg) {
    $("tableError").textContent = msg;
    $("tableError").hidden = !msg;
  }

  /* ---------- Darstellung ---------- */
  const stockOf = (it) => it.eingekauft - it.verkauft;

  function stockBadge(n) {
    const cls = n <= 0 ? "empty" : n <= 1 ? "low" : "ok";
    return `<span class="stock ${cls}">${int.format(n)}</span>`;
  }

  function viewRow(it) {
    return `<tr data-id="${it.id}">
      <td class="code">${esc(it.artikelnummer)}</td>
      <td class="name">${esc(it.name)}${
        it.updated_by ? `<span class="meta">zuletzt: ${esc(it.updated_by)}, ${fmtTime(it.updated_at)}</span>` : ""
      }</td>
      <td class="num">${eur.format(it.ek_netto)}</td>
      <td class="num">${eur.format(it.vk_netto)}</td>
      <td class="num">${eur.format(it.vk_netto * MWST)}</td>
      <td class="num">${int.format(it.eingekauft)}</td>
      <td class="num">${int.format(it.verkauft)}</td>
      <td class="num">${stockBadge(stockOf(it))}</td>
      <td class="actions"><div class="row-actions">
        <button class="icon-btn" data-action="edit" type="button">Bearbeiten</button>
        <button class="icon-btn danger" data-action="delete" type="button">Löschen</button>
      </div></td>
    </tr>`;
  }

  function editRow(it) {
    const v = it || { artikelnummer: "", name: "", ek_netto: "", vk_netto: "", eingekauft: 0, verkauft: 0 };
    const id = it ? it.id : "new";
    return `<tr class="editing" data-id="${id}">
      <td><input name="artikelnummer" value="${esc(v.artikelnummer)}" placeholder="z. B. MP16" maxlength="40" required></td>
      <td><input name="name" value="${esc(v.name)}" placeholder="Produktname" maxlength="120" required></td>
      <td class="num"><input class="n" name="ek_netto" type="number" min="0" step="0.01" value="${esc(v.ek_netto)}" required></td>
      <td class="num"><input class="n" name="vk_netto" type="number" min="0" step="0.01" value="${esc(v.vk_netto)}" required></td>
      <td class="num calc" data-calc="brutto"></td>
      <td class="num"><input class="n" name="eingekauft" type="number" min="0" step="1" value="${esc(v.eingekauft)}" required></td>
      <td class="num"><input class="n" name="verkauft" type="number" min="0" step="1" value="${esc(v.verkauft)}" required></td>
      <td class="num calc" data-calc="lager"></td>
      <td class="actions"><div class="row-actions">
        <button class="icon-btn save" data-action="save" type="button">Speichern</button>
        <button class="icon-btn" data-action="cancel" type="button">Abbrechen</button>
      </div></td>
    </tr>`;
  }

  function render() {
    const q = filter.trim().toLowerCase();
    const visible = q
      ? items.filter((it) => `${it.artikelnummer} ${it.name}`.toLowerCase().includes(q))
      : items;

    let html = editingId === "new" ? editRow(null) : "";
    html += visible.map((it) => (it.id === editingId ? editRow(it) : viewRow(it))).join("");
    if (!html) {
      html = `<tr class="empty-row"><td colspan="9">${
        q ? "Keine Treffer." : "Noch keine Artikel – lege mit „+ Neuer Artikel“ einen an."
      }</td></tr>`;
    }
    $("rows").innerHTML = html;

    // Summenzeile (wie in der Excel-Tabelle)
    const sum = (fn) => visible.reduce((s, it) => s + fn(it), 0);
    $("totals").innerHTML = visible.length
      ? `<tr>
          <td colspan="2">Summe${q ? " (gefiltert)" : ""}:</td>
          <td class="num">${eur.format(sum((it) => it.ek_netto))}</td>
          <td class="num">${eur.format(sum((it) => it.vk_netto))}</td>
          <td class="num">${eur.format(sum((it) => it.vk_netto * MWST))}</td>
          <td class="num">${int.format(sum((it) => it.eingekauft))}</td>
          <td class="num">${int.format(sum((it) => it.verkauft))}</td>
          <td class="num">${int.format(sum(stockOf))}</td>
          <td></td>
        </tr>`
      : "";

    // Kennzahlen über die ganze Liste
    const all = (fn) => items.reduce((s, it) => s + fn(it), 0);
    const stats = [
      ["Artikel", int.format(items.length)],
      ["Stück im Lager", int.format(all(stockOf))],
      ["Lagerwert (EK netto)", eur.format(all((it) => it.ek_netto * stockOf(it)))],
      ["Lagerwert (VK brutto)", eur.format(all((it) => it.vk_netto * MWST * stockOf(it)))],
      ["Nicht vorrätig", int.format(items.filter((it) => stockOf(it) <= 0).length)],
    ];
    $("stats").innerHTML = stats
      .map(([l, v]) => `<div class="stat"><div class="stat-label">${l}</div><div class="stat-value">${v}</div></div>`)
      .join("");

    const editing = $("rows").querySelector("tr.editing");
    if (editing) {
      updateCalc(editing);
      editing.querySelector("input").focus();
    }
  }

  function updateCalc(tr) {
    const val = (n) => Number(tr.querySelector(`[name="${n}"]`).value) || 0;
    tr.querySelector('[data-calc="brutto"]').textContent = eur.format(val("vk_netto") * MWST);
    tr.querySelector('[data-calc="lager"]').textContent = int.format(val("eingekauft") - val("verkauft"));
  }

  /* ---------- Aktionen ---------- */
  function startEdit(id) {
    if (editingId !== null && editingId !== id && !confirm("Ungespeicherte Änderungen verwerfen?")) return;
    editingId = id;
    render();
  }

  async function save(tr) {
    const data = {};
    for (const input of tr.querySelectorAll("input")) {
      if (!input.reportValidity()) return;
      data[input.name] = input.value;
    }
    const btn = tr.querySelector('[data-action="save"]');
    btn.disabled = true;
    try {
      if (editingId === "new") {
        const { item } = await api("/api/lager", { method: "POST", body: JSON.stringify(data) });
        items.push(item);
      } else {
        const { item } = await api(`/api/lager/${editingId}`, { method: "PUT", body: JSON.stringify(data) });
        items = items.map((it) => (it.id === item.id ? item : it));
      }
      editingId = null;
      setError("");
      render();
    } catch (err) {
      setError(err.message);
      btn.disabled = false;
    }
  }

  async function remove(id) {
    const it = items.find((x) => x.id === id);
    if (!it || !confirm(`„${it.name}“ (${it.artikelnummer}) wirklich aus dem Lager löschen?`)) return;
    try {
      await api(`/api/lager/${id}`, { method: "DELETE" });
      items = items.filter((x) => x.id !== id);
      setError("");
      render();
    } catch (err) {
      setError(err.message);
    }
  }

  $("rows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = tr.dataset.id === "new" ? "new" : Number(tr.dataset.id);
    const action = btn.dataset.action;
    if (action === "edit") startEdit(id);
    else if (action === "delete") remove(id);
    else if (action === "save") save(tr);
    else if (action === "cancel") { editingId = null; render(); }
  });

  $("rows").addEventListener("input", (e) => {
    const tr = e.target.closest("tr.editing");
    if (tr) updateCalc(tr);
  });

  $("rows").addEventListener("keydown", (e) => {
    const tr = e.target.closest("tr.editing");
    if (!tr) return;
    if (e.key === "Enter") { e.preventDefault(); save(tr); }
    if (e.key === "Escape") { editingId = null; render(); }
  });

  $("addBtn").addEventListener("click", () => {
    $("search").value = "";
    filter = "";
    startEdit("new");
  });
  $("refreshBtn").addEventListener("click", () => {
    if (editingId !== null && !confirm("Ungespeicherte Änderungen verwerfen?")) return;
    editingId = null;
    load();
  });
  $("search").addEventListener("input", (e) => {
    filter = e.target.value;
    render();
  });

  // Änderungen der anderen Accounts automatisch holen (nicht während man selbst bearbeitet)
  setInterval(() => {
    if (!$("adminView").hidden && editingId === null && !document.hidden) load();
  }, 30000);

  /* ---------- Start ---------- */
  api("/api/admin/me")
    .then(({ username }) => showAdmin(username))
    .catch(() => showLogin());
})();
