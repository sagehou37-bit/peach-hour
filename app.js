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
  const openCards = new Set(); // cards whose extra deals/times/tags are expanded

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
  const driveMin = v => (state.campus ? Math.round(haversine(CAMPUSES[state.campus], v) * 1.35 / 20 * 60 + 2) : null);

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
  $("q").oninput = e => { state.q = e.target.value.trim(); render(); };
  all(".try").forEach(b => { b.onclick = () => { $("q").value = b.textContent; state.q = b.textContent; render(); }; });
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
  };
  const DEAL_WORDS = {
    oyster: "oysters", oysters: "oysters", beer: "beer", beers: "beer", pint: "beer", pints: "beer", draft: "beer", drafts: "beer",
    wine: "wine", wines: "wine", cocktail: "cocktails", cocktails: "cocktails", margarita: "cocktails", margaritas: "cocktails",
    marg: "cocktails", margs: "cocktails", martini: "cocktails", martinis: "cocktails", drinks: "cocktails", food: "food", apps: "food", bites: "food",
  };
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const FILLER = new Set("a an the in at on near by with for and or around happy hour hours hh deal deals special specials spot spots bars bar place places me some any good to find show get open".split(" "));
  const escRe = x => x.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

  function parseQuery(raw) {
    let q = ` ${raw.toLowerCase().replace(/[’]/g, "'").replace(/[,!?]/g, " ")} `;
    const p = { hoods: [], deals: [], day: null, mins: null, now: false, campus: null, zip: null, cheap: false, words: [], chips: [] };
    const take = re => { const m = q.match(re); if (m) q = q.replace(re, " "); return m; };
    const hoodKeys = [...uniq("neighborhood").map(n => [n.toLowerCase(), n]), ...Object.entries(HOOD_ALIASES)].sort((a, b) => b[0].length - a[0].length);
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
    for (const w of q.split(/\s+/).filter(Boolean)) {
      if (DEAL_WORDS[w]) { if (!p.deals.includes(DEAL_WORDS[w])) p.deals.push(DEAL_WORDS[w]); }
      else if (!FILLER.has(w)) p.words.push(w);
    }
    if (p.now) p.chips.push("Right now");
    else if (p.mins != null || p.day != null) p.chips.push([p.day != null ? p.dayLabel || DAY_NAMES[p.day][0].toUpperCase() + DAY_NAMES[p.day].slice(1) : "", p.mins != null ? fmt(p.mins) : ""].filter(Boolean).join(" "));
    p.hoods.forEach(h => p.chips.push(h));
    p.deals.forEach(d => p.chips.push(DEAL_LABELS[d]));
    if (p.campus) p.chips.push(`Near ${CAMPUSES[p.campus].name}`);
    if (p.zip) p.chips.push(p.zip);
    if (p.cheap) p.chips.push("$");
    p.words.forEach(w => p.chips.push(`"${w}"`));
    return p;
  }
  const haystack = v => [v.name, v.address, v.zip, v.neighborhood, v.type, ...v.cuisine, ...v.vibes, ...v.outdoor, v.dealText,
    ...v.happyHours.map(w => w.note || "")].join(" ").toLowerCase();
  function matchesQuery(v, p) {
    if (p.hoods.length && !p.hoods.includes(v.neighborhood)) return false;
    if (!p.deals.every(d => v.deals.includes(d))) return false;
    if (p.zip && v.zip !== p.zip) return false;
    if (p.cheap && v.price !== 1) return false;
    if (p.campus && haversine(CAMPUSES[p.campus], v) * 1.35 / 20 * 60 + 2 > 12) return false;
    if (p.now || p.mins != null) {
      // A time with no day ("4pm") matches that time on any day of the week.
      const days = p.now ? [atlNow().day] : p.day != null ? [p.day] : [0, 1, 2, 3, 4, 5, 6];
      const mins = p.now ? atlNow().mins : p.mins;
      const hit = days.some(d => (!v.hours || activeWindow(hoursAsWindows(v), d, mins)) && activeWindow(v.happyHours, d, mins));
      if (!hit) return false;
    } else if (p.day != null && !v.happyHours.some(w => w.days.includes(p.day))) return false;
    const hay = haystack(v);
    return p.words.every(w => hay.includes(w));
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
  function filtered() {
    parsed = state.q ? parseQuery(state.q) : null;
    // A time typed in the search box ("4pm", "tuesday") drives the card statuses too.
    const t = parsed && !parsed.now && parsed.day != null
      ? { day: parsed.day, mins: parsed.mins ?? 17 * 60, live: false } : refTime();
    scored = VENUES.map(v => ({ v, s: statusFor(v, t), mi: milesTo(v), dm: driveMin(v) }));
    return scored.filter(e => passes(e, null)).sort((a, b) => {
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
    const SHOW_DEALS = 3, SHOW_TIMES = 2; // the rest wait behind "+ More"
    const price = `<span class="price" aria-label="Price ${v.price} of 3">${"$".repeat(v.price)}<span>${"$".repeat(3 - v.price)}</span></span>`;
    const dist = [mi != null ? `${mi.toFixed(1)} mi away` : "", dm != null ? `~${dm} min drive from ${CAMPUSES[state.campus].name}` : ""].filter(Boolean).join(" · ");
    const belt = v.beltline ? `<p class="belt">${v.beltline.min} min walk to the BeltLine <span>(${esc(v.beltline.trail)})</span></p>` : "";
    const title = v.website ? `<a href="${v.website}" target="_blank" rel="noopener">${esc(v.name)}</a>` : esc(v.name);

    // Happy hour rows, starting from today's day of the week.
    const offset = w => Math.min(...w.days.map(d => (d - today + 7) % 7));
    const sched = [...v.hhDisplay].sort((a, b) => offset(a) - offset(b)).map((w, i) => {
      const isToday = w.days.includes(today);
      const when = w.rain ? "Any time it rains" : w.allDay ? "All day" : `${fmt(toMin(w.start))}–${w.end === "close" ? "close" : fmt(toMin(w.end))}`;
      return `<div class="${isToday ? "today" : ""}${i >= SHOW_TIMES ? " more-item" : ""}"><dt>${w.rain ? "Rainy days" : isToday ? "Today" : daysLabel(w.days)}</dt><dd>${when}</dd>${w.note && !w.rain ? `<span class="note">${esc(w.note)}</span>` : ""}</div>`;
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
    const deals = dealItems.map((d, i) => `<li${i >= SHOW_DEALS ? ' class="more-item"' : ""}>${esc(d)}</li>`).join("");
    const confirm = v.hhStatus === "reported" ? `<span class="confirm" title="Info came from older or third-party sources">Call to confirm</span>` : "";
    const tags = TAG_GROUPS.flatMap(g => (v[g.field] || []).map(x =>
      `<button class="tag tag-${g.cls}" data-tag="${g.key}" data-val="${esc(x)}" title="Show only ${esc(x)}">${g.icon}${esc(titleCase(x))}</button>`)).slice(0, 4).join("");
    const hidden = Math.max(0, dealItems.length - SHOW_DEALS) + Math.max(0, v.hhDisplay.length - SHOW_TIMES) + (tags ? 1 : 0);
    const open = openCards.has(v.id);
    return `<article class="card book${open ? " open" : ""}">
      <div class="page page-photos">
        ${photoPair(v)}
        <div class="nameplate">
          <p class="kicker">${esc(v.neighborhood)} <span>·</span> ${esc(v.type)} <span>·</span> ${price}</p>
          <h4>${title}</h4>
        </div>
      </div>
      <div class="page page-info">
        <div class="info-top">
          <div class="status-row"><span class="status ${s.cls}">${s.label}</span>${confirm}</div>
          <button class="heart" data-fav="${v.id}" aria-pressed="${fav}" aria-label="Save ${esc(v.name)}">${ICON.heart}</button>
        </div>
        <div class="info-grid">
          <section class="sec sec-deals">
            <h5 class="sec-label">The Deals</h5>
            <ul class="deal-list">${deals}</ul>
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
          ${tags ? `<div class="tags more-item">${tags}</div>` : ""}
          ${hidden ? `<button class="book-more" data-more="${v.id}" aria-expanded="${open}">${open ? "Less" : "+ More"}</button>` : ""}
          <div class="acts">
            <a class="act" href="${mapsUrl(v)}" target="_blank" rel="noopener">${ICON.pin}<span>Directions</span></a>
            <button class="act act-share" data-share="${v.id}" aria-label="Share ${esc(v.name)}" title="Share">${ICON.share}<span class="share-lbl">Share</span></button>
            <a class="act act-party" href="${partifulUrl(v)}" target="_blank" rel="noopener" title="Plan a hangout here on Partiful"><img class="pf-logo" src="assets/partiful.png" alt="" width="20" height="20"><span>Create Partiful</span></a>
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
    return `<div class="ph${split}"><img src="${a}" alt="${esc(v.name)}, photo from its website" loading="lazy" decoding="async"></div>`
      + `<div class="ph ph-low${split}"><img src="${b}" alt="" loading="lazy" decoding="async">${host ? `<span class="ph-credit">Photos: ${esc(host)}</span>` : ""}</div>`;
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
    $("qChips").innerHTML = parsed && parsed.chips.length
      ? `<span>Searching for</span>${parsed.chips.map(c => `<b>${esc(c)}</b>`).join("")}` : "";
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
      $("list").innerHTML = items.length ? items.map(card).join("")
        : `<p class="empty">Nothing matches those filters. Try loosening a few.</p>`;
    } else renderMap(items);
  }

  $("list").onclick = async e => {
    const f = e.target.closest("[data-fav]"), sh = e.target.closest("[data-share]"), tg = e.target.closest("[data-tag]"), mo = e.target.closest("[data-more]");
    if (mo) {
      const id = mo.dataset.more, open = !openCards.has(id);
      open ? openCards.add(id) : openCards.delete(id);
      mo.closest(".card").classList.toggle("open", open);
      mo.textContent = open ? "Less" : "+ More"; mo.setAttribute("aria-expanded", open);
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
  if (qp) { $("q").value = qp; state.q = qp.toLowerCase(); }
  tick(); update();
  setInterval(() => { tick(); if (state.mode !== "hhat") render(); }, 60_000);
})();
