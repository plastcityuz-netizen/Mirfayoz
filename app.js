import { CONFIG, I18N, RBAC, DEMO_DATA, dataService } from "./data.js";
const $ = (s, root = document) => root.querySelector(s);
const memory = {};
function read(key) {
  try {
    return localStorage.getItem(`balans-${key}`) ?? memory[key];
  } catch {
    return memory[key];
  }
}
function save(key, value) {
  memory[key] = String(value);
  try {
    localStorage.setItem(`balans-${key}`, value);
  } catch {}
}
const state = {
  lang: read("lang") === "ru" ? "ru" : "uz",
  theme: ["dark", "light"].includes(read("theme")) ? read("theme") : "",
  role: Math.min(5, Math.max(0, Number(read("role")) || 0)),
  period: 2,
  landingRole: 0,
  annual: false,
  collapsed: false,
  received: new Set(),
  tasks: [],
  chats: { landing: [], demo: [] },
  pending: {},
  sort: false,
  filter: "",
  factory: 0,
};
const keys = [
  "hisob",
  "savdo",
  "ombor",
  "xarid",
  "ishlab",
  "hr",
  "moliya",
  "ai",
];
const shapes = {
  logo: '<path d="M5 5h8a3.5 3.5 0 0 1 0 7H5zm0 7h11a3.5 3.5 0 0 1 0 7H5z" fill="currentColor" stroke="none"/><path d="M4 12h17" stroke="currentColor"/>',
  spark:
    '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2zM20 2v4m-2-2h4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  chart: '<path d="M3 3v17h18M6 15l5-5 4 2 6-7"/>',
  box: '<path d="m12 3 9 5v9l-9 5-9-5V8zm0 9 9-4M3 8l9 4v10m-5-16 9 5"/>',
  doc: '<path d="M6 3h9l4 4v14H6zM9 11h7m-7 4h7m-7 3h4"/>',
  wallet: '<path d="M3 6h16v14H3zM3 6l13-3v3m3 5h-6v5h6m-3-2.5h.01"/>',
  users:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
  factory: '<path d="M3 21V10l6 4V9l6 4V4h4l2 17zM7 18h1m4 0h1m4 0h1"/>',
  cart: '<path d="M2 4h3l3 11h11l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 9-12h-6z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  bell: '<path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5zm5 3h4"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
};
const icons = {
  hisob: "doc",
  savdo: "chart",
  ombor: "box",
  xarid: "cart",
  ishlab: "factory",
  hr: "users",
  moliya: "wallet",
  ai: "spark",
  home: "grid",
};
const icon = (name, size = 24) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name]}</svg>`;
const t = () => I18N[state.lang];
const esc = (x) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const num = (x) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 })
    .format(x)
    .replace(/\u00a0/g, "\u202f");
const money = (x, compact = false) =>
  `${compact && Math.abs(x) >= 1e9 ? `${num(x / 1e9)} ${state.lang === "uz" ? "mlrd" : "млрд"}` : compact && Math.abs(x) >= 1e6 ? `${num(x / 1e6)} ${state.lang === "uz" ? "mln" : "млн"}` : num(x)} ${t().currency}`;
const sections = ["modules", "cfo", "solutions", "pricing", "faq"];
const name = (key) =>
  key === "home"
    ? t().overview
    : key === "ai"
      ? t().nav[1]
      : t().modules[keys.indexOf(key)];
const url = (key) => (key === "home" ? "#/demo" : `#/demo/${key}`);
const brand = () =>
  `<a href="#/" class="brand" aria-label="${esc(CONFIG.BRAND)} AI"><span class="mark">${icon("logo", 23)}</span>${esc(CONFIG.BRAND)}<small>AI</small></a>`;
const btn = (label, action, cls = "", glyph = "") =>
  `<button type="button" class="btn ${cls}" data-action="${action}">${esc(label)}${glyph ? icon(glyph, 17) : ""}</button>`;
const ib = (label, action, glyph) =>
  `<button type="button" class="icon-btn" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}">${icon(glyph, 19)}</button>`;
const demoLink = () =>
  `<a class="btn secondary" href="#/demo">${icon("play", 17)}${t().demo}</a>`;
const currentDark = () =>
  state.theme
    ? state.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
const switches = () =>
  `<div class="languages" aria-label="${t().language}">${["uz", "ru"].map((l) => `<button type="button" data-action="lang:${l}" aria-pressed="${state.lang === l}">${l.toUpperCase()}</button>`).join("")}</div>${ib(t().theme, "theme", currentDark() ? "sun" : "moon")}`;
const sectionLinks = () =>
  t()
    .nav.map((n, i) => `<a href="#/" data-section="${sections[i]}">${n}</a>`)
    .join("");
const badge = (text, glyph = "") =>
  `<span class="badge">${glyph ? icon(glyph, 14) : "<i></i>"}${text}</span>`;
const heading = (tag, title) =>
  `<div class="section-heading"><div class="kicker">${tag}</div><h2>${title}</h2></div>`;
