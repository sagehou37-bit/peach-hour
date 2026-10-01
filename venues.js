/*
  Venue data for Peach Hour — researched from the web on 2026-10-01.

  hhStatus:
    "confirmed" – from the venue's own site, or an official/editorial guide from 2026
                  (Virginia-Highland District, Aug 2026; The Infatuation, Aug 24 2026;
                  Atlanta BeltLine blog, Apr 7 2026)
    "reported"  – from third-party listings that may be stale; double-check
    "unknown"   – venue mentions happy hour (or might have one) but no times found

  Price level ($–$$$), vibes, and map coordinates are editorial estimates.
  hours: index 0=Sun … 6=Sat, each [open, close] or null if closed; whole field null if unknown.
  Happy-hour windows: { days, start, end, note? }. "24:00" start = midnight that night.
  allDay: true = a day-long special (still only counts while the venue is open).
*/
(function () {
  const WEEKDAYS = [1, 2, 3, 4, 5];
  const CHECKED = "2026-10-01";
  const S = {
    vhd: { label: "Virginia-Highland District guide (Aug 2026)", url: "https://www.virginiahighlanddistrict.com/guides/happy-hours" },
    inf: { label: "The Infatuation (Aug 2026)", url: "https://www.theinfatuation.com/atlanta/guides/the-best-happy-hours-in-atlanta" },
    bl: { label: "Atlanta BeltLine blog (Apr 2026)", url: "https://beltline.org/blog/where-to-end-your-workday-on-the-beltline/" },
  };
  const days = spec => [0, 1, 2, 3, 4, 5, 6].map(d => (spec[d] === undefined ? null : spec[d]));

  window.VENUES = [
    // ── Virginia-Highland ─────────────────────────────────────────
    { id: "whiskey-bird", name: "Whiskey Bird", neighborhood: "Virginia-Highland",
      address: "1409 N Highland Ave NE", lat: 33.7880, lng: -84.3531, price: 2, type: "Restaurant",
      cuisine: ["Asian"], vibes: ["Date night"], hours: null,
      happyHours: [{ days: [3, 4], start: "16:00", end: "18:30" }, { days: [5, 6, 0], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "$10 cocktails + shareable bites",
      hhStatus: "confirmed", sources: [S.vhd, S.inf] },

    { id: "family-dog", name: "The Family Dog", neighborhood: "Virginia-Highland",
      address: "1402 N Highland Ave NE", lat: 33.7877, lng: -84.3535, price: 1, type: "Bar",
      cuisine: ["Bar food"], vibes: ["Sports", "Patio"],
      hours: days({ 0: ["11:00", "21:30"], 2: ["16:00", "22:30"], 3: ["16:00", "22:30"], 4: ["16:00", "22:30"], 5: ["12:00", "00:30"], 6: ["11:00", "00:30"] }),
      happyHours: [{ days: [2, 3, 4, 5], start: "16:00", end: "19:00" }],
      deals: ["beer", "cocktails"], dealText: "$4 Montucky & Tecate · $6 margaritas & mules",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "ela", name: "Ela", neighborhood: "Virginia-Highland",
      address: "1186 N Highland Ave NE", lat: 33.7848, lng: -84.3530, price: 2, type: "Restaurant",
      cuisine: ["Mediterranean"], vibes: ["Date night", "Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }, { days: [6, 0], start: "15:00", end: "17:00" }],
      deals: ["wine", "cocktails", "beer", "food"],
      dealText: "$6 wine by the glass, $6 hummus, $8 cauliflower falafel · Wed: $4 shareables + half-off bottles",
      hhStatus: "confirmed", sources: [S.vhd, S.inf] },

    { id: "bar-bacoa", name: "Bar.bacoa", neighborhood: "Virginia-Highland",
      address: "1000 Virginia Ave NE", lat: 33.7814, lng: -84.3523, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos", "Spanish / Tapas"], vibes: ["Patio", "Groups"],
      hours: days({ 0: ["12:00", "21:00"], 1: ["16:00", "22:00"], 2: ["16:00", "22:00"], 3: ["16:00", "22:00"], 4: ["16:00", "22:00"], 5: ["16:00", "22:00"], 6: ["12:00", "22:00"] }),
      happyHours: [
        { days: [1], start: "16:00", end: "22:00", note: "$6 house margaritas" },
        { days: [2], start: "16:00", end: "22:00", note: "Half-price tacos" },
        { days: [3], start: "16:00", end: "22:00", note: "$30 select wine bottles" },
      ],
      deals: ["cocktails", "food", "wine"], dealText: "Mon margs · Tue tacos · Wed wine bottles",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "murphys", name: "Murphy's", neighborhood: "Virginia-Highland",
      address: "997 Virginia Ave NE", lat: 33.7814, lng: -84.3528, price: 2, type: "Restaurant",
      cuisine: ["American", "Brunch"], vibes: ["Date night"], hours: null,
      happyHours: [{ days: [4], start: "16:00", end: "20:00", note: "Wine Shop happy hour" }],
      deals: ["wine", "food"], dealText: "Wine Shop: four-wine tasting + seasonal charcuterie for $20; extra pours $8",
      hhStatus: "confirmed", sources: [S.vhd, { label: "murphysatlanta.com", url: "https://www.murphysatlanta.com/events/wine-shop-happy-hour" }] },

    { id: "moes-joes", name: "Moe's & Joe's", neighborhood: "Virginia-Highland",
      address: "1033 N Highland Ave NE", lat: 33.7821, lng: -84.3531, price: 1, type: "Dive bar",
      cuisine: ["Bar food"], vibes: ["Sports", "Late night", "Patio"], hours: null,
      happyHours: [
        { days: [0], allDay: true, note: "$5 PBR pitchers" },
        { days: [2], allDay: true, note: "$3.50 PBR pitchers" },
        { days: [3], allDay: true, note: "$2 PBR tallboys + trivia" },
        { days: [4], allDay: true, note: "$5 rotating pitcher" },
      ],
      deals: ["beer"], dealText: "Daily PBR specials, not a fixed happy-hour window",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "fontaines", name: "Fontaine's Oyster House", neighborhood: "Virginia-Highland",
      address: "1026½ N Highland Ave NE", lat: 33.7818, lng: -84.3533, price: 2, type: "Bar",
      cuisine: ["Seafood"], vibes: ["Late night"],
      hours: days({ 0: ["11:30", "22:00"], 1: ["11:30", "22:00"], 2: ["16:00", "22:00"], 3: ["11:30", "22:00"], 4: ["11:30", "22:00"], 5: ["11:30", "00:00"], 6: ["11:30", "00:00"] }),
      happyHours: [{ days: [2], allDay: true, note: "$15 house raw dozen oysters" }],
      deals: ["food"], dealText: "Tuesday: $15 dozen raw oysters on the half shell",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "truva", name: "Truva Turkish Kitchen", neighborhood: "Virginia-Highland",
      address: "842 N Highland Ave NE", lat: 33.7752, lng: -84.3529, price: 2, type: "Restaurant",
      cuisine: ["Mediterranean"], vibes: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }],
      deals: [], dealText: "Weekday happy hour (specific deals not listed)",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "atkins-park", name: "Atkins Park", neighborhood: "Virginia-Highland",
      address: "794 N Highland Ave NE", lat: 33.7741, lng: -84.3529, price: 2, type: "Bar",
      cuisine: ["American", "Southern"], vibes: ["Late night", "Sports"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }, { days: [5], start: "18:00", end: "18:15", note: "Free \"Six O'Clock Shot\" round" }],
      deals: ["beer", "cocktails"], dealText: "$5 wells & drafts · Fridays: complimentary 6PM shot",
      hhStatus: "reported", sources: [S.vhd, { label: "atkinspark.com", url: "https://www.atkinspark.com/" }] },

    { id: "highland-tap", name: "Highland Tap", neighborhood: "Virginia-Highland",
      address: "1026 N Highland Ave NE", lat: 33.7816, lng: -84.3534, price: 3, type: "Bar",
      cuisine: ["Steakhouse", "American"], vibes: ["Date night", "Live music"], hours: null,
      happyHours: [], deals: ["food"], dealText: "Nightly specials (e.g. half-price burgers some nights) — ask the bar",
      hhStatus: "unknown", sources: [S.vhd] },

    { id: "dark-horse", name: "Dark Horse Tavern", neighborhood: "Virginia-Highland",
      address: "816 N Highland Ave NE", lat: 33.7746, lng: -84.3528, price: 1, type: "Bar",
      cuisine: ["Bar food"], vibes: ["Live music", "Late night"],
      hours: days({ 3: ["18:30", "01:30"], 4: ["18:30", "02:00"], 5: ["20:00", "03:00"], 6: ["20:00", "03:00"] }),
      happyHours: [], deals: [], dealText: "Live band karaoke; no current happy hour found",
      hhStatus: "unknown", sources: [{ label: "darkhorseatlanta.com", url: "https://darkhorseatlanta.com/" }] },

    // ── Poncey-Highland ───────────────────────────────────────────
    { id: "tio-luchos", name: "Tio Lucho's", neighborhood: "Poncey-Highland",
      address: "675 N Highland Ave NE", lat: 33.7713, lng: -84.3530, price: 2, type: "Restaurant",
      cuisine: ["Peruvian", "Seafood"], vibes: ["Date night"], hours: null,
      happyHours: [{ days: [2, 3, 4, 5], start: "16:00", end: "19:00" }],
      deals: ["cocktails", "food"], dealText: "$1 oysters · $6 margaritas",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "manuels", name: "Manuel's Tavern", neighborhood: "Poncey-Highland",
      address: "602 N Highland Ave NE", lat: 33.7697, lng: -84.3527, price: 1, type: "Bar",
      cuisine: ["Bar food", "American"], vibes: ["Sports", "Groups"],
      hours: days({ 0: ["09:30", "00:00"], 1: ["11:00", "00:00"], 2: ["11:00", "00:00"], 3: ["11:00", "00:00"], 4: ["11:00", "00:00"], 5: ["11:00", "01:00"], 6: ["09:30", "01:00"] }),
      happyHours: [], deals: [], dealText: "Listed as having a happy hour, but times weren't published online",
      hhStatus: "unknown", sources: [{ label: "manuelstavern.com", url: "https://manuelstavern.com/" }] },

    // ── Inman Park ────────────────────────────────────────────────
    { id: "barcelona", name: "Barcelona Wine Bar", neighborhood: "Inman Park",
      address: "240 N Highland Ave NE", lat: 33.7613, lng: -84.3578, price: 2, type: "Wine bar",
      cuisine: ["Spanish / Tapas"], vibes: ["Patio", "Date night"],
      hours: days({ 0: ["11:30", "00:00"], 1: ["16:00", "00:00"], 2: ["16:00", "00:00"], 3: ["16:00", "00:00"], 4: ["13:00", "00:00"], 5: ["13:00", "00:00"], 6: ["11:30", "00:00"] }),
      happyHours: [{ days: [1, 2, 3, 4], start: "16:00", end: "18:00" }, { days: [5], start: "13:00", end: "18:00" }, { days: [1], start: "18:00", end: "24:00", note: "Half-off bottles (from 4PM)" }],
      deals: ["wine", "food"], dealText: "Happy hour menu · Mondays: half-off bottles 4PM–midnight",
      hhStatus: "confirmed", sources: [{ label: "barcelonawinebar.com", url: "https://barcelonawinebar.com/location/inmanpark/" }] },

    { id: "beetlecat", name: "BeetleCat", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE", lat: 33.7623, lng: -84.3572, price: 3, type: "Restaurant",
      cuisine: ["Seafood"], vibes: ["Patio", "Date night"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails"], dealText: "Oyster deals · $10 oyster martini",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "little-spirit", name: "Little Spirit", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE, Ste R3", lat: 33.7627, lng: -84.3568, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Late night", "Date night"],
      hours: days({ 1: ["17:30", "02:00"], 2: ["17:30", "02:00"], 3: ["17:30", "02:00"], 4: ["17:30", "02:00"], 5: ["17:30", "02:00"], 6: ["17:30", "02:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "17:30", end: "20:00" }, { days: [1, 2, 3, 4, 5, 6], start: "24:00", end: "02:00", note: "Late-night happy hour" }],
      deals: ["cocktails"], dealText: "$10 dirty martinis & Moscow mules",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "bartaco-ip", name: "bartaco Inman Park", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE", lat: 33.7625, lng: -84.3570, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Patio", "Groups"], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "\"High tide hour\" at the bar, plus the last 1.5 hrs before close Mon–Thu",
      hhStatus: "confirmed", sources: [{ label: "bartaco.com", url: "https://bartaco.com/location/atlanta-inman/" }] },

    { id: "wrecking-bar", name: "Wrecking Bar Brewpub", neighborhood: "Inman Park",
      address: "292 Moreland Ave NE", lat: 33.7603, lng: -84.3492, price: 2, type: "Brewery",
      cuisine: ["American", "Bar food"], vibes: ["Patio", "Cozy"],
      hours: days({ 0: ["11:00", "22:00"], 1: ["16:00", "23:00"], 2: ["16:00", "23:00"], 3: ["16:00", "23:00"], 4: ["16:00", "23:00"], 5: ["12:00", "00:00"], 6: ["12:00", "00:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["beer"], dealText: "Weekday happy hour (deal details not confirmed)",
      hhStatus: "reported", sources: [{ label: "TotalHappyHour", url: "https://www.totalhappyhour.com/happy-hour-for-wrecking-bar-brewpub-in-atlanta-ga-30307/" }] },

    { id: "victory", name: "Victory Sandwich Bar", neighborhood: "Inman Park",
      address: "913 Bernina Ave NE", lat: 33.7601, lng: -84.3559, price: 1, type: "Bar",
      cuisine: ["Sandwiches"], vibes: ["Patio", "Late night", "Groups"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["11:00", "00:00"]),
      happyHours: [], deals: [], dealText: "Cheap drinks all day; no set happy hour found",
      hhStatus: "unknown", sources: [{ label: "vicsandwich.com", url: "https://www.vicsandwich.com/info" }] },

    // ── Eastside Beltline (O4W / Krog St / Ponce City) ────────────
    { id: "eclipse-di-luna", name: "Eclipse di Luna", neighborhood: "Eastside Beltline",
      address: "661 Auburn Ave NE", lat: 33.7558, lng: -84.3652, price: 2, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Beltline access", "Groups"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails", "beer"], dealText: "$7 tapas · $6 cocktails · $3 beer (BeltLine's April guide said Tue–Fri; newer Infatuation guide says Mon–Fri)",
      hhStatus: "confirmed", sources: [S.inf, S.bl] },

    { id: "communidad", name: "Communidad Taqueria", neighborhood: "Eastside Beltline",
      address: "655 Highland Ave NE", lat: 33.7612, lng: -84.3642, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Patio", "Groups"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "17:00" }],
      deals: ["food", "cocktails", "beer"], dealText: "$2.50 tacos · $2 chips & salsa · $5 margaritas · $3 Dos Equis",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "close-company", name: "Close Company", neighborhood: "Eastside Beltline",
      address: "505 N Angier Ave NE", lat: 33.7700, lng: -84.3662, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Date night", "Beltline access"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "$15: cocktail + pastry pocket + pickles or popcorn",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "new-realm", name: "New Realm Brewing", neighborhood: "Eastside Beltline",
      address: "550 Somerset Terrace NE", lat: 33.7741, lng: -84.3643, price: 2, type: "Brewery",
      cuisine: ["American", "Bar food"], vibes: ["Beltline access", "Rooftop", "Patio", "Groups"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["11:00", "00:00"] : ["11:00", "22:00"])),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "19:00" }],
      deals: ["beer", "food"], dealText: "$5.50 craft beers · discounted loaded fries, sliders & apps",
      hhStatus: "confirmed", sources: [{ label: "newrealmbrewing.com", url: "https://newrealmbrewing.com/atlanta/" }] },

    { id: "nine-mile", name: "9 Mile Station", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market rooftop)", lat: 33.7726, lng: -84.3656, price: 3, type: "Cocktail bar",
      cuisine: ["American"], vibes: ["Rooftop", "Beltline access", "Date night"],
      hours: days({ 0: ["11:00", "21:00"], 1: ["17:00", "22:00"], 2: ["17:00", "22:00"], 3: ["17:00", "22:00"], 4: ["17:00", "22:00"], 5: ["17:00", "00:00"], 6: ["11:00", "00:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "17:00", end: "19:00" }],
      deals: ["cocktails", "beer", "food"], dealText: "Discounted drinks & appetizers with a skyline view",
      hhStatus: "confirmed", sources: [{ label: "9milestation.com", url: "https://9milestation.com/" }] },

    { id: "superica-krog", name: "Superica Krog St", neighborhood: "Eastside Beltline",
      address: "99 Krog St NE", lat: 33.7569, lng: -84.3641, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Beltline access", "Groups", "Patio"],
      hours: days({ 0: ["10:00", "22:00"], 1: ["11:00", "22:00"], 2: ["11:00", "22:00"], 3: ["11:00", "22:00"], 4: ["11:00", "22:00"], 5: ["11:00", "23:00"], 6: ["10:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "Has a happy hour menu; times not published online",
      hhStatus: "unknown", sources: [{ label: "superica.com", url: "https://superica.com/krog-street/" }] },

    { id: "ticonderoga", name: "Ticonderoga Club", neighborhood: "Eastside Beltline",
      address: "99 Krog St NE, Unit W", lat: 33.7570, lng: -84.3640, price: 3, type: "Cocktail bar",
      cuisine: ["Southern", "Seafood"], vibes: ["Date night", "Cozy"],
      hours: days({ 0: ["17:00", "23:00"], 1: ["17:00", "23:00"], 2: ["17:00", "23:00"], 5: ["17:00", "23:00"], 6: ["17:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "No happy hour times found",
      hhStatus: "unknown", sources: [{ label: "ticonderogaclub.com", url: "https://www.ticonderogaclub.com/" }] },

    { id: "ladybird", name: "Ladybird Grove & Mess Hall", neighborhood: "Eastside Beltline",
      address: "684 John Wesley Dobbs Ave NE", lat: 33.7576, lng: -84.3632, price: 2, type: "Bar",
      cuisine: ["American", "Southern"], vibes: ["Beltline access", "Patio", "Dog friendly", "Groups", "Late night"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["11:00", "02:00"] : ["11:00", "00:00"])),
      happyHours: [], deals: [], dealText: "Known for after-work drinks; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "ladybirdatl.com", url: "https://www.ladybirdatl.com/" }] },

    { id: "two-urban-licks", name: "Two Urban Licks", neighborhood: "Eastside Beltline",
      address: "820 Ralph McGill Blvd NE", lat: 33.7660, lng: -84.3640, price: 3, type: "Restaurant",
      cuisine: ["Southern", "BBQ"], vibes: ["Beltline access", "Patio", "Live music"],
      hours: days({ 0: ["11:00", "22:00"], 1: ["17:00", "22:00"], 2: ["17:00", "22:00"], 3: ["17:00", "22:00"], 4: ["17:00", "22:00"], 5: ["17:00", "23:00"], 6: ["11:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "Live blues Tue–Sat; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "twourbanlicks.com", url: "https://www.twourbanlicks.com/" }] },

    // ── Beltline corridor expansion (researched 2026-10-01) ───────
    { id: "lloyds", name: "LLoyd's Restaurant & Lounge", neighborhood: "Inman Park",
      address: "900 DeKalb Ave NE", lat: 33.7593, lng: -84.3555, price: 2, type: "Bar",
      cuisine: ["American", "Pizza"], vibes: ["Cozy", "Late night"],
      hours: days({ 1: ["17:00", "23:00"], 2: ["17:00", "23:00"], 3: ["17:00", "23:00"], 4: ["17:00", "23:00"], 5: ["17:00", "00:00"], 6: ["17:00", "00:00"] }),
      happyHours: [{ days: [2, 3, 4, 5], start: "17:00", end: "19:00" }],
      deals: ["cocktails"], dealText: "$5 martinis, vespers & Manhattans",
      hhStatus: "confirmed", sources: [S.bl] },

    { id: "buena-vida", name: "Buena Vida Tapas Bar", neighborhood: "Eastside Beltline",
      address: "385 N Angier Ave NE, Ste 100", lat: 33.7672, lng: -84.3655, price: 2, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Beltline access", "Patio", "Groups"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["beer", "wine", "cocktails", "food"],
      dealText: "$5 Estrella Damm or Sweetwater 420 · $7 select wines & cava · $8 mojitos, margaritas & mules · tapas specials",
      hhStatus: "confirmed", sources: [{ label: "buenavidatapas.com", url: "https://www.buenavidatapas.com/happyhour" }] },

    { id: "mccrays-beltline", name: "McCray's Tavern on the Beltline", neighborhood: "Eastside Beltline",
      address: "670 DeKalb Ave NE", lat: 33.7596, lng: -84.3638, price: 2, type: "Bar",
      cuisine: ["American", "Bar food"], vibes: ["Beltline access", "Patio", "Sports", "Live music"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails", "wine", "beer"], dealText: "Half-price apps · $8 draft cocktails · half off wine & pints",
      hhStatus: "confirmed", sources: [S.bl] },

    { id: "one-flew-south", name: "One Flew South Beltline", neighborhood: "Eastside Beltline",
      address: "670 DeKalb Ave NE, Ste 102", lat: 33.7598, lng: -84.3634, price: 3, type: "Restaurant",
      cuisine: ["Southern"], vibes: ["Beltline access", "Patio", "Date night"],
      hours: days({ 0: ["10:00", "22:00"], 3: ["15:00", "22:00"], 4: ["15:00", "22:00"], 5: ["15:00", "23:00"], 6: ["10:00", "22:00"] }),
      happyHours: [{ days: [3, 4, 5], start: "15:00", end: "17:00" }],
      deals: [], dealText: "Wed–Fri happy hour (specific deals not listed)",
      hhStatus: "confirmed", sources: [{ label: "oneflewsouthatl.com", url: "https://oneflewsouthatl.com/beltline/" }] },

    { id: "ranger-station", name: "Ranger Station", neighborhood: "Eastside Beltline",
      address: "684 John Wesley Dobbs Ave NE", lat: 33.7598, lng: -84.3644, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Cozy", "Date night", "Beltline access"],
      hours: days({ 0: ["17:00", "00:00"], 1: ["17:00", "00:00"], 2: ["17:00", "00:00"], 3: ["17:00", "00:00"], 4: ["17:00", "00:00"], 5: ["17:00", "01:00"], 6: ["17:00", "01:00"] }),
      happyHours: [], deals: [], dealText: "Listed as having a happy hour; times not published",
      hhStatus: "unknown", sources: [{ label: "The Infatuation review", url: "https://www.theinfatuation.com/atlanta/reviews/ranger-station" }] },

    { id: "burles", name: "Burle's Bar", neighborhood: "Eastside Beltline",
      address: "505 N Angier Ave NE (The Victorian)", lat: 33.7699, lng: -84.3665, price: 2, type: "Cocktail bar",
      cuisine: ["Pizza"], vibes: ["Live music", "Cozy"],
      hours: days({ 0: ["12:00", "22:00"], 2: ["15:00", "00:00"], 3: ["15:00", "00:00"], 4: ["15:00", "00:00"], 5: ["15:00", "00:00"], 6: ["12:00", "00:00"] }),
      happyHours: [], deals: [], dealText: "Live jazz Tuesdays; no happy hour listed on their site",
      hhStatus: "unknown", sources: [{ label: "burlesbar.com", url: "https://www.burlesbar.com/" }] },

    { id: "el-super-pan", name: "El Super Pan", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market)", lat: 33.7724, lng: -84.3661, price: 1, type: "Restaurant",
      cuisine: ["Latin", "Sandwiches"], vibes: ["Groups", "Live music"], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "16:00", end: "19:00" }],
      deals: ["beer", "cocktails", "food"], dealText: "$5 beers · $6 rum punch · Fridays from 6PM: Placita @ Ponce with $8 drinks, $5 snacks & a DJ",
      hhStatus: "reported", sources: [{ label: "elsuperpan.com", url: "https://www.elsuperpan.com/ponce-city-market" }, { label: "AJC", url: "https://www.ajc.com/blog/atlanta-restaurants/eat-drink-and-dance-during-happy-hour-fridays-this-ponce-city-market-spot/iNTe7w5b7pDjx86Q4idMoN/" }] },

    { id: "twelve-cocktail", name: "12 Cocktail Bar", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market tower)", lat: 33.7728, lng: -84.3653, price: 3, type: "Cocktail bar",
      cuisine: [], vibes: ["Date night", "Cozy"], hours: null,
      happyHours: [], deals: ["cocktails", "food"], dealText: "Hidden bar, open Mon–Sat from 5PM; has a happy hour menu (\"tiny tinis & salty snacks\") but no posted times",
      hhStatus: "unknown", sources: [{ label: "12cocktailbar.com", url: "https://www.12cocktailbar.com/" }] },

    // ── Reynoldstown ──────────────────────────────────────────────
    { id: "muchacho", name: "Muchacho", neighborhood: "Reynoldstown",
      address: "904 Memorial Dr SE", lat: 33.7466, lng: -84.3530, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Patio", "Groups"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["08:00", "23:00"] : ["08:00", "22:00"])),
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "\"Staring at the Sun\" menu: select snacks & drinks $5 at the bar",
      hhStatus: "reported", sources: [{ label: "muchacho.com", url: "https://muchacho.com/" }] },

    { id: "breaker-breaker", name: "Breaker Breaker", neighborhood: "Reynoldstown",
      address: "921 Wylie St SE", lat: 33.7525, lng: -84.3556, price: 2, type: "Restaurant",
      cuisine: ["Seafood", "Cajun"], vibes: ["Beltline access", "Rooftop", "Patio"], hours: null,
      happyHours: [], deals: [], dealText: "Happy hour Wed, Thu & Sun (times not published) · rooftop bar Florida Man is 21+",
      hhStatus: "unknown", sources: [{ label: "breakerbreakeratl.com", url: "https://www.breakerbreakeratl.com/home" }] },

    // ── Little Five Points ────────────────────────────────────────
    { id: "star-bar", name: "Star Community Bar", neighborhood: "Little Five Points",
      address: "437 Moreland Ave NE", lat: 33.7646, lng: -84.3494, price: 1, type: "Dive bar",
      cuisine: [], vibes: ["Live music", "Late night"],
      hours: days({ 0: ["13:00", "00:00"], 1: ["17:00", "02:30"], 2: ["17:00", "02:30"], 3: ["17:00", "02:30"], 4: ["17:00", "02:30"], 5: ["13:00", "02:30"], 6: ["13:00", "02:30"] }),
      happyHours: [], deals: ["beer"], dealText: "Everyday cheap drinks ($4 beer specials) rather than a set happy hour",
      hhStatus: "unknown", sources: [{ label: "starbaratl.bar", url: "https://www.starbaratl.bar/" }] },

    { id: "yacht-club", name: "Euclid Avenue Yacht Club", neighborhood: "Little Five Points",
      address: "1136 Euclid Ave NE", lat: 33.7647, lng: -84.3489, price: 1, type: "Dive bar",
      cuisine: ["BBQ", "Bar food"], vibes: ["Late night", "Cozy"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["12:00", "03:00"]),
      happyHours: [], deals: [], dealText: "Daily food & drink specials; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/the-euclid-avenue-yacht-club-atlanta" }] },
  ];
  window.VENUES.forEach(v => { v.checked = CHECKED; });
})();
