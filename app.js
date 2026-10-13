(function () {
  const VENUES = window.VENUES || [];
  // Happy hours that run "until close" are expanded into one window per day using
  // that day's closing time; the original list is kept for display ("10PM–close").
  VENUES.forEach(v => {
    v.hhDisplay = v.happyHours;
    // Weather-only deals ("$5 margs when it's raining") are shown but never counted as live.
    v.rainDeal = v.happyHours.find(w => w.rain);
    v.happyHours = v.happyHours.filter(w => !w.rain).flatMap(w => {
      if (w.end !== "close") return [w];
      return w.days.map(d => {
        const r = v.hours && v.hours[d];
        const ranges = !r ? [] : Array.isArray(r[0]) ? r : [r];
        return { ...w, days: [d], end: ranges.length ? ranges[ranges.length - 1][1] : "24:00" };
      });
    });
  });
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const $ = id => document.getElementById(id);

  const state = {
    q: "", mode: "any", pickDay: 0, pickTime: 17 * 60,
    hoods: new Set(), prices: new Set(), deals: new Set(), cuisines: new Set(),
    vibes: new Set(), types: new Set(), outdoor: new Set(), sort: "smart", view: "list",
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
  // A day's hours are [open, close] or a list of ranges like [["11:30", "15:00"], ["16:00", "22:00"]].
  const dayRanges = x => (!x ? [] : Array.isArray(x[0]) ? x : [x]);
  const hoursAsWindows = v => v.hours.flatMap((x, d) => dayRanges(x).map(r => ({ days: [d], start: r[0], end: r[1] })));
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
    const openWin = v.hours ? activeWindow(hoursAsWindows(v), t.day, t.mins) : null;
    const open = v.hours ? !!openWin : null;
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
    } else if (v.rainDeal) { label = `☔ ${v.rainDeal.note}`; cls = "none"; rank = 5; }
    else { label = "Happy hour not confirmed — ask the bar"; cls = "none"; rank = 9; }
    return { hh, open, closesAt: openWin && openWin.endsAt, label, cls, rank, t };
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
  // Evening drive estimate: straight-line miles × 1.35 for roads, at ~15 mph through Atlanta traffic, plus parking.
  const driveFrom = (a, v) => Math.round(haversine(a, v) * 1.35 / 15 * 60 + 3);
  const driveMin = v => (state.campus ? driveFrom(CAMPUSES[state.campus], v) : null);

  // ── filter UI ─────────────────────────────────────────────────
  // Every filter control writes to `state`, then syncUI() repaints the controls.
  const HOOD_ORDER = ["Buckhead", "Midtown", "Atlantic Station", "West Midtown", "Home Park", "Virginia-Highland", "Poncey-Highland", "Eastside Beltline",
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
  };
  // Button labels in Title Case ("Beltline access" -> "Beltline Access"); small words stay lower.
  const SMALL = new Set(["a", "an", "and", "of", "the", "to", "in", "on", "at", "for", "or"]);
  const titleCase = str => String(str).replace(/[A-Za-z][^\s/–-]*/g, (w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)));
  for (const [key, g] of Object.entries(groups)) {
    for (const el of g.els) {
      g.values.forEach((val, i) => {
        const b = document.createElement("button");
        b.className = "chip"; b.type = "button"; b.dataset.k = key; b.dataset.i = i;
        b.textContent = g.label ? g.label(val) : titleCase(val);
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
    if (c) { state.campus = state.campus === c.dataset.campus ? "" : c.dataset.campus; update(); }
  });

  $("view").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    state.view = b.dataset.view;
    [...$("view").children].forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
    $("list").hidden = state.view !== "list"; $("map").hidden = state.view !== "map";
    render();
  };
  // ── search: live results + suggestions ────────────────────────
  const qIn = $("q"), qList = $("qSuggest");
  let sugItems = [], sugActive = -1;
  const setQuery = (text, go) => {
    qIn.value = text; state.q = text.trim(); $("qClear").hidden = !text; render();
    closeSuggest(); if (go) scrollToResults();
  };
  // Suggestions finish the thought: "beer" -> "beer happy hour now", "beer at 5pm", "beer in Virginia-Highland",
  // "beer for $5 or less"... Only ideas that actually return spots are shown, with how many.
  function countFor(query) {
    const saved = parsed; parsed = parseQuery(query);
    const t = parsed.day != null && !parsed.now ? { day: parsed.day, mins: parsed.mins ?? 17 * 60, live: false } : refTime();
    const n = VENUES.filter(v => passes({ v, s: statusFor(v, t), dm: driveMin(v) }, null)).length;
    parsed = saved; return n;
  }
  function suggestions(text) {
    const t = text.trim().replace(/\s+/g, " "); if (!t) return [];
    const out = [], seen = new Set();
    const add = (label, kind, query = label) => {
      if (out.length >= 6 || seen.has(query.toLowerCase())) return;
      const n = countFor(query); if (!n) return;
      seen.add(query.toLowerCase()); out.push({ kind, label, sub: `${n} spot${n === 1 ? "" : "s"}`, query });
    };
    // Finish a half-typed last word first ("bee" -> "beer", "inm" -> "Inman Park").
    const words = t.split(" "), last = words[words.length - 1], lead = words.slice(0, -1).join(" ");
    let base = t;
    if (last.length >= 2 && !DEAL_WORDS[last.toLowerCase()]) {
      const vocab = [...Object.keys(DEAL_WORDS), ...uniq("neighborhood"), ...uniq("cuisine"), ...Object.keys(VIBE_WORDS), "patio", "rooftop", "tonight", "now"];
      const whole = vocab.some(w => fold(w).split(" ").includes(fold(last))) || ["emory", "tech", "gt", "now", "tonight", "today"].includes(fold(last));
      const done = !whole && vocab.find(w => fold(w).startsWith(fold(last)) && fold(w) !== fold(last));
      if (done) base = `${lead ? lead + " " : ""}${done.toLowerCase().includes(" ") || /[A-Z]/.test(done) ? done : done}`;
    }
    const p = parseQuery(base), baseCount = countFor(base);
    const bars = VENUES.filter(v => hits(haystack(v).name, t));
    // Typed a bar's name? Just offer the bar.
    if (bars.length && baseCount <= bars.length) { bars.slice(0, 3).forEach(v => add(v.name, "Bar", v.name)); return out; }
    if (!(p.hoods.length && !p.words.length)) bars.slice(0, 1).forEach(v => add(v.name, "Bar", v.name));
    if (base !== t) add(base, "");
    const narrow = (label, kind) => { if (countFor(label) < baseCount) add(label, kind); };
    const now = atlNow(), hr = Math.min(Math.max(now.mins < 15 * 60 ? 16 : Math.floor(now.mins / 60) + 1, 15), 19), at = `${hr > 12 ? hr - 12 : hr}pm`;
    const timeFree = !p.now && p.day == null && p.mins == null, placeFree = !p.hoods.length && !p.nearHood && !p.campus;
    const topHoods = () => placeFree ? uniq("neighborhood").map(h => [h, countFor(`${base} in ${h}`)]).filter(([, n]) => n && n < baseCount).sort((x, y) => y[1] - x[1]).map(([h]) => h) : [];
    const drinks = ["beer", "wine", "cocktails", "oysters"].filter(d => !p.deals.includes(d));
    // Cheapest price that makes sense for this search (from the deals that actually match).
    const priceStep = phrase => { for (const n of [3, 5, 7, 10]) { const q = phrase(n); if (countFor(q) && countFor(q) < baseCount) { add(q, "Price"); return; } } };
    const fb = fold(base), isFood = p.words.length && [...uniq("cuisine"), ...uniq("type"), "tacos", "wings", "pizza", "sushi", "burger", "bbq"].some(c => fold(c).startsWith(fb) || fb.startsWith(fold(c)));
    const cap = x => x[0].toUpperCase() + x.slice(1);
    if (p.deals.length) {
      // A drink or deal: when, how cheap, where, outside.
      if (timeFree) narrow(`${base} happy hour now`, "When");
      if (p.maxPrice == null) priceStep(n => `${base} under $${n}`);
      const h = topHoods(); if (h[0]) narrow(`${base} in ${h[0]}`, "Where");
      if (timeFree) narrow(`${base} at ${at}`, "When");
      if (!p.outdoor.length) narrow(`${base} on a patio`, "Vibe");
      if (h[1]) narrow(`${base} in ${h[1]}`, "Where");
    } else if (isFood) {
      // A kind of place or food: which drink deals it comes with, then when / where / price.
      drinks.forEach(d => narrow(`${base} with ${d === "oysters" ? "oyster" : d === "cocktails" ? "cocktail" : d} deals`, "Deal"));
      if (timeFree) narrow(`${cap(base)} happy hour now`, "When");
      const h = topHoods(); if (h[0]) narrow(`${base} in ${h[0]}`, "Where");
      if (p.maxPrice == null) priceStep(n => `${base} deals under $${n}`);
    } else if (p.hoods.length || p.nearHood || p.campus) {
      // A place: what's good there.
      const where = p.hoods[0] ? `in ${p.hoods[0]}` : p.nearHood ? `near ${p.nearHood}` : `near ${CAMPUSES[p.campus].name}`;
      if (timeFree) narrow(`Happy hour now ${where}`, "When");
      ["oysters", "beer", "cocktails", "wine"].map(d => [d, countFor(`${d} ${where}`)]).filter(([, n]) => n && n < baseCount)
        .sort((x, y) => y[1] - x[1]).slice(0, 3).forEach(([d]) => add(`${cap(d)} ${where}`, "Deal"));
      if (!p.vibes.length) narrow(`Date night ${where}`, "Vibe");
      if (p.maxPrice == null) priceStep(n => `Deals under $${n} ${where}`);
    } else if (p.vibes.length || p.outdoor.length) {
      // A vibe: drinks that go with it, where, when.
      const outside = p.outdoor.length && !p.vibes.length, place = outside ? (p.outdoor[0] === "Rooftop" ? "on a rooftop" : "on a patio") : "";
      const phr = d => outside ? `${cap(d)} ${place}` : `${base} ${d}`;
      drinks.map(d => [d, countFor(phr(d))]).filter(([, n]) => n && n < baseCount).sort((x, y) => y[1] - x[1]).slice(0, 2).forEach(([d]) => add(phr(d), "Deal"));
      const h = topHoods(); if (h[0]) narrow(outside ? `${cap(base)}s in ${h[0]}` : `${base} in ${h[0]}`, "Where");
      if (timeFree) narrow(outside ? `Happy hour now ${place}` : `${base} happy hour now`, "When");
      if (h[1]) narrow(outside ? `${cap(base)}s in ${h[1]}` : `${base} in ${h[1]}`, "Where");
    } else if (!timeFree) {
      // A time: what's pouring then, and where.
      const when = /^\d/.test(base) ? `at ${base}` : base;
      ["beer", "cocktails", "oysters", "wine"].forEach(d => narrow(`${cap(d)} ${when}`, "Deal"));
      const h = topHoods(); if (h[0]) narrow(`Happy hour ${when} in ${h[0]}`, "Where");
    } else {
      // Anything else (a keyword): narrow by drink, time, place.
      drinks.slice(0, 2).forEach(d => narrow(`${base} ${d}`, "Deal"));
      if (timeFree) narrow(`${base} happy hour now`, "When");
      const h = topHoods(); if (h[0]) narrow(`${base} in ${h[0]}`, "Where");
    }
    return out;
  }
  function openSuggest() {
    sugItems = suggestions(qIn.value); sugActive = -1;
    qList.innerHTML = sugItems.map((x, i) => `<li role="option" id="sg${i}" data-i="${i}"><svg class="i sg-ic" viewBox="0 0 24 24" aria-hidden="true">${x.kind === "Bar" ? '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>' : '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'}</svg><span class="sg-label">${esc(x.kind === "Bar" ? x.label : x.label[0].toUpperCase() + x.label.slice(1))}</span><span class="sg-sub">${esc(x.sub)}</span></li>`).join("");
    qList.hidden = !sugItems.length; qIn.setAttribute("aria-expanded", !!sugItems.length);
  }
  function closeSuggest() { qList.hidden = true; sugItems = []; sugActive = -1; qIn.setAttribute("aria-expanded", false); }
  function highlight(i) {
    sugActive = i; [...qList.children].forEach((li, j) => li.classList.toggle("on", j === i));
    qIn.setAttribute("aria-activedescendant", i >= 0 ? `sg${i}` : "");
  }
  qIn.oninput = () => { state.q = qIn.value.trim(); $("qClear").hidden = !qIn.value; render(); openSuggest(); };
  qIn.onkeydown = e => {
    if (e.key === "ArrowDown" && sugItems.length) { e.preventDefault(); highlight((sugActive + 1) % sugItems.length); }
    else if (e.key === "ArrowUp" && sugItems.length) { e.preventDefault(); highlight((sugActive - 1 + sugItems.length) % sugItems.length); }
    else if (e.key === "Enter") { e.preventDefault(); setQuery(sugActive >= 0 ? sugItems[sugActive].query : qIn.value, true); qIn.blur(); }
    else if (e.key === "Escape") closeSuggest();
  };
  qIn.onfocus = () => { if (qIn.value) openSuggest(); };
  qIn.onblur = () => setTimeout(closeSuggest, 150);
  qList.onmousedown = e => { const li = e.target.closest("li"); if (li) { e.preventDefault(); setQuery(sugItems[li.dataset.i].query, true); } };
  $("qClear").onclick = () => { setQuery(""); qIn.focus(); };
  $("qGo").onclick = () => setQuery(qIn.value, true);
  // Placeholder types out example searches one at a time, pausing while someone is typing.
  const HINTS = ["beer under $5", "patio in Midtown", "wine at 5pm", "watch the game", "date night in Inman Park", "late night", "cheap margs in Decatur", "dog friendly"];
  const STILL = matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function typeHints() {
    let hint = 0, len = 0, phase = "type";
    const tick = () => {
      if (qIn.value || document.activeElement === qIn) return setTimeout(tick, 500);
      const text = HINTS[hint];
      if (STILL) { qIn.placeholder = `Try “${text}”`; hint = (hint + 1) % HINTS.length; return setTimeout(tick, 3000); }
      if (phase === "type") len++; else len--;
      qIn.placeholder = `Try “${text.slice(0, len)}${len === text.length ? "”" : ""}`;
      if (phase === "type" && len === text.length) { phase = "erase"; return setTimeout(tick, 1800); }
      if (phase === "erase" && len === 0) { phase = "type"; hint = (hint + 1) % HINTS.length; return setTimeout(tick, 350); }
      setTimeout(tick, phase === "type" ? 70 + Math.random() * 50 : 30);
    };
    tick();
  })();
  $("qChips").onclick = e => { if (e.target.closest("[data-clearq]")) { setQuery(""); return; } if (e.target.closest("[data-edit]")) { $("finder").scrollIntoView({ behavior: "smooth" }); setTimeout(() => qIn.focus(), 400); } };
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
    $("moreFilters").textContent = open ? "Fewer Filters" : "More Filters";
  }
  $("moreFilters").onclick = () => setMore($("moreGrid").hidden);
  $("toggleFilters").onclick = () => { setMore(true); scrollToEl($("finder")); };
  $("homeShow").onclick = scrollToResults;
  $("heroCta").onclick = e => { e.preventDefault(); scrollToEl($("finder")); };

  // Contact form: Netlify Forms collects submissions (Netlify dashboard → Forms).
  // The contact form lives in a pop-up opened from the header links.
  const dlg = $("contact");
  all('[data-topic]').forEach(a => {
    a.onclick = e => { e.preventDefault(); $("topic").value = a.dataset.topic; $("formStatus").textContent = ""; dlg.showModal(); };
  });
  $("contactClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); }); // click outside the box
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

  // ── Smart search ──────────────────────────────────────────────
  // Understands phrases like "4pm happy hour in Inman Park with oysters":
  // times, days, neighborhoods, ZIP codes, deal types and campus names become
  // filters; any leftover words must appear somewhere in the listing.
  const HOOD_ALIASES = {
    "vahi": "Virginia-Highland", "va-hi": "Virginia-Highland", "virginia highland": "Virginia-Highland",
    "o4w": "Eastside Beltline", "old fourth ward": "Eastside Beltline", "beltline": "Eastside Beltline", "ponce city market": "Eastside Beltline",
    "krog": "Eastside Beltline", "poncey": "Poncey-Highland", "emory village": "Emory / Druid Hills", "druid hills": "Emory / Druid Hills",
    "emory point": "Emory / Druid Hills", "westside": "West Midtown", "l5p": "Little Five Points", "toco": "Toco Hills",
    "inman": "Inman Park", "little five": "Little Five Points", "little 5": "Little Five Points", "little 5 points": "Little Five Points", "l5": "Little Five Points",
    "decatur square": "Decatur", "the square": "Decatur", "poncey highland": "Poncey-Highland", "home park": "Home Park",
    "atlantic station": "Atlantic Station", "buckhead village": "Buckhead", "edgewood ave": "Edgewood", "reynolds town": "Reynoldstown", "tech square": "Midtown",
  };
  const DEAL_WORDS = {
    oyster: "oysters", oysters: "oysters", beer: "beer", beers: "beer", pint: "beer", pints: "beer", draft: "beer", drafts: "beer",
    wine: "wine", wines: "wine", cocktail: "cocktails", cocktails: "cocktails", margarita: "cocktails", margaritas: "cocktails",
    marg: "cocktails", margs: "cocktails", martini: "cocktails", martinis: "cocktails", drinks: "cocktails", food: "food", apps: "food", bites: "food",
  };
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const FILLER = new Set(("a an the in at on near by with for and or around happy hour hours hh deal deals special specials spot spots bars bar place places me some any good to find show get open " +
    "vibe vibes vibey great nice fun best cool solid decent i want wanna looking somewhere something where whats what's go grab drink grabbing get").split(" "));
  // Plain-English vibe & seating words -> the site's tags.
  const VIBE_WORDS = { chill: "Cozy", cozy: "Cozy", cosy: "Cozy", quiet: "Cozy", date: "Date night", romantic: "Date night", sports: "Sports", game: "Sports",
    football: "Sports", games: "Games", arcade: "Games", dog: "Dog friendly", dogs: "Dog friendly", pup: "Dog friendly", late: "Late night", latenight: "Late night",
    group: "Groups", groups: "Groups", birthday: "Groups", music: "Live music", live: "Live music", trail: "Beltline access" };
  const OUT_WORDS = { patio: "Patio", patios: "Patio", outside: "", outdoor: "", outdoors: "", rooftop: "Rooftop", rooftops: "Rooftop", roof: "Rooftop" };
  const escRe = x => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

  function parseQuery(raw) {
    let q = ` ${raw.toLowerCase().replace(/[’]/g, "'").replace(/[,!?]/g, " ")} `
      .replace(/\s(date night|first date)\s/g, " date ").replace(/\slate night\s/g, " late ").replace(/\sdog[- ]friendly\s/g, " dog ")
      .replace(/\slive music\s/g, " music ").replace(/\s(watch|catch) the (game|match)\s/g, " game ").replace(/\s(outdoor seating|sit outside)\s/g, " outside ");
    const p = { hoods: [], deals: [], vibes: [], outdoor: [], day: null, mins: null, now: false, campus: null, zip: null, cheap: false, words: [], chips: [] };
    const take = re => { const m = q.match(re); if (m) q = q.replace(re, " "); return m; };
    const hoodKeys = [...uniq("neighborhood").map(n => [n.toLowerCase(), n]), ...Object.entries(HOOD_ALIASES)].sort((a, b) => b[0].length - a[0].length);
    // "near Inman Park" sorts by distance from that area instead of limiting to it.
    for (const [k, n] of hoodKeys) if (!p.nearHood && take(new RegExp(`\\s(near|by|around|close to)\\s+(the\\s+)?${escRe(k)}(?=\\s)`))) p.nearHood = n;
    for (const [k, n] of hoodKeys) if (take(new RegExp(`\\s${escRe(k)}(?=\\s)`)) && !p.hoods.includes(n)) p.hoods.push(n);
    let m;
    if ((m = take(/\s(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?=\s)/))) p.mins = ((+m[1] % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + (+m[2] || 0);
    if (take(/\s(right\s+)?now(?=\s)/)) p.now = true;
    if ((m = take(/\s(today|tonight)(?=\s)/))) { p.day = atlNow().day; p.dayLabel = m[1] === "tonight" ? "Tonight" : "Today"; }
    if (take(/\stomorrow(?=\s)/)) p.day = (atlNow().day + 1) % 7;
    for (let d = 0; d < 7; d++) if (take(new RegExp(`\\s(${DAY_NAMES[d]}|${DAY_NAMES[d].slice(0, 3)})s?(?=\\s)`))) p.day = d;
    if ((m = take(/\s(30\d{3})(?=\s)/))) p.zip = m[1];
    if (take(/\s(georgia tech|gatech|tech|gt)(?=\s)/)) p.campus = "gt";
    if (take(/\semory(?=\s)/)) p.campus = "emory";
    if (take(/\s(cheap|budget)(?=\s)/)) p.cheap = true;
    if ((m = take(/\s(?:under|less than|below|cheaper than|max|<)\s*\$?\s*(\d+(?:\.\d+)?)(?:\s*(?:dollars?|bucks?))?(?=\s)/)) || (m = take(/\s\$(\d+(?:\.\d+)?)(?=\s)/))) p.maxPrice = +m[1];
    // Neighborhoods typed loosely: "virginia highlands", "highalnds", "inman", "little 5 points".
    const toks = q.split(/\s+/).filter(Boolean);
    const fuzzyKeys = [...hoodKeys, ...uniq("neighborhood").map(n => [fold(n), n])].map(([k, n]) => [fold(k).split(" ").filter(x => x && x !== "and"), n]).filter(([k]) => k.length).sort((a, b) => b[0].length - a[0].length);
    const near1 = w => ["near", "by", "around", "close"].includes(w);
    for (const [kt, n] of fuzzyKeys) {
      for (let i = 0; i + kt.length <= toks.length; i++) {
        const cand = toks.slice(i, i + kt.length).map(x => fold(x).replace(/s$/, "")).join(""), key = kt.map(x => x.replace(/s$/, "")).join("");
        if (key.length < 4) continue;
        if (cand === key || editDist(cand, key) <= (key.length >= 8 ? 2 : key.length >= 5 ? 1 : 0)) {
          if (i > 0 && near1(toks[i - 1])) { if (!p.nearHood) p.nearHood = n; } else if (!p.hoods.includes(n)) p.hoods.push(n);
          toks.splice(i, kt.length); break;
        }
      }
    }
    q = ` ${toks.join(" ")} `;
    for (const w of q.split(/\s+/).filter(Boolean)) {
      if (VIBE_WORDS[w]) { if (!p.vibes.includes(VIBE_WORDS[w])) p.vibes.push(VIBE_WORDS[w]); continue; }
      if (w in OUT_WORDS) { if (!p.outdoor.includes(OUT_WORDS[w])) p.outdoor.push(OUT_WORDS[w]); continue; }
      const realWord = VENUES.some(v => haystack(v).all.some(st => st.startsWith(w)));
      const near = !realWord && w.length >= 5 && Object.keys(DEAL_WORDS).find(k => k.length >= 5 && editDist(k, w) <= 1);
      const dw = DEAL_WORDS[w] || (near && DEAL_WORDS[near]);
      if (dw) { if (!p.deals.includes(dw)) p.deals.push(dw); }
      else if (!FILLER.has(w)) p.words.push(w);
    }
    if (p.now) p.chips.push("Right now");
    else if (p.mins != null || p.day != null) p.chips.push([p.day != null ? p.dayLabel || DAY_NAMES[p.day][0].toUpperCase() + DAY_NAMES[p.day].slice(1) : "Today", p.mins != null ? fmt(p.mins) : ""].filter(Boolean).join(" "));
    p.hoods.forEach(h => p.chips.push(h));
    p.deals.forEach(d => p.chips.push(DEAL_LABELS[d]));
    p.vibes.forEach(v => p.chips.push(titleCase(v)));
    p.outdoor.forEach(o => p.chips.push(o || "Outdoor seating"));
    if (p.campus) p.chips.push(`Near ${CAMPUSES[p.campus].name}`);
    if (p.nearHood) p.chips.push(`Near ${p.nearHood}`);
    if (p.zip) p.chips.push(p.zip);
    if (p.cheap) p.chips.push("$");
    if (p.maxPrice != null) p.chips.push(`$${p.maxPrice} or less`);
    p.words.forEach(w => p.chips.push(`"${w}"`));
    return p;
  }
  // Forgiving text match: ignore case, accents, apostrophes, punctuation and spaces,
  // so "poboys", "po boy", "moes and joes" and "sebastian" all find their bars.
  const fold = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ").replace(/['’`.]/g, "").replace(/[^a-z0-9$]+/g, " ").trim();
  const squash = t => fold(t).replace(/\s+/g, "").replace(/and/g, "");
  // Every run of text that starts at a word boundary, with spaces removed ("po boy shop" -> "poboyshop", "boyshop", "shop").
  const starts = t => { const w = fold(t).replace(/\band\b/g, " ").split(/\s+/).filter(Boolean); return w.map((_, i) => w.slice(i).join("")); };
  const hayCache = new Map();
  const haystack = v => {
    if (!hayCache.has(v.id)) {
      const raw = [v.name, v.address, v.zip, v.neighborhood, v.type, ...v.cuisine, ...v.vibes, ...v.outdoor, v.dealText,
        ...v.happyHours.map(w => w.note || "")].join(" ");
      hayCache.set(v.id, { all: starts(raw), name: starts(v.name) });
    }
    return hayCache.get(v.id);
  };
  const forms = w => { const sq = squash(w), f = [sq]; if (sq.length > 3 && sq.endsWith("s")) f.push(sq.slice(0, -1)); if (sq.length > 4 && sq.endsWith("es")) f.push(sq.slice(0, -2)); return f.filter(Boolean); };
  // Edit distance (with swapped letters) for typo tolerance: "oysers", "inmann", "beetel".
  function editDist(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  // A word of 5+ letters may be off by one letter (8+ letters: two) from the start of a word in the listing.
  const typoOK = (x, st) => { const lim = x.length >= 8 ? 2 : x.length >= 5 ? 1 : 0;
    return lim > 0 && [x.length - 1, x.length, x.length + 1].some(L => L > 0 && st.length >= L && editDist(x, st.slice(0, L)) <= lim); };
  const hits = (list, w) => forms(w).some(x => list.some(st => st.startsWith(x)))
    || forms(w).some(x => list.some(st => typoOK(x, st)));
  function matchesQuery(v, p) {
    if (p.hoods.length && !p.hoods.some(h => v.neighborhood === h || v.neighborhood.endsWith(" " + h))) return false; // "Decatur" also covers North Decatur
    if (!p.deals.every(d => v.deals.includes(d))) return false;
    if (!p.vibes.every(x => v.vibes.includes(x))) return false;
    if (!p.outdoor.every(o => o ? v.outdoor.includes(o) : v.outdoor.length)) return false;
    if (p.zip && v.zip !== p.zip) return false;
    if (p.cheap && v.price !== 1) return false;
    if (p.maxPrice != null && !priceOK(v, p)) return false;
    if (p.now || p.mins != null) {
      // A time with no day ("6pm") means today. A typed time needs 30+ minutes of happy hour left,
      // so "beer at 6pm" never shows a happy hour that ends at 6 or 6:15.
      const day = p.now || p.day == null ? atlNow().day : p.day;
      const mins = p.now ? atlNow().mins : p.mins;
      const hh = activeWindow(v.happyHours, day, mins);
      if (!hh || (v.hours && !activeWindow(hoursAsWindows(v), day, mins))) return false;
      if (!p.now && (hh.endsAt - mins + 1440) % 1440 < 30) return false;
    } else if (p.day != null && !v.happyHours.some(w => w.days.includes(p.day))) return false;
    if (!p.words.length) return true;
    const hay = haystack(v);
    // Typed a bar name ("poboys", "po boy", "moes and joes")? That bar counts even if a word is split differently.
    return hits(hay.name, p.words.join(" ")) || p.words.every(w => hits(hay.all, w));
  }

  // ── filtering + rendering ─────────────────────────────────────
  const anyOf = (set, arr) => !set.size || [].concat(arr).some(x => set.has(x));
  let parsed = null, scored = [];
  // Which venue field each chip group filters on.
  const FIELD = { hoods: v => v.neighborhood, prices: v => v.price, deals: v => v.deals, vibes: v => v.vibes,
    types: v => v.type, outdoor: v => v.outdoor, cuisines: v => v.cuisine };
  // Does a venue pass every active filter? `skip` ignores one chip group (used to count its options).
  function passes({ v, s, dm }, skip) {
    if (state.campus && dm > state.maxDrive) return false;
    if (parsed && !matchesQuery(v, parsed)) return false;
    if ((state.mode === "hhnow" || state.mode === "hhat") && !s.hh) return false;
    if (state.mode === "opennow" && s.open !== true) return false;
    if (state.favsOnly && !favs.has(v.id)) return false;
    return Object.entries(FIELD).every(([k, f]) => k === skip || anyOf(state[k], f(v)));
  }
  // Hide filter options that would leave zero spots (selected ones always stay visible).
  function syncAvailability() {
    for (const key of Object.keys(groups)) {
      const pool = scored.filter(e => passes(e, key));
      all(`.chip[data-k="${key}"]`).forEach(b => {
        const val = groups[key].values[b.dataset.i];
        const empty = !state[key].has(val) && !pool.some(e => [].concat(FIELD[key](e.v)).includes(val));
        // Neighborhoods stay visible (greyed out) so the map of areas doesn't jump around.
        if (key === "hoods") b.disabled = empty; else b.hidden = empty;
      });
    }
  }
  // Words that tell us a deal line is about beer / wine / cocktails / oysters / food.
  const DEAL_TERMS = {
    beer: /beer|pint|draft|lager|ipa|\bale\b|pbr|busch|miller|coors|tecate|montucky|narragansett|sapporo|peroni|sweetwater|high life|dos equis|estrella|stella|asahi|corona|heineken|bud\b|bucket|pitcher|404|bibo|can(ned)?\b/i,
    wine: /wine|glass|rosé|rose\b|prosecco|cava|bubbly|sangria|pinot|cabernet|chardonnay|mimosa/i,
    cocktails: /cocktail|margarita|marg|martini|mule|spritz|negroni|fashioned|daiquiri|paloma|mojito|well|shot|manhattan|gimlet|vesper|whisk|tequila|mai tai|punch|bloody|french 75|espresso/i,
    oysters: /oyster/i, food: /./,
  };
  const dollars = line => [...line.matchAll(/\$(\d+(?:\.\d+)?)/g)].map(m => +m[1]);
  // Has a deal at or under the price — on the kind of drink asked for, if one was named.
  const priceOK = (v, p) => v.dealText.split(/\s+·\s+/).some(line =>
    (!p.deals.length || p.deals.some(d => DEAL_TERMS[d].test(line))) && dollars(line).some(n => n <= p.maxPrice));
  let searchNote = "";
  const hoodCenter = n => { const vs = VENUES.filter(v => v.neighborhood === n); return { lat: vs.reduce((a, v) => a + v.lat, 0) / vs.length, lng: vs.reduce((a, v) => a + v.lng, 0) / vs.length }; };
  function filtered() {
    parsed = state.q ? parseQuery(state.q) : null;
    // A time typed in the search box ("4pm", "tuesday") drives the card statuses too.
    const t = parsed && !parsed.now && (parsed.day != null || parsed.mins != null)
      ? { day: parsed.day ?? atlNow().day, mins: parsed.mins ?? 17 * 60, live: false } : refTime();
    scored = VENUES.map(v => ({ v, s: statusFor(v, t), mi: milesTo(v), dm: driveMin(v) }));
    searchNote = "";
    let out = scored.filter(e => passes(e, null));
    // Never a dead end: loosen the search step by step and say what we loosened.
    if (!out.length && parsed) {
      const unknown = parsed.words.filter(w => !VENUES.some(v => hits(haystack(v).all, w)));
      if (unknown.length) {
        parsed = { ...parsed, words: parsed.words.filter(w => !unknown.includes(w)), nameHits: undefined };
        out = scored.filter(e => passes(e, null));
        if (out.length) searchNote = `No spots mention ${unknown.map(w => `"${w}"`).join(" or ")}, so we skipped ${unknown.length > 1 ? "those words" : "that word"}.`;
      }
      // Nothing in that neighborhood? Show the closest matches around it instead.
      if (!out.length && parsed.hoods.length) {
        const h = parsed.hoods[0];
        const tryNear = { ...parsed, hoods: [], nearHood: parsed.nearHood || h, nameHits: undefined };
        const prev = parsed; parsed = tryNear;
        out = scored.filter(e => passes(e, null));
        if (out.length) searchNote = `Nothing like that in ${h}, so here are the closest spots.`; else parsed = prev;
      }
      const steps = out.length ? [] : [["words", "your keywords"], ["vibes", "the vibe"], ["outdoor", "outdoor seating"], ["day", "the time"], ["deals", "the deal type"]];
      for (const [k, label] of steps) {
        parsed = { ...parsed, [k]: Array.isArray(parsed[k]) ? [] : null, ...(k === "day" ? { mins: null, now: false } : {}), nameHits: undefined };
        out = scored.filter(e => passes(e, null));
        if (out.length) { searchNote = `Nothing matched everything, so this ignores ${label}.`; break; }
      }
    }
    // "near Emory" / "near Inman Park": sort by distance from there (closest first), never a cutoff.
    const anchor = parsed?.campus ? CAMPUSES[parsed.campus] : parsed?.nearHood ? hoodCenter(parsed.nearHood) : null;
    out.forEach(e => { e.near = anchor ? driveFrom(anchor, e.v) : null; e.far = e.near != null && e.near > 12; });
    // "Near" means near: drop anything past a 20 min drive. If that leaves nothing, keep the 5 closest and say so.
    if (anchor) {
      const close = out.filter(e => e.near <= 20);
      if (close.length) out = close;
      else { out = out.sort((a, b) => a.near - b.near).slice(0, 5); searchNote ||= "Nothing within a 20 min drive, so here are the closest."; }
    }
    const nameFirst = e => (parsed && parsed.words.length && hits(haystack(e.v).name, parsed.words.join(" ")) ? 0 : 1);
    return out.sort((a, b) => {
      if (nameFirst(a) !== nameFirst(b)) return nameFirst(a) - nameFirst(b);
      if (anchor && state.sort === "smart") return a.near - b.near || a.s.rank - b.s.rank;
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
  const ICON_CHECK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  // Phones/tablets open Partiful in the same tab: iOS only hands partiful.com/create to the
  // Partiful app reliably from a same-tab tap (a new tab often needed a second tap).
  const TOUCH = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const TAG_GROUPS = [
    { key: "cuisines", field: "cuisine", cls: "food", icon: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3"/></svg>' },
    { key: "vibes", field: "vibes", cls: "vibe", icon: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>' },
    { key: "outdoor", field: "outdoor", cls: "out", icon: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' },
  ];
  // Opens Partiful's "create event" page with the title, location and deal filled in.
  // (These URL parameters aren't documented by Partiful; they worked as of Oct 2026.)
  function partifulUrl(v) {
    const street = v.address.replace(/\s*\(.*?\)/g, "").replace(/,\s*Decatur$/, "");
    const city = /,\s*Decatur\b/.test(v.address) ? "Decatur" : "Atlanta";
    const when = v.hhDisplay.map(w => w.rain ? w.note : `${daysLabel(w.days)} ${w.allDay ? "all day" : `${fmt(toMin(w.start))}–${w.end === "close" ? "close" : fmt(toMin(w.end))}`}${w.note ? ` (${w.note})` : ""}`).join("\n");
    return "https://partiful.com/create?" + new URLSearchParams({
      title: `Happy hour at ${v.name}`,
      location: `${v.name}, ${street}, ${city}, GA ${v.zip || ""}`.trim(),
      description: `${v.dealText}\n\nHappy hour:\n${when}\n\nFound on Peach Hour: https://peachhouratl.com`,
    });
  }
  const rangeLabel = r => `${fmt(toMin(r[0]))}–${fmt(toMin(r[1]))}`;

  function card({ v, s, mi, dm }) {
    const fav = favs.has(v.id), today = s.t.day;
    const price = `<span class="price" aria-label="Price ${v.price} of 3">${"$".repeat(v.price)}<span>${"$".repeat(3 - v.price)}</span></span>`;
    const dist = [mi != null ? `${mi.toFixed(1)} mi away` : "", dm != null ? `~${dm} min drive from ${CAMPUSES[state.campus].name}` : ""].filter(Boolean).join(" · ");
    const belt = v.beltline ? `<p class="belt">${v.beltline.min} min walk to the BeltLine <span>(${esc(v.beltline.trail)})</span></p>` : "";
    const title = v.website ? `<a href="${v.website}" target="_blank" rel="noopener">${esc(v.name)}</a>` : esc(v.name);

    // Happy hour rows, starting from today's day of the week.
    const offset = w => Math.min(...w.days.map(d => (d - today + 7) % 7));
    const SHOW_DEALS = 3, SHOW_TIMES = 2; // the rest sit in the "More" dropdown so every card is the same size
    const sched = [...v.hhDisplay].sort((a, b) => offset(a) - offset(b)).map((w, i) => {
      const isToday = w.days.includes(today);
      const when = w.rain ? "Any time it rains" : w.allDay ? "All day" : `${fmt(toMin(w.start))}–${w.end === "close" ? "close" : fmt(toMin(w.end))}`;
      return `<div class="${isToday ? "today" : ""}${i >= SHOW_TIMES ? " extra" : ""}"><dt>${w.rain ? "Rainy days" : isToday ? "Today" : daysLabel(w.days)}</dt><dd>${when}</dd>${w.note && !w.rain ? `<span class="note">${esc(w.note)}</span>` : ""}</div>`;
    }).join("");

    // Today's regular hours in one line: "Open until 11PM" / "Closed · opens 5PM".
    let hoursLine = "";
    if (v.hours) {
      let text = s.open ? `Open <span>until ${fmt(s.closesAt)}</span>` : "Closed";
      if (!s.open) {
        const nx = nextStart(hoursAsWindows(v), today, s.t.mins);
        if (nx) text += ` <span>· opens ${nx.offset === 0 ? "" : (nx.offset === 1 ? "tomorrow " : DAYS[nx.day] + " ")}${fmt(toMin(nx.w.start))}</span>`;
      }
      hoursLine = `<p class="open-line ${s.open ? "is-open" : ""}">${text}</p>`;
    }

    // Deal text is written as "a · b · c"; show it as a short list instead of a paragraph.
    const dealItems = v.dealText.split(/\s+·\s+/);
    const deals = dealItems.map((d, i) => `<li${i >= SHOW_DEALS ? ' class="extra"' : ""}>${esc(d.charAt(0).toUpperCase() + d.slice(1))}</li>`).join("");
    const hidden = Math.max(0, dealItems.length - SHOW_DEALS) + Math.max(0, v.hhDisplay.length - SHOW_TIMES);

    // Tags in two rows: food on top, then the place (outdoor seating first, so it survives trimming, then vibes).
    const tagBtns = gs => gs.flatMap(g => (v[g.field] || []).map(x =>
      `<button class="tag tag-${g.cls}" data-tag="${g.key}" data-val="${esc(x)}" title="Show only ${esc(x)}">${g.icon}${esc(titleCase(x))}</button>`)).join("");
    const tags = [[TAG_GROUPS[0]], [TAG_GROUPS[2], TAG_GROUPS[1]]].map(tagBtns).filter(Boolean)
      .map(row => `<div class="tag-row">${row}</div>`).join("");
    const confirm = v.hhStatus === "reported" ? `<span class="confirm" title="Info came from older or third-party sources">Call to confirm</span>` : "";
    return `<article class="card book${hidden ? " has-more" : ""}">
      <div class="page page-photos">
        ${photoPair(v)}
        <div class="nameplate">
          <p class="kicker">${esc(v.neighborhood)} <span>·</span> ${esc(v.type)} <span>·</span> ${price}</p>
          <h4>${title}</h4>
        </div>
      </div>
      <div class="page page-info">
        <div class="info-top">
          <div class="status-row"><span class="status ${s.cls}"><span class="st-text">${s.label}</span></span>${confirm}</div>
          <button class="heart" data-fav="${v.id}" aria-pressed="${fav}" aria-label="Save ${esc(v.name)}">${ICON.heart}</button>
        </div>
        <div class="info-grid">
          <section class="sec sec-deals">
            <h5 class="sec-label">The Deals</h5>
            <ul class="deal-list">${deals}</ul>
              ${hidden ? `<button class="book-more" data-more data-base="${hidden}" data-label="${hidden} more deal${hidden === 1 ? "" : "s"} & times" aria-expanded="false"><span>${hidden} more deal${hidden === 1 ? "" : "s"} & times</span><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>` : ""}
          </section>
          <div class="sec-side">
            ${sched || hoursLine ? `<section class="sec sec-when">
              <h5 class="sec-label">When</h5>
              ${sched ? `<dl class="sched">${sched}</dl>` : ""}
              ${hoursLine}
            </section>` : ""}
            <section class="sec sec-where">
              <h5 class="sec-label">Where</h5>
              <p class="addr">${esc(v.address)}${v.zip && !v.address.includes(v.zip) ? ` ${v.zip}` : ""}</p>
              ${dist ? `<p class="dist">${dist}</p>` : ""}${belt}
            </section>
          </div>
        </div>
        <footer class="card-foot">
          ${tags ? `<div class="tags">${tags}</div>` : ""}
          <div class="acts">
            <a class="act" href="${mapsUrl(v)}" target="_blank" rel="noopener">${ICON.pin}<span>Directions</span></a>
            <button class="act act-share" data-share="${v.id}" aria-label="Share ${esc(v.name)}" title="Share">${ICON.share}<span class="share-lbl">Share</span></button>
            <a class="act act-party" href="${partifulUrl(v)}"${TOUCH ? "" : ' target="_blank" rel="noopener"'} title="Plan a hangout here on Partiful"><img class="pf-logo" src="assets/partiful.png" alt="" width="20" height="20"><span>Create Partiful</span></a>
          </div>
        </footer>
      </div>
    </article>`;
  }

  // Two photos from the bar's own site, one above the other (the name plate sits across the seam).
  // One photo is split across both frames; none gets the sunset placeholder.
  function photoPair(v) {
    const photos = (window.PHOTOS || {})[v.id] || [];
    if (!photos.length) return `<div class="ph ph-empty"><div class="ph-sun"></div></div><div class="ph ph-empty ph-low"><p class="ph-hood">${esc(v.neighborhood)}</p></div>`;
    let host = "";
    try { host = new URL(v.website).hostname.replace(/^www\./, ""); } catch {}
    const [a, b] = photos.length > 1 ? photos : [photos[0], photos[0]];
    const split = photos.length === 1 ? " ph-split" : "";
    // Optional framing per photo (window.PHOTO_FOCUS, e.g. "50% 10%") keeps faces clear of the name plate.
    const focus = src => { const f = (window.PHOTO_FOCUS || {})[src]; return f && !split ? ` style="object-position:${f}"` : ""; };
    return `<div class="ph${split}"><img src="${a}"${focus(a)} alt="${esc(v.name)}, photo from its website" loading="lazy" decoding="async"></div>`
      + `<div class="ph ph-low${split}"><img src="${b}"${focus(b)} alt="" loading="lazy" decoding="async">${host ? `<span class="ph-credit">Photos: ${esc(host)}</span>` : ""}</div>`;
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
    $("qChips").hidden = !(parsed && parsed.chips.length);
    const sortNote = parsed && (parsed.campus || parsed.nearHood) && state.sort === "smart" ? " · closest first" : "";
    $("qChips").innerHTML = parsed && parsed.chips.length
      ? `<span>Searching for</span>${parsed.chips.map(c => `<b>${esc(c)}</b>`).join("")}<span class="q-count">${items.length} spot${items.length === 1 ? "" : "s"}${sortNote}</span><button class="link" data-edit type="button">Edit</button><button class="link" data-clearq type="button">Clear</button>${searchNote ? `<span class="q-note">${searchNote}</span>` : ""}` : "";
    renderItems(items);
  }
  function renderItems(items) {
    syncAvailability();
    const t = refTime();
    const when = state.mode === "hhat" ? ` on ${DAYS[t.day]} at ${fmt(t.mins)}` : "";
    $("count").textContent = `${items.length} spot${items.length === 1 ? "" : "s"}${when}`;
    const showLabel = `Show ${items.length} Spot${items.length === 1 ? "" : "s"}`;
    $("homeShow").textContent = showLabel;
    $("savedCount").textContent = favs.size;
    const active = Object.keys(groups).reduce((n, k) => n + state[k].size, (state.mode === "any" ? 0 : 1) + (state.campus ? 1 : 0));
    $("toggleFilters").innerHTML = active ? `Filters <span class="n">${active}</span>` : "Filters";
    if (state.view === "list") {
      const firstFar = items.findIndex(e => e.far), anyNear = firstFar > 0;
      $("list").innerHTML = items.length ? items.map((e, i) => (anyNear && i === firstFar ? `<p class="far-divider">A bit farther: 13–20 min drive</p>` : "") + card(e)).join("")
        : `<p class="empty">Nothing matches those filters. Try loosening a few.</p>`;
      fitTags();
    } else renderMap(items);
  }

  // Tags: one line when everything fits; otherwise two lines (food, then the place),
  // each kept to a single line by hiding the tags that would wrap. Never more than two lines.
  // Collapsed cards: if long deal lines make the Deals column taller than When/Where,
  // tuck the last visible deals into the dropdown too, so every card stays the same size.
  // Height of a column's content (grid columns stretch to the taller one, so offsetHeight won't do).
  const contentH = el => Math.max(0, ...[...el.children].filter(c => c.offsetParent).map(c => c.getBoundingClientRect().bottom)) - el.getBoundingClientRect().top;
  function fitDeals() {
    for (const card of document.querySelectorAll("#list .card.book:not(.open)")) {
      const deals = card.querySelector(".sec-deals"), side = card.querySelector(".sec-side");
      if (!deals || !side) continue;
      const items = [...deals.querySelectorAll(".deal-list li")];
      const rows = [...side.querySelectorAll(".sched > div")];
      [...items, ...rows].forEach(el => el.classList.remove("fit-extra"));
      const stacked = side.getBoundingClientRect().top >= deals.getBoundingClientRect().bottom - 1; // phones
      // Desktop: if When/Where makes the card taller than the standard height, tuck later times into the dropdown.
      const info0 = card.querySelector(".page-info"), grid = card.querySelector(".info-grid");
      const target = parseFloat(getComputedStyle(info0).minHeight) || 0;
      // Room the Deals / When columns get inside the standard card height (measured without the min-height).
      info0.style.minHeight = "0px";
      const budget = target - (info0.scrollHeight - grid.offsetHeight);
      info0.style.minHeight = "";
      const belt = side.querySelector(".belt");
      belt?.classList.remove("fit-hide");
      if (!stacked && target) {
        let shown = rows.filter(r => !r.classList.contains("extra"));
        while (contentH(side) > budget + 1 && shown.length > 1) shown.pop().classList.add("fit-extra");
        // Last resort: the BeltLine walk line (the Beltline tag still shows it).
        if (belt && contentH(side) > budget + 1) belt.classList.add("fit-hide");
      }
      const limit = stacked ? 150 : Math.max(contentH(side), target ? budget : 155);
      let visible = items.filter(li => !li.classList.contains("extra"));
      const info = card.querySelector(".page-info"), PHONE_H = 455;
      const tooTall = () => stacked ? info.scrollHeight > PHONE_H + 1 : contentH(deals) > limit + 1;
      while (tooTall() && visible.length > 2) {
        visible.pop().classList.add("fit-extra");
      }
      // Phones: then later times, then the BeltLine line, so every card stays the same height.
      if (stacked) {
        const shown = rows.filter(r => !r.classList.contains("extra"));
        while (tooTall() && shown.length > 1) shown.pop().classList.add("fit-extra");
        if (belt && tooTall()) belt.classList.add("fit-hide");
      }
      const tucked = card.querySelectorAll(".fit-extra").length;
      if (tucked) {
        const btn = deals.querySelector(".book-more");
        const n = tucked + Number(btn?.dataset.base || 0);
        const label = `${n} more deal${n === 1 ? "" : "s"} & times`;
        if (btn) { btn.dataset.label = label; btn.querySelector("span").textContent = label; }
        else deals.insertAdjacentHTML("beforeend", `<button class="book-more" data-more data-base="0" data-label="${label}" aria-expanded="false"><span>${label}</span><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`);
        card.classList.add("has-more");
      }
    }
  }
  function fitTags() {
    fitDeals();
    const wraps = els => els.some(t => t.offsetTop > els[0].offsetTop);
    for (const box of document.querySelectorAll("#list .tags")) {
      const all = [...box.querySelectorAll(".tag")];
      all.forEach(t => { t.hidden = false; });
      box.classList.add("one-line");
      if (!all.length || !wraps(all)) continue;
      if (!box.closest(".card").classList.contains("open")) {
        all.forEach(t => { if (t.offsetTop > all[0].offsetTop) t.hidden = true; });
        continue;
      }
      box.classList.remove("one-line");
      for (const row of box.querySelectorAll(".tag-row")) {
        const tags = [...row.children], top = tags[0].offsetTop;
        tags.forEach(t => { if (t.offsetTop > top) t.hidden = true; });
      }
    }
  }
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitTags, 120); });
  document.fonts?.ready.then(fitTags);

  $("list").onclick = async e => {
    const f = e.target.closest("[data-fav]"), sh = e.target.closest("[data-share]"), tg = e.target.closest("[data-tag]"), mo = e.target.closest("[data-more]");
    if (mo) {
      const open = mo.closest(".card").classList.toggle("open");
      mo.setAttribute("aria-expanded", open);
      mo.querySelector("span").textContent = open ? "Show less" : mo.dataset.label;
      fitTags();
      return;
    }
    if (tg) { state[tg.dataset.tag].add(tg.dataset.val); update(); return; }
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
        else { await navigator.clipboard.writeText(url); sh.innerHTML = `${ICON_CHECK}<span class="share-lbl">Copied</span>`; sh.title = "Link copied";
        setTimeout(() => { sh.innerHTML = `${ICON.share}<span class="share-lbl">Share</span>`; sh.title = "Share"; }, 1500); }
      } catch {}
    }
  };

  function tick() {
    const n = atlNow();
    $("clock").textContent = `${DAYS[n.day]} · ${fmt(n.mins)} in Atlanta`;
  }

  const qp = new URLSearchParams(location.search).get("q");
  if (qp) { $("q").value = qp; state.q = qp.toLowerCase(); $("qClear").hidden = false; }
  tick(); update();
  setInterval(() => { tick(); if (state.mode !== "hhat") render(); }, 60_000);
})();