function chart(a = DEMO_DATA.revenue, b = DEMO_DATA.cost, mini = false) {
  const max = Math.max(1, ...a, ...b) * 1.1;
  const pos = (list) =>
    list.map(
      (x, i) =>
        `${8 + (i * 484) / Math.max(1, list.length - 1)},${112 - (x / max) * 102}`,
    );
  const path = (values) => pos(values).join(" ");
  return `<svg class="line-chart" viewBox="0 0 500 120" preserveAspectRatio="none" aria-hidden="true">${mini ? "" : [20, 48, 76, 112].map((y) => `<path d="M0 ${y}H500" class="gridline"/>`).join("")}<polygon points="8,112 ${path(a)} ${a.length === 1 ? 8 : 492},112" class="chart-fill"/><polyline points="${path(a)}" class="line-main"/>${b.length ? `<polyline points="${path(b)}" class="line-alt"/>` : ""}</svg>`;
}
function preview(role = 0) {
  const d = t();
  const selected =
    role === 0 ? [0, 1, 2] : role === 1 ? [0, 2, 4] : role === 2 ? [0] : [];
  const values = [124, 34, 90, 118, 39, 17.2, 50.375];
  const roleSeries =
    role === 2
      ? DEMO_DATA.revenue.slice(0, 11)
      : role === 3
        ? DEMO_DATA.inventory.map((x) => x.qty)
        : role === 4
          ? DEMO_DATA.inventory.filter((x) => x.raw).map((x) => x.qty)
          : [2, 3, 4, 5, 6, 7, 8];
  const prevNav =
    role === 0
      ? ["home", "savdo", "ombor", "hisob", "ai"]
      : ["home"].concat(RBAC[role]);
  return `<div class="preview glass"><div class="preview-top"><span class="dots"><i></i><i></i><i></i></span><span>${d.company}</span>${badge(d.sample)}</div><div class="preview-core"><div class="preview-side">${prevNav.map((k, i) => `<span class="${i === 0 ? "selected" : ""}" title="${name(k)}">${icon(icons[k], 17)}</span>`).join("")}</div><div class="preview-body"><div class="preview-title"><strong>${d.overview}</strong><span>${d.months[10]} 2026</span></div><div class="preview-kpis">${selected.length ? selected.map((id, i) => `<div><span>${d.metric[id]}</span><strong>${money(values[id] * 1e6, true)}</strong><small>${["↗ +6,9%", "↘ −5,6%", "↗ +12,5%"][i]}</small></div>`).join("") : `<div><span>${name(RBAC[role][0])}</span><strong>${role === 3 ? 26 : role === 4 ? 9 : 8}</strong></div>`}</div><div class="preview-panels"><div class="preview-chart"><strong>${role === 0 ? d.trend : name(RBAC[role][0])}</strong>${chart((role < 2 ? DEMO_DATA.revenue.slice(0, 11) : roleSeries).slice(-7), role < 2 ? DEMO_DATA.cost.slice(4, 11) : [])}<div class="chart-labels">${(role < 3 ? d.months.slice(4, 11) : Array.from({ length: 7 }, (_, i) => `0${i + 1}`)).map((m) => `<span>${m}</span>`).join("")}</div></div>${role === 0 ? `<div class="preview-health"><strong>${d.health}</strong><div class="ring"><b>84<small>/100</small></b></div></div>` : `<div class="preview-health"><span class="tile">${icon(icons[RBAC[role][0]], 19)}</span><strong>${name(RBAC[role][0])}</strong></div>`}</div></div></div></div>`;
}
function chat(scope) {
  const d = t();
  return `<div class="chat card"><div class="chat-head"><span class="tile purple">${icon("spark", 20)}</span><div><strong>${d.nav[1]}</strong><small>${d.sample}</small></div></div><div class="messages" aria-live="polite">${state.chats[scope].map((m) => (m.index === -2 ? `<p class="user-msg">${esc(m.question)}</p>` : `<p class="user-msg">${esc(m.question)}</p><div class="answer"><p>${m.index === -1 ? d.fallback : d.answers[m.index]}</p>${m.index < 0 ? "" : `<small>${d.sample}</small><div class="actions">${btn(d.task, `task:${m.index}`, "secondary")}${btn(d.remind, "remind", "secondary")}</div>`}</div>`)).join("")}${state.pending[scope] ? `<p class="answer">${d.typing}</p>` : ""}</div><div class="chips">${d.questions.map((q, i) => `<button type="button" data-action="ask:${scope}:${i}" ${state.pending[scope] ? "disabled" : ""}>${q}</button>`).join("")}</div><form class="chat-form" data-chat="${scope}"><input aria-label="${d.ask}" placeholder="${d.ask}" maxlength="280" required><button class="icon-btn primary" type="submit" aria-label="${d.send}" ${state.pending[scope] ? "disabled" : ""}>${icon("arrow", 19)}</button></form></div>`;
}
const planFeatures = [
  [0, 1, 2],
  [0, 1, 2, 3, 6, 7],
  [0, 1, 2, 3, 4, 5, 6, 7],
];
function pricing() {
  const d = t();
  return `${heading(d.nav[3], d.priceTitle)}<p class="muted">${d.priceNote}</p><div class="billing"><div class="segmented">${d.billing.map((x, i) => `<button type="button" data-action="annual:${i}" aria-pressed="${Number(state.annual) === i}">${x}</button>`).join("")}</div><span class="badge">${d.annual}</span></div><div class="plans">${d.plans.map((p, i) => `<article class="card plan ${i === 1 ? "featured" : ""}"><div class="plan-title"><h3>${p}</h3>${i === 1 ? `<span class="gold">${d.popular}</span>` : ""}</div><p class="price">${i === 2 ? d.negotiated : money(CONFIG.PRICING[i === 0 ? "start" : "business"] * (state.annual ? CONFIG.PRICING.annualFactor : 1))}${i < 2 ? ` <small>${d.month}</small>` : ""}</p>${btn(i === 2 ? d.contact : d.trial, i === 2 ? "contact" : "signup", i === 1 ? "primary" : "secondary", "arrow")}<ul class="clean">${planFeatures[i].map((n) => `<li>${icon("check", 16)}${d.modules[n]}</li>`).join("")}</ul></article>`).join("")}</div><details class="card compare"><summary>${d.compare}</summary><div class="table-scroll"><table><thead><tr><th>${d.nav[0]}</th>${d.plans.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${d.modules.map((m, i) => `<tr><th>${m}</th>${planFeatures.map((p) => `<td>${p.includes(i) ? "✓" : "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
function landing() {
  const d = t();
  return `<header class="header"><div class="wrap nav-inner">${brand()}<nav class="main-nav" aria-label="${d.menu}">${sectionLinks()}</nav><div class="nav-actions">${switches()}${btn(d.login, "login", "ghost")}${btn(d.trial, "signup", "primary")}${ib(d.menu, "menu", "menu")}</div></div><div class="progress"></div></header><main id="main" tabindex="-1"><section class="hero"><div class="wrap hero-grid"><div class="hero-copy">${badge(d.eyebrow)}<h1 tabindex="-1">${d.headline[0]}<br><em>${d.headline[1]}</em></h1><p>${d.intro}</p><div class="actions">${btn(d.trial, "signup", "primary", "arrow")}${demoLink()}</div><ul class="hero-checks clean">${d.checks.map((x) => `<li>${icon("check", 15)}${x}</li>`).join("")}</ul></div><div class="hero-visual">${preview()}<a class="floating glass" href="#/demo/ai"><span class="tile purple">${icon("spark", 21)}</span><div><small>${d.nav[1]}</small><strong>${d.signal}</strong></div>${icon("arrow", 17)}</a></div></div></section><section class="pipeline wrap" aria-label="${d.pipeline.join(" → ")}">${d.pipeline.map((x, i) => `<div class="step"><span class="tile ${i === 1 ? "purple" : ""}">${icon(["grid", "spark", "target", "bolt"][i], 21)}</span><div><small>0${i + 1}</small><strong>${x}</strong><p>${d.pipeDesc[i]}</p></div>${i < 3 ? `<span class="step-arrow">${icon("arrow", 15)}</span>` : ""}</div>`).join("")}</section><section class="wrap section" id="solutions">${heading(d.nav[2], d.painTitle)}<div class="two">${[d.pain, d.gain].map((list, i) => `<article class="card comparison ${i ? "positive" : ""}"><h3>${i ? d.after : d.before}</h3><ul class="clean">${list.map((x) => `<li>${icon(i ? "check" : "close", 17)}${x}</li>`).join("")}</ul></article>`).join("")}</div></section><section class="wrap section" id="modules">${heading(d.nav[0], d.modulesTitle)}<div class="modules">${d.modules.map((m, i) => `<a class="card module" href="${url(i === 7 ? "home" : keys[i])}"><span class="tile">${icon(i === 7 ? "grid" : icons[keys[i]], 22)}</span><span class="module-link">${icon("arrow", 18)}</span><div class="module-art" aria-hidden="true">${i % 3 === 0 ? chart([2, 4, 3, 7, 6, 10], [], true) : i % 3 === 1 ? "<span></span><span></span><span></span><span></span>" : '<div class="mini-ring"></div>'}</div><h3>${m}</h3><p>${d.benefits[i]}</p></a>`).join("")}</div></section><section class="ai-band" id="cfo"><div class="wrap two section ai-layout"><div>${heading(d.nav[1], d.aiTitle)}<p class="muted">${d.aiSub}</p><ul class="clean findings">${d.findings.map((x) => `<li>${icon("spark", 17)}${x}</li>`).join("")}</ul></div>${chat("landing")}</div></section><section class="wrap section">${heading(d.nav[2], d.rolesTitle)}<div class="segmented role-tabs">${d.roles.map((x, i) => `<button type="button" data-action="landingRole:${i}" aria-pressed="${i === state.landingRole}">${x}</button>`).join("")}</div><div class="role-preview">${preview(state.landingRole)}</div></section>${CONFIG.FEATURE_FLAGS.factory ? `<section class="wrap section factory">${heading(d.modules[4], d.factory)}<div class="card factory-card"><div class="factory-flow">${d.factoryFlow.map((x) => `<span class="badge">${x}</span>`).join("")}</div><label for="factory-range">${d.material} <strong id="factory-percent">${num(state.factory)}%</strong></label><input type="range" id="factory-range" min="-30" max="40" value="${state.factory}"><div class="two"><div>${d.factoryFlow[3]} <strong id="factory-cost"></strong></div><div>${d.margin} <strong id="factory-margin"></strong></div></div></div></section>` : ""}<section class="wrap section">${heading(d.modules[7], d.control)}<div class="two"><article class="card viz"><h3>${d.trend}</h3>${chart()}<div class="chart-labels">${d.months.map((m) => `<span>${m}</span>`).join("")}</div></article>${cashCard({ revenue: 124e6, cost: 90e6, profit: 34e6 })}</div></section><section class="wrap section"><div class="two"><article class="card info">${heading(d.nav[2], d.security)}<p>${d.securityNote}</p><ul class="clean">${d.securityItems.map((x) => `<li>${icon("lock", 17)}${x}</li>`).join("")}</ul></article>${CONFIG.FEATURE_FLAGS.roadmap ? `<article class="card info">${heading(d.nav[2], d.roadmap)}<ul class="clean roadmap">${d.integrations.map((x) => `<li>${x}<span class="badge">${d.soon}</span></li>`).join("")}</ul></article>` : ""}</div></section><section class="wrap section" id="pricing">${pricing()}</section><section class="wrap section faq" id="faq">${heading(d.nav[4], d.faqTitle)}${d.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</section><section class="wrap section"><div class="final card"><span class="tile">${icon("logo")}</span><h2>${d.final}</h2>${btn(d.trial, "signup", "primary", "arrow")}</div></section></main><footer><div class="wrap footer-inner"><div>${brand()}<p>${d.registerHint}</p></div><nav aria-label="${d.menu}">${sectionLinks()}</nav><div>${btn(d.contact, "contact", "secondary")}${Object.entries(
    CONFIG.CONTACT,
  )
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<a class="contact-link" href="${esc(k === "phone" ? `tel:${v}` : k === "email" ? `mailto:${v}` : v)}">${esc(v)}</a>`,
    )
    .join(
      "",
    )}<div class="footer-switch">${switches()}</div></div><small>© 2026 ${esc(CONFIG.BRAND)} AI</small></div></footer>`;
}
function cashCard(s) {
  const d = t();
  return `<article class="card viz"><h3>${d.cash}</h3><div class="cash-bars">${[s.revenue, s.cost, s.profit].map((x, i) => `<div><span>${d.inout[i]}</span><strong>${money(x, true)}</strong><div><i style="--fill:${(Math.abs(x) / Math.max(1, s.revenue, s.cost, Math.abs(s.profit))) * 100}%"></i></div></div>`).join("")}</div></article>`;
}
const navLink = (k, page) =>
  `<a href="${url(k)}" ${k === page ? 'aria-current="page"' : ""} title="${name(k)}" aria-label="${name(k)}">${icon(icons[k], 19)}<span>${name(k)}</span></a>`;
function shell(page) {
  const d = t();
  const nav = ["home"].concat(RBAC[state.role]);
  return `<div class="workspace ${state.collapsed ? "collapsed" : ""}"><aside class="sidebar">${brand()}<nav aria-label="${d.menu}">${nav.map((k) => navLink(k, page)).join("")}</nav><a href="#/" class="back-link">${icon("arrow", 17)}<span>${d.back}</span></a></aside><div class="workspace-main"><header class="toolbar">${ib(d.collapse, "collapse", "menu")}<button type="button" class="quick" data-action="search">${icon("search", 18)}<span>${d.search}</span><kbd>⌘ K</kbd></button><div class="toolbar-right"><select id="period" aria-label="${d.periods.join(" / ")}">${d.periods.map((p, i) => `<option value="${i}" ${i === state.period ? "selected" : ""}>${p}</option>`).join("")}</select><select id="role" aria-label="${d.rolesTitle}">${d.roles.map((p, i) => `<option value="${i}" ${i === state.role ? "selected" : ""}>${p}</option>`).join("")}</select>${ib(d.notifications, "notifications", "bell")}${switches()}</div></header><main id="main" class="dash" tabindex="-1"><div class="dash-title"><div>${badge(d.sample)}<h1 tabindex="-1">${name(page)}</h1><p>${d.company}</p></div></div><div id="dash-content" aria-busy="true"></div></main></div><nav class="bottom-nav" aria-label="${d.menu}">${nav
    .slice(0, 3)
    .map((k) => navLink(k, page))
    .join("")}${ib(d.more, "more", "menu")}</nav></div>`;
}
function kpis(labels, values) {
  return `<div class="kpi-grid">${labels.map((k, i) => `<article class="card kpi"><span>${k}</span><strong>${values[i]}</strong></article>`).join("")}</div>`;
}
function rowsTable(rows, page) {
  const d = t();
  const receiving = page === "xarid" && state.role === 3 && route === "xarid";
  const listed = rows
    .filter((x) =>
      `${d[x.kind]} ${x.id}`.toLowerCase().includes(state.filter.toLowerCase()),
    )
    .sort((a, b) => (state.sort ? b.value - a.value : a.id - b.id));
  return `<div class="table-scroll"><table><thead><tr><th scope="col">${d.rows[0]}</th><th scope="col">${d.rows[1]}</th><th scope="col" aria-sort="${state.sort ? "descending" : "none"}"><button class="sort" type="button" data-action="sort">${d.rows[2]} ${state.sort ? "↓" : "↕"}</button></th>${receiving ? `<th scope="col">${d.receive}</th>` : ""}</tr></thead><tbody>${listed.length ? listed.map((x) => `<tr><th scope="row">${d[x.kind]} ${String(x.id).padStart(2, "0")}</th><td>${x.day ? `${x.day}.${String(x.month + 1).padStart(2, "0")}.2026` : "20.11.2026"}</td><td>${page === "ombor" && state.role === 2 ? `${num(x.value)} ${d.unit}` : money(x.value)}</td>${receiving ? `<td>${state.received.has(x.id) ? d.received : btn(d.receive, `receive:${x.id}`, "secondary")}</td>` : ""}</tr>`).join("") : `<tr><td colspan="${receiving ? 4 : 3}">${d.noResults}</td></tr>`}</tbody></table></div>`;
}
let tableRows = [];
function trendCard(
  a = DEMO_DATA.revenue,
  b = DEMO_DATA.cost,
  labels = t().months,
) {
  const d = t();
  return `<article class="card viz"><h3>${d.trend}</h3>${chart(a, b)}<div class="chart-labels">${labels.map((x) => `<span>${x}</span>`).join("")}</div><div class="legend"><span>${d.metric[0]}</span><span>${d.metric[2]}</span></div></article>`;
}
function overview(s) {
  const d = t();
  const periodIndices =
    state.period === 4
      ? DEMO_DATA.revenue.map((_, i) => i)
      : state.period === 3
        ? [8, 9, 10]
        : [10];
  const values = [
    s.revenue,
    s.profit,
    s.cost,
    s.balance,
    s.debt,
    s.payable,
    s.stock,
  ];
  return `${kpis(
    d.metric,
    values.map((x) => money(x, true)),
  )}<div class="two dash-grid">${trendCard(DEMO_DATA.revenue, DEMO_DATA.cost)}${cashCard(s)}<article class="card viz"><h3>${d.expenses}</h3><div class="expense-layout"><div class="donut" aria-hidden="true"></div><ul class="clean">${[4, 3, 5].map((m, i) => `<li>${d.modules[m]} · ${money(s.cost * [0.5, 0.3, 0.2][i], true)}</li>`).join("")}</ul></div></article><article class="card viz"><h3>${d.debts}</h3><ul class="clean">${[
    "0–30",
    "31–60",
    "60+",
  ]
    .map(
      (v, i) =>
        `<li>${v} · ${money(
          DEMO_DATA.debt
            .filter((x) => (x.days <= 30 ? 0 : x.days <= 60 ? 1 : 2) === i)
            .reduce((a, x) => a + x.value, 0),
          true,
        )}</li>`,
    )
    .join(
      "",
    )}</ul></article><article class="card viz"><h3>${d.top}</h3><ul class="clean">${DEMO_DATA.inventory
    .slice(-3)
    .reverse()
    .map((x) => `<li>${d.item} ${x.id} · ${money(x.value, true)}</li>`)
    .join(
      "",
    )}</ul><h3>${d.stock}</h3><p>${d.materialItem} 01 · 4 ${d.unit}</p></article><article class="card viz"><h3>${d.health}</h3><div class="ring"><b>84<small>/100</small></b></div><p>${periodIndices.map((i) => d.months[i]).join(", ")} · ${d.metric[1]} ${money(s.profit, true)}</p><p>${d.healthNote}</p></article><article class="card viz insight"><h3>${d.attention}</h3><span class="gold">${d.medium}</span><p>${d.signal}</p>${btn(d.task, "task:2", "primary", "arrow")}</article><article class="card viz"><h3>${d.today}</h3>${state.tasks.length ? `<ul class="clean">${state.tasks.map((i) => `<li>${icon("check", 16)}${d.questions[i]}</li>`).join("")}</ul>` : `<p>${d.emptyTasks}</p>`}</article></div>`;
}
function moduleView(page, rows) {
  const d = t(),
    total = rows.reduce((a, r) => a + r.value, 0),
    max = Math.max(0, ...rows.map((x) => x.value));
  const fmt = (x) =>
    page === "ombor" && state.role === 2
      ? `${num(x)} ${d.unit}`
      : money(x, true);
  return `${kpis([d.rows[2], d.rows[0], `↑ ${d.rows[2]}`], [fmt(total), num(rows.length), fmt(max)])}<div class="two dash-grid"><article class="card viz"><h3>${name(page)}</h3>${chart(rows.length === 1 ? [rows[0].value, rows[0].value] : rows.map((x) => x.value), [])}<div class="chart-labels"><span>01</span><span>${rows.length}</span></div></article><article class="card viz insight"><span class="tile purple">${icon("spark", 20)}</span><h3>${d.attention}</h3><p>${page === "ombor" ? d.findings[3] : d.benefits[keys.indexOf(page)]}</p>${state.role === 0 ? `<a href="${url("ai")}" class="btn secondary">${d.nav[1]}${icon("arrow", 17)}</a>` : ""}</article></div><article class="card viz records"><label>${d.filter}<input id="filter" value="${esc(state.filter)}" placeholder="${d.filter}"></label><div id="rows">${rowsTable(rows, page)}</div></article>`;
}
const app = $("#app"),
  dialog = $("#dialog");
let route = "landing",
  epoch = 0,
  modalTrigger,
  toastTimer,
  pendingSection;
function routeKey() {
  const hash = location.hash;
  if (!hash || hash === "#/") return "landing";
  if (hash === "#/demo") return "home";
  const page = hash.match(/^#\/demo\/([a-z]+)$/)?.[1];
  if (keys.includes(page)) return page;
  history.replaceState(null, "", "#/");
  return "landing";
}
async function render({ focus = false, restore = true } = {}) {
  const stamp = ++epoch;
  const old = document.activeElement;
  const action = restore ? old?.dataset.action : null;
  const activeId = restore ? old?.id : null;
  const openDetails = restore
    ? Array.from(app.querySelectorAll("details")).map((x) => x.open)
    : [];
  const d = t();
  document.documentElement.lang = state.lang;
  document.documentElement.dataset.theme = state.theme;
  $("#skip").textContent = d.skip;
  app.innerHTML = route === "landing" ? landing() : shell(route);
  app.querySelectorAll("details").forEach((x, i) => {
    if (openDetails[i]) x.open = true;
  });
  factoryUpdate();
  updateScroll();
  if (route === "landing") reveal();
  if (focus) {
    window.scrollTo(0, 0);
    $("h1", app)?.focus({ preventScroll: true });
  } else if (action) {
    app
      .querySelector(`[data-action="${CSS.escape(action)}"]`)
      ?.focus({ preventScroll: true });
  } else if (activeId) {
    document.getElementById(activeId)?.focus({ preventScroll: true });
  }
  if (route === "landing") {
    const messages = $(".messages:not(:empty)");
    if (messages) messages.scrollTop = messages.scrollHeight;
    return;
  }
  const content = $("#dash-content");
  if (route === "ai" && state.role === 0) {
    content.innerHTML = chat("demo");
    $(".messages", content).scrollTop = $(".messages", content).scrollHeight;
  } else if (route !== "home" && !RBAC[state.role].includes(route)) {
    content.innerHTML = `<article class="card viz"><span class="tile">${icon("lock")}</span><h2>${d.denied}</h2><p>${d.deniedText}</p><a class="btn secondary" href="#/demo">${d.overview}</a></article>`;
  } else if (route === "home" && state.role === 0) {
    const s = await dataService.getSnapshot(state.period);
    if (stamp !== epoch) return;
    content.innerHTML = overview(s);
  } else {
    const page = route === "home" ? RBAC[state.role][0] : route;
    const rows = await dataService.getRows(page, state.role, state.period);
    if (stamp !== epoch) return;
    tableRows = rows;
    content.innerHTML = moduleView(page, rows);
  }
  content.setAttribute("aria-busy", "false");
  if (action === "sort")
    $('[data-action="sort"]', content)?.focus({ preventScroll: true });
}
const seen = new WeakSet();
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      seen.add(entry.target);
      entry.target.classList.add("arrived");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.12 },
);
function reveal() {
  observer.disconnect();
  for (const el of app.querySelectorAll(".step, .module"))
    if (!seen.has(el)) observer.observe(el);
}
function updateScroll() {
  const y = window.scrollY;
  const header = $(".header");
  if (!header) return;
  header.classList.toggle("compact", y > 30);
  $(".progress", header).style.transform =
    `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
}
window.addEventListener("scroll", updateScroll, { passive: true });
function onRoute() {
  if (dialog.open) dialog.close();
  route = routeKey();
  state.filter = "";
  state.sort = false;
  render({ focus: true, restore: false });
  if (pendingSection && route === "landing") {
    jump(pendingSection);
    pendingSection = null;
  }
}
window.addEventListener("hashchange", onRoute);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (!state.theme) render();
});
function jump(id) {
  const section = document.getElementById(id);
  if (!section) {
    pendingSection = id;
    location.hash = "/";
    return;
  }
  section.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
  const title = $("h2", section);
  title.setAttribute("tabindex", "-1");
  title.focus({ preventScroll: true });
}
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function factoryUpdate() {
  if (!$("#factory-range")) return;
  const cost = 50000 + (30000 * state.factory) / 100;
  $("#factory-percent").textContent = `${num(state.factory)}%`;
  $("#factory-cost").textContent = money(cost);
  $("#factory-margin").textContent = `${num(((65000 - cost) / 65000) * 100)}%`;
}
function formField(index, type = "text") {
  const d = t();
  return `<label>${d.fields[index]}${type === "textarea" ? '<textarea name="message" required minlength="5" maxlength="500"></textarea>' : `<input name="field${index}" type="${type}" required ${type === "tel" ? 'inputmode="tel" placeholder="+998 XX XXX XX XX" autocomplete="tel" maxlength="17"' : type === "password" ? 'minlength="8" maxlength="72" autocomplete="new-password"' : 'minlength="2" maxlength="80"'}>`}</label>`;
}
function openModal(mode) {
  const d = t();
  if (!dialog.open) modalTrigger = document.activeElement;
  const title = {
    signup: d.trial,
    login: d.login,
    contact: d.contact,
    menu: d.menu,
    more: d.more,
    search: d.search,
    notifications: d.notifications,
  }[mode];
  let body = "";
  if (["signup", "contact"].includes(mode)) {
    body = `<p class="muted">${d.formNote}</p><form id="contact-form" data-mode="${mode}" novalidate>${formField(0)}${mode === "signup" ? formField(1) : ""}${formField(2, "tel")}${mode === "signup" ? `<div class="password-field">${formField(3, "password")}${btn(d.show, "password", "ghost")}</div>` : formField(4, "textarea")}<p class="form-error" role="alert" hidden>${d.invalid}</p><button class="btn primary" type="submit">${mode === "signup" ? d.trial : d.send}${icon("arrow", 17)}</button></form>`;
  } else if (mode === "login") {
    body = `<p>${d.loginSuccess}. ${d.formNote}</p>${demoLink()}`;
  } else if (mode === "menu") {
    body = `<nav class="modal-nav" aria-label="${d.menu}">${sectionLinks()}</nav><div class="actions">${switches()}${btn(d.login, "login", "secondary")}${btn(d.trial, "signup", "primary")}</div>`;
  } else if (mode === "more") {
    body = `<nav class="modal-nav" aria-label="${d.menu}">${["home"]
      .concat(RBAC[state.role])
      .map((k) => navLink(k, route))
      .join(
        "",
      )}<a href="#/">${d.back}</a></nav><div class="actions">${switches()}${ib(d.notifications, "notifications", "bell")}</div>`;
  } else if (mode === "search") {
    body = `<input id="search-query" aria-label="${d.search}" placeholder="${d.search}"><nav class="modal-nav" id="search-results" aria-label="${d.search}"></nav>`;
  } else {
    body = `<p>${state.role === 0 ? d.signal : d.benefits[keys.indexOf(RBAC[state.role][0])]}</p>${state.role === 0 ? `<a class="btn secondary" href="${url("ai")}">${d.nav[1]}</a>` : ""}`;
  }
  dialog.dataset.mode = mode;
  dialog.setAttribute("aria-labelledby", "modal-title");
  dialog.innerHTML = `<header class="dialog-head"><h2 id="modal-title">${title}</h2>${ib(d.close, "close", "close")}</header>${body}`;
  if (!dialog.open) dialog.showModal();
  if (mode === "search") {
    searchUpdate();
    $("#search-query").focus();
  } else
    (
      dialog.querySelector("form input") || dialog.querySelector("button")
    )?.focus();
}
function searchUpdate() {
  const q = $("#search-query").value.trim().toLowerCase();
  const items = ["home"]
    .concat(RBAC[state.role])
    .filter((k) => name(k).toLowerCase().includes(q));
  $("#search-results").innerHTML = items.length
    ? items.map((k) => navLink(k, route)).join("")
    : `<p>${t().noResults}</p>`;
}
dialog.addEventListener("close", () => {
  dialog.innerHTML = "";
  modalTrigger?.isConnected && modalTrigger.focus({ preventScroll: true });
});
async function ask(scope, index, question) {
  if (state.pending[scope]) return;
  state.pending[scope] = true;
  const d = t();
  const keywords = [
    /foyda|прибыл/i,
    /xarajat|расход|затрат/i,
    /qarz|долж|долг/i,
    /tugab|qoldiq|товар|запас/i,
    /oqim|cash|поток/i,
    /tannarx|себестоим/i,
  ];
  if (index === null) index = keywords.findIndex((r) => r.test(question));
  state.chats[scope].push({
    index: -2,
    question: question || d.questions[index],
  });
  render();
  const resolved = await dataService.answer(index);
  state.chats[scope].at(-1).index = resolved;
  state.pending[scope] = false;
  render();
}
document.addEventListener("click", (e) => {
  const section = e.target.closest("[data-section]");
  if (section) {
    e.preventDefault();
    if (dialog.open) dialog.close();
    jump(section.dataset.section);
    return;
  }
  const link = e.target.closest('a[href^="#/"]');
  if (link && dialog.open) dialog.close();
  const control = e.target.closest("[data-action]");
  if (!control) return;
  const [action, arg, extra] = control.dataset.action.split(":");
  if (action === "close") {
    dialog.close();
    return;
  }
  if (
    [
      "signup",
      "contact",
      "login",
      "menu",
      "more",
      "search",
      "notifications",
    ].includes(action)
  ) {
    openModal(action);
    return;
  }
  if (action === "lang" || action === "theme") {
    const mode = dialog.open ? dialog.dataset.mode : null;
    if (action === "lang") {
      state.lang = arg;
      save("lang", arg);
    } else {
      state.theme = currentDark() ? "light" : "dark";
      save("theme", state.theme);
    }
    render();
    if (mode) openModal(mode);
    return;
  }
  if (action === "password") {
    const p = $('[name="field3"]', dialog);
    p.type = p.type === "password" ? "text" : "password";
    control.textContent = p.type === "password" ? t().show : t().hide;
    return;
  }
  if (action === "ask") {
    ask(arg, Number(extra));
    return;
  }
  if (action === "task") {
    const index = Number(arg);
    if (!state.tasks.includes(index)) state.tasks.push(index);
    if (route === "home") render();
    toast(t().taskDone);
    return;
  }
  if (action === "receive" && state.role === 3 && route === "xarid") {
    state.received.add(Number(arg));
    $("#rows").innerHTML = rowsTable(tableRows, route);
    toast(t().received);
    return;
  }
  if (action === "remind") {
    toast(t().remindDone);
    return;
  }
  if (action === "sort") {
    state.sort = !state.sort;
    $("#rows").innerHTML = rowsTable(
      tableRows,
      route === "home" ? RBAC[state.role][0] : route,
    );
    $('[data-action="sort"]').focus({ preventScroll: true });
    return;
  }
  if (action === "collapse") state.collapsed = !state.collapsed;
  if (action === "annual") state.annual = arg === "1";
  if (action === "landingRole") state.landingRole = Number(arg);
  render();
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "factory-range") {
    state.factory = Number(el.value);
    factoryUpdate();
  }
  if (el.id === "search-query") searchUpdate();
  if (el.id === "filter") {
    state.filter = el.value;
    $("#rows").innerHTML = rowsTable(
      tableRows,
      route === "home" ? RBAC[state.role][0] : route,
    );
  }
  if (el.type === "tel") {
    let digits = el.value.replace(/\D/g, "");
    if (digits.startsWith("998")) digits = digits.slice(3);
    else if (/^\+998?\s*$/.test(el.value) || /^\+9\s*$/.test(el.value))
      digits = "";
    digits = digits.slice(0, 9);
    const groups = [
      digits.slice(0, 2),
      digits.slice(2, 5),
      digits.slice(5, 7),
      digits.slice(7, 9),
    ].filter(Boolean);
    el.value = ["+998"].concat(groups).join(" ");
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "role") {
    state.role = Number(e.target.value);
    save("role", state.role);
    state.filter = "";
    state.sort = false;
    render();
  }
  if (e.target.id === "period") {
    state.period = Number(e.target.value);
    render();
  }
});
document.addEventListener("submit", (e) => {
  const form = e.target;
  if (form.dataset.chat) {
    e.preventDefault();
    const q = $("input", form).value.trim();
    if (q) ask(form.dataset.chat, null, q);
    return;
  }
  if (form.id !== "contact-form") return;
  e.preventDefault();
  const fields = Array.from(form.querySelectorAll("input,textarea"));
  const invalid = fields.filter(
    (x) =>
      !x.checkValidity() ||
      !x.value.trim() ||
      (x.type === "tel" && !/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(x.value)),
  );
  fields.forEach((x) =>
    x.setAttribute("aria-invalid", String(invalid.includes(x))),
  );
  $(".form-error", form).hidden = !invalid.length;
  if (invalid.length) {
    invalid[0].focus();
    return;
  }
  const signup = form.dataset.mode === "signup";
  $("#modal-title").textContent = signup ? t().success : t().contactSuccess;
  form.outerHTML = signup ? demoLink() : btn(t().close, "close", "primary");
  (dialog.querySelector("a") || dialog.querySelector(".primary"))?.focus();
});
document.addEventListener("keydown", (e) => {
  if (
    (e.metaKey || e.ctrlKey) &&
    e.key.toLowerCase() === "k" &&
    route !== "landing"
  ) {
    e.preventDefault();
    openModal("search");
  }
});
$("#skip").addEventListener("click", (e) => {
  e.preventDefault();
  $("#main")?.focus();
});
route = routeKey();
render();
app.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const visual = event.target.closest(".hero-visual");
  if (!visual) return;
  const box = visual.getBoundingClientRect();
  visual.style.setProperty("--mx", `${event.clientX - box.left}px`);
  visual.style.setProperty("--my", `${event.clientY - box.top}px`);
});
