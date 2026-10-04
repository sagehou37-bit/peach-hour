(function () {
  const VENUES = window.VENUES || [];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const $ = id => document.getElementById(id);

  const state = {
    q: "", mode: "any", pickDay: 0, pickTime: 17 * 60,
    hoods: new Set(), prices: new Set(), deals: new Set(), cuisines: new Set(),
    vibes: new Set(), types: new Set(), outdoor: new Set(), conf: new Set(), sort: "smart", view: "list",
    favsOnly: false, userLoc: null, campus: "", maxDrive: 15,
  };

  // ── storage (per-viewer favorites) ─────────────────────────────
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const favs = new Set(store.get("ph-favs", []));

  // ── time helpers ───────────────────────────────────────────────
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  function fmt(min) {
    min = ((min % 1440) + 1440) % 1440;
    let h = Math.floor(min / 60); const m = min % 60; const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, "0")}${ap}` : `${h}${ap}`;
  }
  const hoursAsWindows = v => v.hours.map((x, d) => x && { days: [d], start: x[0], end: x[1] }).filter(Boolean);
  const startOf = w => (w.allDay ? "00:00" : w.start);
  const endOf = w => (w.allDay ? "24:00" : w.end);

  // Window active at (day, mins)? Handles windows crossing midnight.
  function activeWindow(list, day, mins) {
    const prev = (day + 6) % 7;
    for (const w of list) {
      const s = toMin(startOf(w)), e = toMin(endOf(w)), cross = e <= s;
      if (w.days.includes(day)) {
        if (!cross && mins >= s && mins < e) return { w, endsAt: e };
        if (cross && mins >= s) return { w, endsAt: e };
      }
      if (cross && w.days.includes(prev) && mins < e) return { w, endsAt: e };
    }
    return null;
  }
  function nextStart(list, day, mins) {
    let best = null;
    for (let d = 0; d < 7; d++) {
      const dd = (day + d) % 7;
      for (const w of list) {
        if (!w.days.includes(dd)) continue;
        const inMin = toMin(startOf(w)) + d * 1440 - mins;
        if (inMin > 0 && (!best || inMin < best.inMin)) best = { inMin, w, day: dd, offset: d };
      }
    }
    return best;
  }
  function daysLabel(days) {
    const s = [...days].sort((a, b) => a - b);
    if (s.length === 7) return "Daily";
    const runs = []; let start = s[0], prev = s[0];
    for (let i = 1; i <= s.length; i++) {
      if (s[i] === prev + 1) { prev = s[i]; continue; }
      runs.push(start === prev ? DAYS[start] : prev === start + 1 ? `${DAYS[start]}, ${DAYS[prev]}` : `${DAYS[start]}–${DAYS[prev]}`);
      start = prev = s[i];
    }
    return runs.join(", ");
  }

  // Current day/minute in Atlanta, regardless of the viewer's time zone.
  function atlNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    return { day: DAYS.indexOf(parts.weekday), mins: (+parts.hour % 24) * 60 + +parts.minute };
  }
  function refTime() {
    if (state.mode === "hhat") return { day: state.pickDay, mins: state.pickTime, live: false };
    return { ...atlNow(), live: true };
  }

  function statusFor(v, t) {
    // open: true/false when hours are known, null when they aren't
    const open = v.hours ? !!activeWindow(hoursAsWindows(v), t.day, t.mins) : null;
    const hh = open === false ? null : activeWindow(v.happyHours, t.day, t.mins);
    const next = nextStart(v.happyHours, t.day, t.mins);
    let label, cls, rank;
    if (hh) {
      const what = hh.w.note || (t.live ? "Happy hour now" : "Happy hour");
      label = hh.w.allDay ? `${what} · today` : `${what} · until ${fmt(hh.endsAt)}`; cls = "live"; rank = 0;
    } else if (next && next.offset === 0) {
      const soon = next.inMin <= 90;
      label = `Starts ${t.live && soon ? `in ${next.inMin} min` : `at ${fmt(toMin(next.w.start))}`} · ends ${fmt(toMin(next.w.end))}`;
      if (next.w.allDay) label = `${next.w.note || "Special"} · today`;
      cls = soon ? "soon" : "later"; rank = 1 + next.inMin / 1440;
    } else if (next) {
      label = `Next: ${next.offset === 1 ? "tomorrow" : DAYS[next.day]}${next.w.allDay ? "" : " " + fmt(toMin(next.w.start))}`; cls = "none"; rank = 3 + next.inMin / 1440;
    } else { label = "Happy hour not confirmed — ask the bar"; cls = "none"; rank = 9; }
    return { hh, open, label, cls, rank };
  }

  function haversine(a, b) {
    const R = 3958.8, rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const milesTo = v => (state.userLoc ? haversine(state.userLoc, v) : null);

  // Rough drive time: straight-line miles × 1.35 for real roads, ~20 mph city driving, + 2 min to park.
  const CAMPUSES = {
    emory: { name: "Emory", lat: 33.7925, lng: -84.3240 },
    gt: { name: "Georgia Tech", lat: 33.7756, lng: -84.3963 },
  };
  const driveMin = v => (state.campus ? Math.round(haversine(CAMPUSES[state.campus], v) * 1.35 / 20 * 60 + 2) : null);

  // ── filter UI ─────────────────────────────────────────────────
  // Every filter control writes to `state`, then syncUI() repaints the controls.
  const HOOD_ORDER = ["Buckhead", "Midtown", "West Midtown", "Home Park", "Virginia-Highland", "Poncey-Highland", "Eastside Beltline",
    "Edgewood", "Inman Park", "Little Five Points", "Reynoldstown", "Emory / Druid Hills", "Toco Hills", "North Decatur", "Decatur"];
  const hoodRank = h => (HOOD_ORDER.includes(h) ? HOOD_ORDER.indexOf(h) : 99);
  const uniq = key => [...new Set(VENUES.flatMap(v => [].concat(v[key] || [])))].sort();
  const DEAL_LABELS = { beer: "Beer", wine: "Wine", cocktails: "Cocktails", oysters: "Oysters", food: "Food" };
  const groups = {
    hoods: { els: ["hoods"], values: uniq("neighborhood").sort((x, y) => hoodRank(x) - hoodRank(y)) },
    prices: { els: ["prices"], values: [1, 2, 3], label: p => "$".repeat(p) },
    deals: { els: ["deals"], values: Object.keys(DEAL_LABELS), label: d => DEAL_LABELS[d] },
    vibes: { els: ["vibes"], values: uniq("vibes") },
    types: { els: ["types"], values: uniq("type") },
    outdoor: { els: ["outdoor"], values: uniq("outdoor") },
    cuisines: { els: ["cuisines"], values: uniq("cuisine") },
    conf: { els: ["conf"], values: ["confirmed", "reported"], label: c => ({ confirmed: "Confirmed", reported: "Call to confirm" })[c] },
  };
  for (const [key, g] of Object.entries(groups)) {
    for (const el of g.els) {
      g.values.forEach((val, i) => {
        const b = document.createElement("button");
        b.className = "chip"; b.type = "button"; b.dataset.k = key; b.dataset.i = i;
        b.textContent = g.label ? g.label(val) : val;
        b.onclick = () => { state[key].has(val) ? state[key].delete(val) : state[key].add(val); update(); };
        $(el).appendChild(b);
      });
    }
  }
  const all = sel => document.querySelectorAll(sel);

  function syncUI() {
    all(".chip[data-k]").forEach(b => b.classList.toggle("on", state[b.dataset.k].has(groups[b.dataset.k].values[b.dataset.i])));
    all(".mode-seg button").forEach(b => b.classList.toggle("on", b.dataset.mode === state.mode));
    all(".pick").forEach(p => { p.hidden = state.mode !== "hhat"; });
    all(".pickDay").forEach(x => { x.value = state.pickDay; });
    all(".pickTime").forEach(x => { x.value = state.pickTime; });
    all(".campus-seg button").forEach(b => b.classList.toggle("on", b.dataset.campus === state.campus));
    all(".campus-range-wrap").forEach(w => { w.hidden = !state.campus; });
    all(".campus-range").forEach(r => { r.value = state.maxDrive; });
    all(".campus-label").forEach(l => {
      l.textContent = state.campus ? `Within about ${state.maxDrive} min drive of ${CAMPUSES[state.campus].name}` : "";
    });
  }
  function update() { syncUI(); render(); }

  state.pickDay = atlNow().day;
  all(".pickDay").forEach(sel => {
    DAYS.forEach((d, i) => sel.add(new Option(d, i)));
    sel.onchange = e => { state.pickDay = +e.target.value; update(); };
  });
  all(".pickTime").forEach(sel => {
    for (let m = 11 * 60; m <= 26 * 60; m += 30) sel.add(new Option(fmt(m), m % 1440));
    sel.onchange = e => { state.pickTime = +e.target.value; update(); };
  });
  all(".campus-range").forEach(r => { r.oninput = e => { state.maxDrive = +e.target.value; update(); }; });
  document.addEventListener("click", e => {
    const m = e.target.closest(".mode-seg button");
    if (m) { state.mode = m.dataset.mode; update(); }
    const c = e.target.closest(".campus-seg button");
    if (c) { state.campus = c.dataset.campus; update(); }
  });

  $("view").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    state.view = b.dataset.view;
    [...$("view").children].forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    $("list").hidden = state.view !== "list"; $("map").hidden = state.view !== "map";
    render();
  };
  $("q").oninput = e => { state.q = e.target.value.trim().toLowerCase(); render(); };
  $("sort").onchange = e => {
    state.sort = e.target.value;
    if (state.sort === "near" && !state.userLoc && !state.campus) locate(); else render();
  };
  // Scroll so the target sits just below the sticky top bar.
  const scrollToEl = el => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - $("topbar").offsetHeight - 8, behavior: "smooth" });
  const scrollToResults = () => scrollToEl($("results"));

  $("navSaved").onclick = () => {
    state.favsOnly = !state.favsOnly; $("navSaved").setAttribute("aria-pressed", state.favsOnly);
    render(); scrollToResults();
  };

  // "More filters" expands the extra filters inside the same box.
  function setMore(open) {
    $("moreGrid").hidden = !open;
    $("moreFilters").setAttribute("aria-expanded", open);
    $("moreFilters").textContent = open ? "Fewer filters" : "More filters";
  }
  $("moreFilters").onclick = () => setMore($("moreGrid").hidden);
  $("toggleFilters").onclick = () => { setMore(true); scrollToEl($("finder")); };
  $("homeShow").onclick = scrollToResults;
  $("heroCta").onclick = e => { e.preventDefault(); scrollToEl($("finder")); };

  // Contact form: Netlify Forms collects submissions (Netlify dashboard → Forms).
  all('[data-topic]').forEach(a => { a.onclick = () => { $("topic").value = a.dataset.topic; }; });
  $("contactForm").onsubmit = async e => {
    e.preventDefault();
    const form = e.target, status = $("formStatus");
    status.textContent = "Sending…";
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error(res.status);
      form.reset(); status.textContent = "Thanks! We got your message.";
    } catch {
      status.textContent = "Sorry, that didn't send. Please try again in a minute.";
    }
  };
  $("locate").onclick = locate;
  $("clearAll").onclick = () => {
    for (const k of Object.keys(groups)) state[k].clear();
    Object.assign(state, { mode: "any", campus: "", maxDrive: 15, q: "", favsOnly: false });
    $("q").value = ""; $("navSaved").setAttribute("aria-pressed", false);
    update();
  };

  function locate() {
    if (!navigator.geolocation) return alert("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      p => { state.userLoc = { lat: p.coords.latitude, lng: p.coords.longitude }; state.sort = "near"; $("sort").value = "near"; render(); },
      () => alert("Couldn't get your location."));
  }

  // ── filtering + rendering ─────────────────────────────────────
  const anyOf = (set, arr) => !set.size || [].concat(arr).some(x => set.has(x));
  function filtered() {
    const t = refTime();
    return VENUES.map(v => ({ v, s: statusFor(v, t), mi: milesTo(v), dm: driveMin(v) })).filter(({ v, s, dm }) => {
      if (state.campus && dm > state.maxDrive) return false;
      if (state.q && ![v.name, v.address, v.neighborhood, v.type, ...v.cuisine, ...v.vibes, ...v.outdoor, v.dealText, ...v.happyHours.map(w => w.note || "")].join(" ").toLowerCase().includes(state.q)) return false;
      if (state.mode === "hhnow" || state.mode === "hhat") { if (!s.hh) return false; }
      if (state.mode === "opennow" && s.open !== true) return false;
      if (state.favsOnly && !favs.has(v.id)) return false;
      return anyOf(state.hoods, v.neighborhood) && anyOf(state.prices, v.price) && anyOf(state.deals, v.deals)
        && anyOf(state.cuisines, v.cuisine) && anyOf(state.vibes, v.vibes) && anyOf(state.types, v.type) && anyOf(state.outdoor, v.outdoor) && anyOf(state.conf, v.hhStatus);
    }).sort((a, b) => {
      if (state.sort === "near" && a.mi != null) return a.mi - b.mi;
      if (state.sort === "near" && a.dm != null) return a.dm - b.dm;
      if (state.sort === "price") return a.v.price - b.v.price || a.s.rank - b.s.rank;
      if (state.sort === "name") return a.v.name.localeCompare(b.v.name);
      return a.s.rank - b.s.rank || a.v.name.localeCompare(b.v.name);
    });
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mapsUrl = v => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " " + v.address + " Atlanta GA")}`;

  const ICON = {
    heart: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>',
    share: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
  };
  const shareLabel = `${ICON.share}<span>Share</span>`;

  function card({ v, s, mi, dm }) {
    const fav = favs.has(v.id);
    const price = `<span class="price" aria-label="Price ${v.price} of 3">${"$".repeat(v.price)}<span>${"$".repeat(3 - v.price)}</span></span>`;
    const dist = [mi != null ? `${mi.toFixed(1)} mi away` : "", dm != null ? `~${dm} min drive from ${CAMPUSES[state.campus].name}` : ""].filter(Boolean).join(" · ");
    const sched = v.happyHours.map(w => `<div><dt>${daysLabel(w.days)}</dt><dd>${w.allDay ? "All day" : `${fmt(toMin(w.start))}–${fmt(toMin(w.end))}`}${w.note ? ` <span class="note">${esc(w.note)}</span>` : ""}</dd></div>`).join("");
    const openState = s.open === null ? "" : `<span class="open-state ${s.open ? "is-open" : ""}">${s.open ? "Open now" : "Closed now"}</span>`;
    const confirm = v.hhStatus === "reported" ? `<span class="confirm" title="Info came from older or third-party sources">Call to confirm</span>` : "";
    const srcs = v.sources.map(x => `<a href="${x.url}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(", ");
    const tags = [...v.cuisine, ...v.vibes, ...v.outdoor];
    return `<article class="card">
      <header class="card-head">
        <div>
          <p class="kicker">${esc(v.neighborhood)} <span>/</span> ${esc(v.type)} <span>/</span> ${price}</p>
          <h4>${esc(v.name)}</h4>
        </div>
        <button class="heart" data-fav="${v.id}" aria-pressed="${fav}" aria-label="Save ${esc(v.name)}">${ICON.heart}</button>
      </header>
      <div class="status-row"><span class="status ${s.cls}">${s.label}</span>${openState}</div>
      <p class="deal">${esc(v.dealText)}</p>
      <dl class="sched">${sched}</dl>
      <p class="addr">${esc(v.address)}${dist ? `<span class="dist">${dist}</span>` : ""}</p>
      ${tags.length ? `<p class="tags">${tags.map(esc).join(", ")}</p>` : ""}
      <footer class="card-foot">
        <a class="act" href="${mapsUrl(v)}" target="_blank" rel="noopener">${ICON.pin}<span>Directions</span></a>
        <button class="act" data-share="${v.id}">${shareLabel}</button>
        ${confirm}
        <details class="src"><summary>Source</summary><p>${srcs}. Checked ${v.checked}.</p></details>
      </footer>
    </article>`;
  }

  let map, layer;
  function renderMap(items) {
    if (!window.L) { $("map").textContent = "Map couldn't load."; return; }
    if (!map) {
      map = L.map("map").setView([33.768, -84.357], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    setTimeout(() => map.invalidateSize(), 0);
    layer.clearLayers();
    const color = { live: "#16804f", soon: "#e8a020", later: "#ff6a3d", none: "#9a968f" };
    items.forEach(({ v, s }) => {
      L.circleMarker([v.lat, v.lng], { radius: 9, color: "#fff", weight: 2, fillColor: color[s.cls], fillOpacity: 1 })
        .bindPopup(`<b>${esc(v.name)}</b><br>${esc(s.label)}<br><small>${esc(v.dealText)}</small><br><a href="${mapsUrl(v)}" target="_blank" rel="noopener">Directions</a>`)
        .addTo(layer);
    });
    if (state.userLoc) L.circleMarker([state.userLoc.lat, state.userLoc.lng], { radius: 7, color: "#1b1f3b", fillColor: "#fff", fillOpacity: 1 }).bindPopup("You").addTo(layer);
  }

  function render() {
    const items = filtered();
    const t = refTime();
    const when = state.mode === "hhat" ? ` on ${DAYS[t.day]} at ${fmt(t.mins)}` : "";
    $("count").textContent = `${items.length} spot${items.length === 1 ? "" : "s"}${when}`;
    const showLabel = `Show ${items.length} spot${items.length === 1 ? "" : "s"}`;
    $("homeShow").textContent = showLabel;
    $("savedCount").textContent = favs.size;
    const active = Object.keys(groups).reduce((n, k) => n + state[k].size, (state.mode === "any" ? 0 : 1) + (state.campus ? 1 : 0));
    $("toggleFilters").innerHTML = active ? `Filters <span class="n">${active}</span>` : "Filters";
    if (state.view === "list") {
      $("list").innerHTML = items.length ? items.map(card).join("")
        : `<p class="empty">Nothing matches those filters. Try loosening a few.</p>`;
    } else renderMap(items);
  }

  $("list").onclick = async e => {
    const f = e.target.closest("[data-fav]"), sh = e.target.closest("[data-share]");
    if (f) {
      const id = f.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id);
      store.set("ph-favs", [...favs]); render();
    }
    if (sh) {
      const v = VENUES.find(x => x.id === sh.dataset.share);
      const url = `${location.origin}${location.pathname}?q=${encodeURIComponent(v.name)}`;
      const s = statusFor(v, refTime());
      try {
        if (navigator.share) await navigator.share({ title: v.name, text: `${v.name} — ${s.label}`, url });
        else { await navigator.clipboard.writeText(url); sh.innerHTML = `${ICON.share}<span>Link copied</span>`; setTimeout(() => (sh.innerHTML = shareLabel), 1500); }
      } catch {}
    }
  };

  function tick() {
    const n = atlNow();
    $("clock").textContent = `${DAYS[n.day]} · ${fmt(n.mins)} in Atlanta`;
  }

  const qp = new URLSearchParams(location.search).get("q");
  if (qp) { $("q").value = qp; state.q = qp.toLowerCase(); }
  tick(); update();
  setInterval(() => { tick(); if (state.mode !== "hhat") render(); }, 60_000);
})();
