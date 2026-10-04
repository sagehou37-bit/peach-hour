/*
  Venue data for Peach Hour — researched from the web on 2026-10-01.

  hhStatus:
    "confirmed" – from the venue's own site, or an official/editorial guide from 2026
                  (Virginia-Highland District, Aug 2026; The Infatuation, Aug 24 2026;
                  Atlanta BeltLine blog, Apr 7 2026)
    "reported"  – from third-party listings that may be stale; double-check
    "unknown"   – venue mentions happy hour (or might have one) but no times found

  Price level ($–$$$) and vibes are editorial estimates. Map coordinates were geocoded on
  2026-10-02 (OpenStreetMap business/address data, US Census geocoder as fallback).
  outdoor: "Patio" | "Rooftop" | "Porch" — best-effort from venue sites/photos/reviews.
  deals: any of "beer", "wine", "cocktails", "food", "oysters".
  hours: index 0=Sun … 6=Sat, each [open, close] or null if closed; whole field null if unknown.
  Happy-hour windows: { days, start, end, note? }. "24:00" start = midnight that night.
  allDay: true = a day-long special (still only counts while the venue is open).
*/
(function () {
  const WEEKDAYS = [1, 2, 3, 4, 5];
  const CHECKED = "2026-10-01";
  const S = {
    cs: { label: "Colony Square specials", url: "https://colonysquare.com/restaurant-specials/" },
    ramb: { label: "Rambler Atlanta (2025)", url: "https://rambleratlanta.com/resources/happy-hour-near-georgia-tech/" },
    vhd: { label: "Virginia-Highland District guide (Aug 2026)", url: "https://www.virginiahighlanddistrict.com/guides/happy-hours" },
    inf: { label: "The Infatuation (Aug 2026)", url: "https://www.theinfatuation.com/atlanta/guides/the-best-happy-hours-in-atlanta" },
    bl: { label: "Atlanta BeltLine blog (Apr 2026)", url: "https://beltline.org/blog/where-to-end-your-workday-on-the-beltline/" },
  };
  const days = spec => [0, 1, 2, 3, 4, 5, 6].map(d => (spec[d] === undefined ? null : spec[d]));

  window.VENUES = [
    // ── Virginia-Highland ─────────────────────────────────────────
    { id: "whiskey-bird", name: "Whiskey Bird", neighborhood: "Virginia-Highland",
      address: "1409 N Highland Ave NE", lat: 33.79269, lng: -84.35178, price: 2, type: "Restaurant",
      cuisine: ["Asian"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [3, 4], start: "16:00", end: "18:30" }, { days: [5, 6, 0], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "$10 cocktails + shareable bites",
      hhStatus: "confirmed", sources: [S.vhd, S.inf] },

    { id: "family-dog", name: "The Family Dog", neighborhood: "Virginia-Highland",
      address: "1402 N Highland Ave NE", lat: 33.79278, lng: -84.35251, price: 1, type: "Bar",
      cuisine: ["Bar food"], vibes: ["Sports"], outdoor: ["Patio"],
      hours: days({ 0: ["11:00", "21:30"], 2: ["16:00", "22:30"], 3: ["16:00", "22:30"], 4: ["16:00", "22:30"], 5: ["12:00", "00:30"], 6: ["11:00", "00:30"] }),
      happyHours: [{ days: [2, 3, 4, 5], start: "16:00", end: "19:00" }],
      deals: ["beer", "cocktails"], dealText: "$4 Montucky & Tecate · $6 margaritas & mules",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "ela", name: "Ela", neighborhood: "Virginia-Highland",
      address: "1186 N Highland Ave NE", lat: 33.78687, lng: -84.35546, price: 2, type: "Restaurant",
      cuisine: ["Mediterranean"], vibes: ["Date night"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }, { days: [6, 0], start: "15:00", end: "17:00" }],
      deals: ["wine", "cocktails", "beer", "food"],
      dealText: "$6 wine by the glass, $6 hummus, $8 cauliflower falafel · Wed: $4 shareables + half-off bottles",
      hhStatus: "confirmed", sources: [S.vhd, S.inf] },

    { id: "bar-bacoa", name: "Bar.bacoa", neighborhood: "Virginia-Highland",
      address: "1000 Virginia Ave NE", lat: 33.78251, lng: -84.35468, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos", "Spanish / Tapas"], vibes: ["Groups"], outdoor: ["Patio"],
      hours: days({ 0: ["12:00", "21:00"], 1: ["16:00", "22:00"], 2: ["16:00", "22:00"], 3: ["16:00", "22:00"], 4: ["16:00", "22:00"], 5: ["16:00", "22:00"], 6: ["12:00", "22:00"] }),
      happyHours: [
        { days: [1], start: "16:00", end: "22:00", note: "$6 house margaritas" },
        { days: [2], start: "16:00", end: "22:00", note: "Half-price tacos" },
        { days: [3], start: "16:00", end: "22:00", note: "$30 select wine bottles" },
      ],
      deals: ["cocktails", "food", "wine"], dealText: "Mon margs · Tue tacos · Wed wine bottles",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "murphys", name: "Murphy's", neighborhood: "Virginia-Highland",
      address: "997 Virginia Ave NE", lat: 33.78206, lng: -84.35488, price: 2, type: "Restaurant",
      cuisine: ["American", "Brunch"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [4], start: "16:00", end: "20:00", note: "Wine Shop happy hour" }],
      deals: ["wine", "food"], dealText: "Wine Shop: four-wine tasting + seasonal charcuterie for $20; extra pours $8",
      hhStatus: "confirmed", sources: [S.vhd, { label: "murphysatlanta.com", url: "https://www.murphysatlanta.com/events/wine-shop-happy-hour" }] },

    { id: "moes-joes", name: "Moe's & Joe's", neighborhood: "Virginia-Highland",
      address: "1033 N Highland Ave NE", lat: 33.78282, lng: -84.35418, price: 1, type: "Dive bar",
      cuisine: ["Bar food"], vibes: ["Sports", "Late night"], outdoor: ["Patio"], hours: null,
      happyHours: [
        { days: [0], allDay: true, note: "$5 PBR pitchers" },
        { days: [2], allDay: true, note: "$3.50 PBR pitchers" },
        { days: [3], allDay: true, note: "$2 PBR tallboys + trivia" },
        { days: [4], allDay: true, note: "$5 rotating pitcher" },
      ],
      deals: ["beer"], dealText: "Daily PBR specials, not a fixed happy-hour window",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "fontaines", name: "Fontaine's Oyster House", neighborhood: "Virginia-Highland",
      address: "1026½ N Highland Ave NE", lat: 33.78284, lng: -84.35454, price: 2, type: "Bar",
      cuisine: ["Seafood"], vibes: ["Late night"], outdoor: [],
      hours: days({ 0: ["11:30", "22:00"], 1: ["11:30", "22:00"], 2: ["16:00", "22:00"], 3: ["11:30", "22:00"], 4: ["11:30", "22:00"], 5: ["11:30", "00:00"], 6: ["11:30", "00:00"] }),
      happyHours: [{ days: [2], allDay: true, note: "$15 house raw dozen oysters" }],
      deals: ["oysters", "food"], dealText: "Tuesday: $15 dozen raw oysters on the half shell",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "truva", name: "Truva Turkish Kitchen", neighborhood: "Virginia-Highland",
      address: "842 N Highland Ave NE", lat: 33.77747, lng: -84.35274, price: 2, type: "Restaurant",
      cuisine: ["Mediterranean"], vibes: [], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }],
      deals: [], dealText: "Weekday happy hour (specific deals not listed)",
      hhStatus: "confirmed", sources: [S.vhd] },

    { id: "atkins-park", name: "Atkins Park", neighborhood: "Virginia-Highland",
      address: "794 N Highland Ave NE", lat: 33.77614, lng: -84.35268, price: 2, type: "Bar",
      cuisine: ["American", "Southern"], vibes: ["Late night", "Sports"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }, { days: [5], start: "18:00", end: "18:15", note: "Free \"Six O'Clock Shot\" round" }],
      deals: ["beer", "cocktails"], dealText: "$5 wells & drafts · Fridays: complimentary 6PM shot",
      hhStatus: "reported", sources: [S.vhd, { label: "atkinspark.com", url: "https://www.atkinspark.com/" }] },

    { id: "highland-tap", name: "Highland Tap", neighborhood: "Virginia-Highland",
      address: "1026 N Highland Ave NE", lat: 33.78263, lng: -84.35460, price: 3, type: "Bar",
      cuisine: ["Steakhouse", "American"], vibes: ["Date night", "Live music"], outdoor: [], hours: null,
      happyHours: [], deals: ["food"], dealText: "Nightly specials (e.g. half-price burgers some nights) — ask the bar",
      hhStatus: "unknown", sources: [S.vhd] },

    { id: "dark-horse", name: "Dark Horse Tavern", neighborhood: "Virginia-Highland",
      address: "816 N Highland Ave NE", lat: 33.77682, lng: -84.35266, price: 1, type: "Bar",
      cuisine: ["Bar food"], vibes: ["Live music", "Late night"], outdoor: [],
      hours: days({ 3: ["18:30", "01:30"], 4: ["18:30", "02:00"], 5: ["20:00", "03:00"], 6: ["20:00", "03:00"] }),
      happyHours: [], deals: [], dealText: "Live band karaoke; no current happy hour found",
      hhStatus: "unknown", sources: [{ label: "darkhorseatlanta.com", url: "https://darkhorseatlanta.com/" }] },

    // ── Poncey-Highland ───────────────────────────────────────────
    { id: "tio-luchos", name: "Tio Lucho's", neighborhood: "Poncey-Highland",
      address: "675 N Highland Ave NE", lat: 33.77304, lng: -84.35239, price: 2, type: "Restaurant",
      cuisine: ["Peruvian", "Seafood"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [2, 3, 4, 5], start: "16:00", end: "19:00" }],
      deals: ["oysters", "cocktails", "food"], dealText: "$1 oysters · $6 margaritas",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "manuels", name: "Manuel's Tavern", neighborhood: "Poncey-Highland",
      address: "602 N Highland Ave NE", lat: 33.77077, lng: -84.35272, price: 1, type: "Bar",
      cuisine: ["Bar food", "American"], vibes: ["Sports", "Groups"], outdoor: [],
      hours: days({ 0: ["09:30", "00:00"], 1: ["11:00", "00:00"], 2: ["11:00", "00:00"], 3: ["11:00", "00:00"], 4: ["11:00", "00:00"], 5: ["11:00", "01:00"], 6: ["09:30", "01:00"] }),
      happyHours: [], deals: [], dealText: "Listed as having a happy hour, but times weren't published online",
      hhStatus: "unknown", sources: [{ label: "manuelstavern.com", url: "https://manuelstavern.com/" }] },

    // ── Inman Park ────────────────────────────────────────────────
    { id: "barcelona", name: "Barcelona Wine Bar", neighborhood: "Inman Park",
      address: "240 N Highland Ave NE", lat: 33.76254, lng: -84.35945, price: 2, type: "Wine bar",
      cuisine: ["Spanish / Tapas"], vibes: ["Date night"], outdoor: ["Patio"],
      hours: days({ 0: ["11:30", "00:00"], 1: ["16:00", "00:00"], 2: ["16:00", "00:00"], 3: ["16:00", "00:00"], 4: ["13:00", "00:00"], 5: ["13:00", "00:00"], 6: ["11:30", "00:00"] }),
      happyHours: [{ days: [1, 2, 3, 4], start: "16:00", end: "18:00" }, { days: [5], start: "13:00", end: "18:00" }, { days: [1], start: "18:00", end: "24:00", note: "Half-off bottles (from 4PM)" }],
      deals: ["wine", "food"], dealText: "Happy hour menu · Mondays: half-off bottles 4PM–midnight",
      hhStatus: "confirmed", sources: [{ label: "barcelonawinebar.com", url: "https://barcelonawinebar.com/location/inmanpark/" }] },

    { id: "beetlecat", name: "BeetleCat", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE", lat: 33.76245, lng: -84.35858, price: 3, type: "Restaurant",
      cuisine: ["Seafood"], vibes: ["Date night"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["oysters", "food", "cocktails"], dealText: "Oyster deals · $10 oyster martini",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "little-spirit", name: "Little Spirit", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE, Ste R3", lat: 33.76255, lng: -84.35865, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Late night", "Date night"], outdoor: [],
      hours: days({ 1: ["17:30", "02:00"], 2: ["17:30", "02:00"], 3: ["17:30", "02:00"], 4: ["17:30", "02:00"], 5: ["17:30", "02:00"], 6: ["17:30", "02:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "17:30", end: "20:00" }, { days: [1, 2, 3, 4, 5, 6], start: "24:00", end: "02:00", note: "Late-night happy hour" }],
      deals: ["cocktails"], dealText: "$10 dirty martinis & Moscow mules",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "bartaco-ip", name: "bartaco Inman Park", neighborhood: "Inman Park",
      address: "299 N Highland Ave NE", lat: 33.76235, lng: -84.35865, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Groups"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "\"High tide hour\" at the bar, plus the last 1.5 hrs before close Mon–Thu",
      hhStatus: "confirmed", sources: [{ label: "bartaco.com", url: "https://bartaco.com/location/atlanta-inman/" }] },

    { id: "wrecking-bar", name: "Wrecking Bar Brewpub", neighborhood: "Inman Park",
      address: "292 Moreland Ave NE", lat: 33.76231, lng: -84.34964, price: 2, type: "Brewery",
      cuisine: ["American", "Bar food"], vibes: ["Cozy"], outdoor: ["Patio"],
      hours: days({ 0: ["11:00", "22:00"], 1: ["16:00", "23:00"], 2: ["16:00", "23:00"], 3: ["16:00", "23:00"], 4: ["16:00", "23:00"], 5: ["12:00", "00:00"], 6: ["12:00", "00:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["beer"], dealText: "Weekday happy hour (deal details not confirmed)",
      hhStatus: "reported", sources: [{ label: "TotalHappyHour", url: "https://www.totalhappyhour.com/happy-hour-for-wrecking-bar-brewpub-in-atlanta-ga-30307/" }] },

    { id: "victory", name: "Victory Sandwich Bar", neighborhood: "Inman Park",
      address: "913 Bernina Ave NE", lat: 33.76400, lng: -84.35779, price: 1, type: "Bar",
      cuisine: ["Sandwiches"], vibes: ["Late night", "Groups"], outdoor: ["Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["11:00", "00:00"]),
      happyHours: [], deals: [], dealText: "Cheap drinks all day; no set happy hour found",
      hhStatus: "unknown", sources: [{ label: "vicsandwich.com", url: "https://www.vicsandwich.com/info" }] },

    // ── Eastside Beltline (O4W / Krog St / Ponce City) ────────────
    { id: "eclipse-di-luna", name: "Eclipse di Luna", neighborhood: "Eastside Beltline",
      address: "661 Auburn Ave NE", lat: 33.75612, lng: -84.36543, price: 2, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Beltline access", "Groups"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails", "beer"], dealText: "$7 tapas · $6 cocktails · $3 beer (BeltLine's April guide said Tue–Fri; newer Infatuation guide says Mon–Fri)",
      hhStatus: "confirmed", sources: [S.inf, S.bl] },

    { id: "communidad", name: "Communidad Taqueria", neighborhood: "Eastside Beltline",
      address: "655 Highland Ave NE", lat: 33.76087, lng: -84.36586, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Groups"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "17:00" }],
      deals: ["food", "cocktails", "beer"], dealText: "$2.50 tacos · $2 chips & salsa · $5 margaritas · $3 Dos Equis",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "close-company", name: "Close Company", neighborhood: "Eastside Beltline",
      address: "505 N Angier Ave NE", lat: 33.76819, lng: -84.36246, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Date night", "Beltline access"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "$15: cocktail + pastry pocket + pickles or popcorn",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "new-realm", name: "New Realm Brewing", neighborhood: "Eastside Beltline",
      address: "550 Somerset Terrace NE", lat: 33.76903, lng: -84.36195, price: 2, type: "Brewery",
      cuisine: ["American", "Bar food"], vibes: ["Beltline access", "Groups"], outdoor: ["Rooftop", "Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["11:00", "00:00"] : ["11:00", "22:00"])),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "19:00" }],
      deals: ["beer", "food"], dealText: "$5.50 craft beers · discounted loaded fries, sliders & apps",
      hhStatus: "confirmed", sources: [{ label: "newrealmbrewing.com", url: "https://newrealmbrewing.com/atlanta/" }] },

    { id: "nine-mile", name: "9 Mile Station", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market rooftop)", lat: 33.77232, lng: -84.36535, price: 3, type: "Cocktail bar",
      cuisine: ["American"], vibes: ["Beltline access", "Date night"], outdoor: ["Rooftop"],
      hours: days({ 0: ["11:00", "21:00"], 1: ["17:00", "22:00"], 2: ["17:00", "22:00"], 3: ["17:00", "22:00"], 4: ["17:00", "22:00"], 5: ["17:00", "00:00"], 6: ["11:00", "00:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "17:00", end: "19:00" }],
      deals: ["cocktails", "beer", "food"], dealText: "Discounted drinks & appetizers with a skyline view",
      hhStatus: "confirmed", sources: [{ label: "9milestation.com", url: "https://9milestation.com/" }] },

    { id: "superica-krog", name: "Superica Krog St", neighborhood: "Eastside Beltline",
      address: "99 Krog St NE", lat: 33.75710, lng: -84.36418, price: 2, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Beltline access", "Groups"], outdoor: ["Patio"],
      hours: days({ 0: ["10:00", "22:00"], 1: ["11:00", "22:00"], 2: ["11:00", "22:00"], 3: ["11:00", "22:00"], 4: ["11:00", "22:00"], 5: ["11:00", "23:00"], 6: ["10:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "Has a happy hour menu; times not published online",
      hhStatus: "unknown", sources: [{ label: "superica.com", url: "https://superica.com/krog-street/" }] },

    { id: "ticonderoga", name: "Ticonderoga Club", neighborhood: "Eastside Beltline",
      address: "99 Krog St NE, Unit W", lat: 33.75644, lng: -84.36395, price: 3, type: "Cocktail bar",
      cuisine: ["Southern", "Seafood"], vibes: ["Date night", "Cozy"], outdoor: [],
      hours: days({ 0: ["17:00", "23:00"], 1: ["17:00", "23:00"], 2: ["17:00", "23:00"], 5: ["17:00", "23:00"], 6: ["17:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "No happy hour times found",
      hhStatus: "unknown", sources: [{ label: "ticonderogaclub.com", url: "https://www.ticonderogaclub.com/" }] },

    { id: "ladybird", name: "Ladybird Grove & Mess Hall", neighborhood: "Eastside Beltline",
      address: "684 John Wesley Dobbs Ave NE", lat: 33.75972, lng: -84.36460, price: 2, type: "Bar",
      cuisine: ["American", "Southern"], vibes: ["Beltline access", "Dog friendly", "Groups", "Late night"], outdoor: ["Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["11:00", "02:00"] : ["11:00", "00:00"])),
      happyHours: [], deals: [], dealText: "Known for after-work drinks; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "ladybirdatl.com", url: "https://www.ladybirdatl.com/" }] },

    { id: "two-urban-licks", name: "Two Urban Licks", neighborhood: "Eastside Beltline",
      address: "820 Ralph McGill Blvd NE", lat: 33.76850, lng: -84.36130, price: 3, type: "Restaurant",
      cuisine: ["Southern", "BBQ"], vibes: ["Beltline access", "Live music"], outdoor: ["Patio"],
      hours: days({ 0: ["11:00", "22:00"], 1: ["17:00", "22:00"], 2: ["17:00", "22:00"], 3: ["17:00", "22:00"], 4: ["17:00", "22:00"], 5: ["17:00", "23:00"], 6: ["11:00", "23:00"] }),
      happyHours: [], deals: [], dealText: "Live blues Tue–Sat; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "twourbanlicks.com", url: "https://www.twourbanlicks.com/" }] },

    // ── Beltline corridor expansion (researched 2026-10-01) ───────
    { id: "lloyds", name: "LLoyd's Restaurant & Lounge", neighborhood: "Inman Park",
      address: "900 DeKalb Ave NE", lat: 33.75488, lng: -84.35796, price: 2, type: "Bar",
      cuisine: ["American", "Pizza"], vibes: ["Cozy", "Late night"], outdoor: [],
      hours: days({ 1: ["17:00", "23:00"], 2: ["17:00", "23:00"], 3: ["17:00", "23:00"], 4: ["17:00", "23:00"], 5: ["17:00", "00:00"], 6: ["17:00", "00:00"] }),
      happyHours: [{ days: [2, 3, 4, 5], start: "17:00", end: "19:00" }],
      deals: ["cocktails"], dealText: "$5 martinis, vespers & Manhattans",
      hhStatus: "confirmed", sources: [S.bl] },

    { id: "buena-vida", name: "Buena Vida Tapas Bar", neighborhood: "Eastside Beltline",
      address: "385 N Angier Ave NE, Ste 100", lat: 33.77040, lng: -84.36386, price: 2, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Beltline access", "Groups"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["beer", "wine", "cocktails", "food"],
      dealText: "$5 Estrella Damm or Sweetwater 420 · $7 select wines & cava · $8 mojitos, margaritas & mules · tapas specials",
      hhStatus: "confirmed", sources: [{ label: "buenavidatapas.com", url: "https://www.buenavidatapas.com/happyhour" }] },

    { id: "mccrays-beltline", name: "McCray's Tavern on the Beltline", neighborhood: "Eastside Beltline",
      address: "670 DeKalb Ave NE", lat: 33.75407, lng: -84.36570, price: 2, type: "Bar",
      cuisine: ["American", "Bar food"], vibes: ["Beltline access", "Sports", "Live music"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails", "wine", "beer"], dealText: "Half-price apps · $8 draft cocktails · half off wine & pints",
      hhStatus: "confirmed", sources: [S.bl] },

    { id: "one-flew-south", name: "One Flew South Beltline", neighborhood: "Eastside Beltline",
      address: "670 DeKalb Ave NE, Ste 102", lat: 33.75368, lng: -84.36555, price: 3, type: "Restaurant",
      cuisine: ["Southern"], vibes: ["Beltline access", "Date night"], outdoor: ["Patio"],
      hours: days({ 0: ["10:00", "22:00"], 3: ["15:00", "22:00"], 4: ["15:00", "22:00"], 5: ["15:00", "23:00"], 6: ["10:00", "22:00"] }),
      happyHours: [{ days: [3, 4, 5], start: "15:00", end: "17:00" }],
      deals: [], dealText: "Wed–Fri happy hour (specific deals not listed)",
      hhStatus: "confirmed", sources: [{ label: "oneflewsouthatl.com", url: "https://oneflewsouthatl.com/beltline/" }] },

    { id: "ranger-station", name: "Ranger Station", neighborhood: "Eastside Beltline",
      address: "684 John Wesley Dobbs Ave NE", lat: 33.75982, lng: -84.36467, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Cozy", "Date night", "Beltline access"], outdoor: [],
      hours: days({ 0: ["17:00", "00:00"], 1: ["17:00", "00:00"], 2: ["17:00", "00:00"], 3: ["17:00", "00:00"], 4: ["17:00", "00:00"], 5: ["17:00", "01:00"], 6: ["17:00", "01:00"] }),
      happyHours: [], deals: [], dealText: "Listed as having a happy hour; times not published",
      hhStatus: "unknown", sources: [{ label: "The Infatuation review", url: "https://www.theinfatuation.com/atlanta/reviews/ranger-station" }] },

    { id: "burles", name: "Burle's Bar", neighborhood: "Eastside Beltline",
      address: "505 N Angier Ave NE (The Victorian)", lat: 33.76830, lng: -84.36253, price: 2, type: "Cocktail bar",
      cuisine: ["Pizza"], vibes: ["Live music", "Cozy"], outdoor: [],
      hours: days({ 0: ["12:00", "22:00"], 2: ["15:00", "00:00"], 3: ["15:00", "00:00"], 4: ["15:00", "00:00"], 5: ["15:00", "00:00"], 6: ["12:00", "00:00"] }),
      happyHours: [], deals: [], dealText: "Live jazz Tuesdays; no happy hour listed on their site",
      hhStatus: "unknown", sources: [{ label: "burlesbar.com", url: "https://www.burlesbar.com/" }] },

    { id: "el-super-pan", name: "El Super Pan", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market)", lat: 33.77242, lng: -84.36542, price: 1, type: "Restaurant",
      cuisine: ["Latin", "Sandwiches"], vibes: ["Groups", "Live music"], outdoor: [], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "16:00", end: "19:00" }],
      deals: ["beer", "cocktails", "food"], dealText: "$5 beers · $6 rum punch · Fridays from 6PM: Placita @ Ponce with $8 drinks, $5 snacks & a DJ",
      hhStatus: "reported", sources: [{ label: "elsuperpan.com", url: "https://www.elsuperpan.com/ponce-city-market" }, { label: "AJC", url: "https://www.ajc.com/blog/atlanta-restaurants/eat-drink-and-dance-during-happy-hour-fridays-this-ponce-city-market-spot/iNTe7w5b7pDjx86Q4idMoN/" }] },

    { id: "twelve-cocktail", name: "12 Cocktail Bar", neighborhood: "Eastside Beltline",
      address: "675 Ponce de Leon Ave NE (Ponce City Market tower)", lat: 33.77222, lng: -84.36542, price: 3, type: "Cocktail bar",
      cuisine: [], vibes: ["Date night", "Cozy"], outdoor: [], hours: null,
      happyHours: [], deals: ["cocktails", "food"], dealText: "Hidden bar, open Mon–Sat from 5PM; has a happy hour menu (\"tiny tinis & salty snacks\") but no posted times",
      hhStatus: "unknown", sources: [{ label: "12cocktailbar.com", url: "https://www.12cocktailbar.com/" }] },

    // ── Reynoldstown ──────────────────────────────────────────────
    { id: "muchacho", name: "Muchacho", neighborhood: "Reynoldstown",
      address: "904 Memorial Dr SE", lat: 33.74687, lng: -84.35799, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Groups"], outdoor: ["Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["08:00", "23:00"] : ["08:00", "22:00"])),
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "15:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "\"Staring at the Sun\" menu: select snacks & drinks $5 at the bar",
      hhStatus: "reported", sources: [{ label: "muchacho.com", url: "https://muchacho.com/" }] },

    { id: "breaker-breaker", name: "Breaker Breaker", neighborhood: "Reynoldstown",
      address: "921 Wylie St SE", lat: 33.75207, lng: -84.35687, price: 2, type: "Restaurant",
      cuisine: ["Seafood", "Cajun"], vibes: ["Beltline access"], outdoor: ["Rooftop", "Patio"], hours: null,
      happyHours: [], deals: [], dealText: "Happy hour Wed, Thu & Sun (times not published) · rooftop bar Florida Man is 21+",
      hhStatus: "unknown", sources: [{ label: "breakerbreakeratl.com", url: "https://www.breakerbreakeratl.com/home" }] },

    // ── Little Five Points ────────────────────────────────────────
    { id: "star-bar", name: "Star Community Bar", neighborhood: "Little Five Points",
      address: "437 Moreland Ave NE", lat: 33.76625, lng: -84.34882, price: 1, type: "Dive bar",
      cuisine: [], vibes: ["Live music", "Late night"], outdoor: [],
      hours: days({ 0: ["13:00", "00:00"], 1: ["17:00", "02:30"], 2: ["17:00", "02:30"], 3: ["17:00", "02:30"], 4: ["17:00", "02:30"], 5: ["13:00", "02:30"], 6: ["13:00", "02:30"] }),
      happyHours: [], deals: ["beer"], dealText: "Everyday cheap drinks ($4 beer specials) rather than a set happy hour",
      hhStatus: "unknown", sources: [{ label: "starbaratl.bar", url: "https://www.starbaratl.bar/" }] },

    { id: "yacht-club", name: "Euclid Avenue Yacht Club", neighborhood: "Little Five Points",
      address: "1136 Euclid Ave NE", lat: 33.76484, lng: -84.35011, price: 1, type: "Dive bar",
      cuisine: ["BBQ", "Bar food"], vibes: ["Late night", "Cozy"], outdoor: [],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["12:00", "03:00"]),
      happyHours: [], deals: [], dealText: "Daily food & drink specials; happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/the-euclid-avenue-yacht-club-atlanta" }] },

    // ── Midtown ───────────────────────────────────────────────────
    { id: "holeman-finch", name: "Holeman & Finch Public House", neighborhood: "Midtown",
      address: "1201 Peachtree St NE (Colony Square)", lat: 33.78790, lng: -84.38306, price: 3, type: "Bar",
      cuisine: ["American", "Seafood"], vibes: ["Date night"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "16:00", end: "18:00" }],
      deals: ["oysters", "food", "cocktails"], dealText: "Half-off oysters, bites & specialty cocktails",
      hhStatus: "confirmed", sources: [S.cs, S.inf] },

    { id: "5church", name: "5Church Midtown", neighborhood: "Midtown",
      address: "Colony Square, 1197 Peachtree St NE", lat: 33.78728, lng: -84.38278, price: 3, type: "Restaurant",
      cuisine: ["American", "Seafood"], vibes: ["Date night", "Live music"], outdoor: ["Patio", "Rooftop"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "19:00" }],
      deals: ["oysters"], dealText: "$1 oysters at the bar & patio (dine-in) · live jazz on the rooftop nightly 6–9PM",
      hhStatus: "confirmed", sources: [S.cs] },

    { id: "establishment", name: "Establishment", neighborhood: "Midtown",
      address: "1197 Peachtree St NE (Colony Square)", lat: 33.78685, lng: -84.38217, price: 2, type: "Bar",
      cuisine: ["American"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [1, 2, 3, 4, 5, 6], start: "15:00", end: "19:00" }],
      deals: ["cocktails", "food"], dealText: "$9 cocktails · $10 confit duck tacos · Mon: steak, fries & martini $32",
      hhStatus: "confirmed", sources: [S.cs, S.inf] },

    { id: "serena", name: "Serena Pastificio", neighborhood: "Midtown",
      address: "Colony Square, 1197 Peachtree St NE", lat: 33.78738, lng: -84.38285, price: 2, type: "Restaurant",
      cuisine: ["Italian"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "15:00", end: "18:00" }],
      deals: ["food", "cocktails"], dealText: "Discounted small plates & cocktails",
      hhStatus: "confirmed", sources: [S.cs] },

    { id: "park-tavern", name: "Park Tavern", neighborhood: "Midtown",
      address: "500 10th St NE (Piedmont Park)", lat: 33.78215, lng: -84.36924, price: 2, type: "Bar",
      cuisine: ["American", "Bar food"], vibes: ["Sports", "Groups", "Dog friendly"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }, { days: [0, 1, 2, 3, 4], start: "20:00", end: "24:00", note: "Late happy hour (8PM–close)" }],
      deals: ["beer", "wine", "cocktails", "food"], dealText: "$1 off all drinks · food $6–10 · rumored $1 drafts when it rains",
      hhStatus: "confirmed", sources: [{ label: "parktavern.net", url: "https://www.parktavern.net/menu/happy-hour-menu/" }, S.ramb] },

    { id: "cypress-street", name: "Cypress Street Pint & Plate", neighborhood: "Midtown",
      address: "817 W Peachtree St NE", lat: 33.77735, lng: -84.38611, price: 1, type: "Bar",
      cuisine: ["Bar food", "American"], vibes: ["Groups", "Sports"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "17:00", end: "19:00" }, { days: [4], allDay: true, note: "$2 tacos & half-off wine" }],
      deals: ["food", "wine", "beer"], dealText: "Half-price apps · Thursdays: $2 tacos & half-off wine · 3 min walk from Tech",
      hhStatus: "reported", sources: [S.ramb, { label: "Georgia on My Dime", url: "https://georgiaonmydime.com/atlanta-happy-hour/cypress-street-pint-plate/" }] },

    { id: "boho-taco", name: "Boho Taco Tech Square", neighborhood: "Midtown",
      address: "22 5th St NW (Tech Square)", lat: 33.77665, lng: -84.38790, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Groups"], outdoor: [], hours: null,
      happyHours: [{ days: [1], allDay: true, note: "$5 Margarita Monday" }],
      deals: ["cocktails"], dealText: "$5 Margarita Monday · posts rotating deals on social media",
      hhStatus: "reported", sources: [S.ramb] },

    // ── West Midtown / Home Park (Georgia Tech) ───────────────────
    { id: "rocky-mountain", name: "Rocky Mountain Pizza", neighborhood: "Home Park",
      address: "1005 Hemphill Ave NW", lat: 33.78212, lng: -84.40435, price: 1, type: "Restaurant",
      cuisine: ["Pizza", "Bar food"], vibes: ["Sports", "Groups"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], allDay: true, note: "Discounted beers & margaritas" }],
      deals: ["beer", "cocktails"], dealText: "Mon–Thu all-day beer & margarita specials · weekly trivia · 1 min from campus",
      hhStatus: "reported", sources: [S.ramb] },

    { id: "ghee", name: "Ghee Indian Kitchen", neighborhood: "West Midtown",
      address: "1050 Howell Mill Rd", lat: 33.78345, lng: -84.41189, price: 2, type: "Restaurant",
      cuisine: ["Indian"], vibes: ["Groups"], outdoor: [], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "17:00", end: "19:00" }],
      deals: ["food", "cocktails"], dealText: "Specials under $5, $10 & $15",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "flight-club", name: "Flight Club", neighborhood: "West Midtown",
      address: "1055 Howell Mill Rd NW", lat: 33.78334, lng: -84.41142, price: 2, type: "Bar",
      cuisine: ["American"], vibes: ["Groups", "Games"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["food", "cocktails", "beer", "wine"], dealText: "$10 buffalo chicken sliders · $12 flatbreads · drink deals (BeltLine guide: $8 cocktails, all day Mondays)",
      hhStatus: "confirmed", sources: [S.inf, S.bl] },

    { id: "ormsbys", name: "Ormsby's", neighborhood: "West Midtown",
      address: "1170 Howell Mill Rd, Ste P20", lat: 33.78576, lng: -84.41204, price: 1, type: "Bar",
      cuisine: ["Bar food", "Sandwiches"], vibes: ["Games", "Groups", "Sports"], outdoor: ["Patio"], hours: null,
      happyHours: [], deals: [], dealText: "Bocce, shuffleboard & darts; a Georgia Tech favorite. Happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "ormsbysatlanta.com", url: "https://www.ormsbysatlanta.com/" }] },

    // ── Toco Hills / North Decatur (Emory) ────────────────────────
    { id: "wild-heaven-toco", name: "Wild Heaven + Fox Bros. Toco Hills", neighborhood: "Toco Hills",
      address: "2935-B N Druid Hills Rd NE", lat: 33.81538, lng: -84.31018, price: 1, type: "Brewery",
      cuisine: ["BBQ"], vibes: ["Dog friendly", "Groups", "Sports"], outdoor: ["Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 0 ? ["11:00", "20:00"] : d >= 5 ? ["11:00", "22:00"] : ["11:00", "21:00"])),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }],
      deals: ["beer", "wine", "cocktails"], dealText: "$5 EDB pints · $6 drafts · $7 wine · $8 cocktails · free trivia Tuesdays 7PM",
      hhStatus: "confirmed", sources: [{ label: "wildheavenbeer.com", url: "https://wildheavenbeer.com/toco-hills" }] },

    { id: "maggies", name: "Maggie's Neighborhood Bar", neighborhood: "Toco Hills",
      address: "2937 N Druid Hills Rd NE", lat: 33.81491, lng: -84.31219, price: 1, type: "Dive bar",
      cuisine: ["Bar food"], vibes: ["Late night", "Sports"], outdoor: [],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["12:00", "02:00"]),
      happyHours: [{ days: [1], allDay: true, note: "Margarita Monday" }, { days: [2], allDay: true, note: "$2 tequila shots, $3 tequila drinks" }],
      deals: ["cocktails"], dealText: "\"The Emory tradition\" · $4 lemon drop shots daily · Tequila Tuesday",
      hhStatus: "reported", sources: [{ label: "maggiestocohills.com", url: "https://www.maggiestocohills.com/" }] },

    { id: "salaryman-toco", name: "Salaryman Toco Hills", neighborhood: "Toco Hills",
      address: "2941 N Druid Hills Rd NE, Ste B", lat: 33.81523, lng: -84.31006, price: 2, type: "Restaurant",
      cuisine: ["Asian"], vibes: ["Groups"], outdoor: [], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], start: "15:00", end: "18:00" }],
      deals: ["food"], dealText: "Deals on lettuce wraps & Brussels sprouts starters · EmoryCard: free drink or appetizer with a dine-in entrée",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/salaryman-toco-hills-atlanta" }, { label: "EmoryCard discounts", url: "https://www.onecard.emory.edu/emorycard/use-card/eagle-discounts.html" }] },

    // ── Emory Village / North Decatur ─────────────────────────────
    { id: "double-zero", name: "Double Zero", neighborhood: "Emory / Druid Hills",
      address: "1577 N Decatur Rd NE (Emory Village)", lat: 33.78798, lng: -84.32617, price: 2, type: "Restaurant",
      cuisine: ["Italian", "Pizza"], vibes: ["Date night", "Games", "Groups"], outdoor: [],
      hours: days({ 1: ["17:00", "21:00"], 2: ["17:00", "21:00"], 3: ["17:00", "21:00"], 4: ["17:00", "21:00"], 5: ["17:00", "22:00"], 6: ["17:00", "22:00"] }),
      happyHours: [{ days: [1, 2, 3, 4, 5, 6], start: "17:00", end: "18:00" }],
      deals: ["cocktails", "beer", "food"], dealText: "$9 Negronis · $5 Peronis · $5 meatballs & cauliflower · $9 pastas & cheese bread · shuffleboard & foosball in the bar · walk from campus",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/double-zero-atlanta-3" }, { label: "doublezeroatl.com (hours)", url: "https://www.doublezeroatl.com/" }] },

    { id: "poboy-shop", name: "The Po'Boy Shop & Basement Bar", neighborhood: "North Decatur",
      address: "1369 Clairmont Rd, Decatur", lat: 33.79343, lng: -84.30548, price: 1, type: "Bar",
      cuisine: ["Cajun", "Sandwiches"], vibes: ["Late night", "Sports", "Games"], outdoor: [],
      hours: [0, 1, 2, 3, 4, 5, 6].map(() => ["11:00", "02:00"]),
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], allDay: true, note: "Daily shot specials (Basement Bar, 21+)" }],
      deals: ["cocktails", "beer"], dealText: "Daily shot specials in the 21+ basement bar · 24+ drafts, 80+ tequilas, hurricanes · pool, TVs · open till 2AM",
      hhStatus: "reported", sources: [{ label: "thepoboyshopatl.com", url: "https://www.thepoboyshopatl.com/basementbar" }] },

    // ── Decatur ───────────────────────────────────────────────────
    { id: "kimball-house", name: "Kimball House", neighborhood: "Decatur",
      address: "303 E Howard Ave, Decatur", lat: 33.77154, lng: -84.29236, price: 3, type: "Cocktail bar",
      cuisine: ["Seafood"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "17:00", end: "19:00", note: "Raw bar happy hour" }],
      deals: ["oysters"], dealText: "About half-price oysters from around the country · arrive early, it fills fast",
      hhStatus: "reported", sources: [{ label: "AJC (2018)", url: "https://www.ajc.com/events/food--wine/dekalb-spots-with-food-and-drink-specials-you-won-want-miss/9jVhuGwrLixr969EjGibVP/" }] },

    { id: "iberian-pig", name: "The Iberian Pig", neighborhood: "Decatur",
      address: "121 Sycamore St, Decatur", lat: 33.77446, lng: -84.29601, price: 3, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Date night"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], start: "17:00", end: "18:00" }, { days: [5], start: "16:00", end: "18:00" }],
      deals: ["food", "wine"], dealText: "Discounted charcuterie · $5 glasses of wine",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "la-chiquiada", name: "La Chiquiada", neighborhood: "Decatur",
      address: "110 W Trinity Pl, Decatur", lat: 33.77331, lng: -84.29699, price: 1, type: "Restaurant",
      cuisine: ["Mexican / Tacos"], vibes: ["Groups"], outdoor: [], hours: null,
      happyHours: [{ days: [2, 3, 4, 5, 6], start: "16:00", end: "18:00" }],
      deals: ["cocktails", "food"], dealText: "$8 margaritas · two tacos for $7",
      hhStatus: "confirmed", sources: [S.inf] },

    { id: "leilas", name: "Leila's Bar", neighborhood: "Decatur",
      address: "116 Clairemont Ave, Decatur", lat: 33.77614, lng: -84.29694, price: 2, type: "Cocktail bar",
      cuisine: [], vibes: ["Cozy", "Date night"], outdoor: [],
      hours: days({ 1: ["16:00", "22:00"], 2: ["16:00", "22:00"], 3: ["16:00", "22:00"], 4: ["16:00", "22:00"], 5: ["16:00", "22:00"], 6: ["16:00", "22:00"] }),
      happyHours: [{ days: WEEKDAYS, start: "17:00", end: "20:00" }],
      deals: [], dealText: "Weekday happy hour (deals not listed) · hotel-lobby bar near the Square",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/leila-s-bar-decatur" }] },

    { id: "thinking-man", name: "Thinking Man Tavern", neighborhood: "Decatur",
      address: "537 W Howard Ave, Decatur", lat: 33.76787, lng: -84.30458, price: 1, type: "Pub",
      cuisine: ["Bar food"], vibes: ["Late night", "Cozy"], outdoor: ["Patio"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "22:00", end: "24:00", note: "Late-night happy hour (from 10PM)" }, { days: [0], allDay: true, note: "Industry night: $2.50 PBR, $4 wells" }],
      deals: ["beer", "cocktails"], dealText: "Late-night weekday specials from 10PM · Sunday industry night",
      hhStatus: "reported", sources: [{ label: "Rough Draft Atlanta (2025)", url: "https://roughdraftatlanta.com/2025/04/09/thinking-man-tavern-decatur-regulars-industry-night/" }] },

    { id: "pinewood", name: "The Pinewood", neighborhood: "Decatur",
      address: "254 W Ponce de Leon Ave, Decatur", lat: 33.77542, lng: -84.29989, price: 2, type: "Cocktail bar",
      cuisine: ["Southern"], vibes: ["Cozy"], outdoor: [], hours: null,
      happyHours: [{ days: [3], allDay: true, note: "Whiskey Wednesday: half-price whiskey cocktails" }],
      deals: ["cocktails"], dealText: "Whiskey Wednesdays: half-priced whiskey cocktails",
      hhStatus: "reported", sources: [{ label: "AJC (2018)", url: "https://www.ajc.com/events/food--wine/dekalb-spots-with-food-and-drink-specials-you-won-want-miss/9jVhuGwrLixr969EjGibVP/" }] },

    { id: "brick-store", name: "Brick Store Pub", neighborhood: "Decatur",
      address: "125 E Court Sq, Decatur", lat: 33.77514, lng: -84.29581, price: 2, type: "Pub",
      cuisine: ["Bar food"], vibes: ["Cozy", "Groups"], outdoor: [],
      hours: days({ 0: ["11:30", "23:30"], 1: ["16:30", "23:30"], 2: ["11:30", "23:30"], 3: ["11:30", "23:30"], 4: ["11:30", "23:30"], 5: ["11:30", "00:30"], 6: ["11:30", "00:30"] }),
      happyHours: [], deals: ["beer"], dealText: "Legendary beer list (30 drafts + Belgian bar); happy hour times not published",
      hhStatus: "unknown", sources: [{ label: "brickstorepub.com", url: "https://www.brickstorepub.com/" }] },

    { id: "leons", name: "Leon's Full Service", neighborhood: "Decatur",
      address: "131 E Ponce de Leon Ave, Decatur", lat: 33.77538, lng: -84.29512, price: 2, type: "Bar",
      cuisine: ["American"], vibes: ["Groups", "Late night"], outdoor: ["Patio"],
      hours: days({ 0: ["11:30", "01:00"], 1: ["17:00", "01:00"], 2: ["11:30", "01:00"], 3: ["11:30", "01:00"], 4: ["11:30", "01:00"], 5: ["11:30", "02:00"], 6: ["11:30", "02:00"] }),
      happyHours: [], deals: [], dealText: "Popular happy hour spot in an old service station; times not published",
      hhStatus: "unknown", sources: [{ label: "leonsfullservice.com", url: "https://www.leonsfullservice.com/" }] },

    // ── Edgewood Ave ──────────────────────────────────────────────
    { id: "marcus", name: "Marcus Bar & Grille", neighborhood: "Edgewood",
      address: "525 Edgewood Ave SE", lat: 33.75408, lng: -84.37032, price: 2, type: "Restaurant",
      cuisine: ["Southern"], vibes: ["Date night", "Groups"], outdoor: ["Patio"],
      hours: days({ 0: ["10:30", "22:00"], 2: ["17:00", "22:00"], 3: ["17:00", "22:00"], 4: ["17:00", "22:00"], 5: ["17:00", "23:00"], 6: ["10:30", "23:00"] }),
      happyHours: [{ days: [2, 3, 4, 5], start: "16:00", end: "18:00", note: "At the bar, high-tops & patio" }],
      deals: ["cocktails", "food"], dealText: "$10 cocktails · bites like brisket sliders, wings & jollof arancini $8–14",
      hhStatus: "confirmed", sources: [{ label: "marcusbarandgrille.com", url: "https://www.marcusbarandgrille.com/location/marcus-bar-and-grille/" }] },

    { id: "miss-conduck", name: "Miss Conduck", neighborhood: "Edgewood",
      address: "357 Edgewood Ave SE", lat: 33.75431, lng: -84.37626, price: 2, type: "Restaurant",
      cuisine: ["Caribbean"], vibes: ["Groups", "Late night"], outdoor: [], hours: null,
      happyHours: [{ days: [0, 1, 2, 3, 4, 5, 6], start: "16:00", end: "19:00" }],
      deals: ["cocktails", "food", "beer"], dealText: "$7 cocktails · $9 jerk chicken egg rolls · $22 jerk burger & beer combo",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/miss-conduck-atlanta" }] },

    { id: "happy-hour-atl", name: "Happy Hour ATL", neighborhood: "Edgewood",
      address: "421 Edgewood Ave SE", lat: 33.75427, lng: -84.37358, price: 1, type: "Sports bar",
      cuisine: [], vibes: ["Sports", "Late night"], outdoor: [], hours: null,
      happyHours: [{ days: [1, 3, 4, 5], start: "17:00", end: "19:00" }],
      deals: ["food", "cocktails"], dealText: "Daily specials like $5 hookah & $3 lamb chops",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/happy-hour-atl-atlanta" }] },

    // ── Buckhead ──────────────────────────────────────────────────
    { id: "roshambo", name: "Roshambo", neighborhood: "Buckhead",
      address: "2355 Peachtree Rd NE (Peachtree Battle)", lat: 33.81919, lng: -84.38845, price: 2, type: "Restaurant",
      cuisine: ["American", "Seafood"], vibes: ["Date night", "Groups"], outdoor: [],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 0 || d === 6 ? ["10:00", "21:00"] : ["16:00", "21:00"])),
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "18:00" }, { days: [6, 0], start: "14:00", end: "17:00" }],
      deals: ["oysters", "cocktails", "wine", "beer"], dealText: "Half-dozen oysters $12–15 · $10 classic cocktails & select wines · $35 martini pitchers",
      hhStatus: "confirmed", sources: [{ label: "roshamboatl.com", url: "https://roshamboatl.com/" }, { label: "DiningOut", url: "https://diningout.com/atlanta/best-happy-hours-in-atlanta-where-to-find-the-top-food-and-drink-deals-right-now/" }] },

    { id: "snap-thai", name: "Snap Thai Fish House", neighborhood: "Buckhead",
      address: "3699 Lenox Rd NE, Ste 5", lat: 33.85130, lng: -84.37169, price: 2, type: "Restaurant",
      cuisine: ["Thai", "Seafood"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }],
      deals: ["oysters", "food", "cocktails", "beer", "wine"], dealText: "$1.50 raw oysters · $2 chargrilled · bites from $5 · $10 cocktails · $5 beer · half-price wine bottles",
      hhStatus: "confirmed", sources: [{ label: "snapthaiatl.com", url: "https://www.snapthaiatl.com/" }] },

    { id: "fado", name: "Fadó Irish Pub", neighborhood: "Buckhead",
      address: "273 Buckhead Ave NE", lat: 33.83802, lng: -84.37862, price: 2, type: "Pub",
      cuisine: ["British", "Bar food"], vibes: ["Sports", "Groups"], outdoor: ["Rooftop"], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "16:00", end: "19:00" }],
      deals: ["food", "wine", "cocktails"], dealText: "$5 fish & chip cup, corned beef rolls & more · $7.50–8 wine, old fashioneds & spritzes",
      hhStatus: "reported", sources: [{ label: "Georgia on My Dime", url: "https://georgiaonmydime.com/atlanta-happy-hour/fado-irish-pub-buckhead/" }, { label: "Atly (Sep 2026)", url: "https://www.atly.com/united-states/georgia/atlanta/buckhead/best-happy-hour" }] },

    { id: "iberian-pig-buckhead", name: "The Iberian Pig Buckhead", neighborhood: "Buckhead",
      address: "3150 Roswell Rd NW", lat: 33.84164, lng: -84.37904, price: 3, type: "Restaurant",
      cuisine: ["Spanish / Tapas"], vibes: ["Date night"], outdoor: [], hours: null,
      happyHours: [{ days: [1, 2, 3, 4], start: "17:00", end: "19:00" }, { days: [5], start: "16:00", end: "19:00" }],
      deals: ["food", "wine", "cocktails"], dealText: "\"Jamón Happy Hour\": discounted cheese & charcuterie boards, $5 drinks (sources disagree on the end time)",
      hhStatus: "reported", sources: [{ label: "Yelp listing", url: "https://www.yelp.com/biz/the-iberian-pig-atlanta" }] },

    // ── Emory Point / Druid Hills (Clifton Rd area) ───────────────
    { id: "srithai-emory", name: "SriThai Emory Point", neighborhood: "Emory / Druid Hills",
      address: "1540 Avenue Pl (Emory Point)", lat: 33.80124, lng: -84.32709, price: 2, type: "Restaurant",
      cuisine: ["Thai", "Sushi"], vibes: ["Groups"], outdoor: [], hours: null,
      happyHours: [{ days: WEEKDAYS, start: "15:00", end: "18:00" }],
      deals: ["food"], dealText: "Weekday happy hour specials · walkable from Emory's campus",
      hhStatus: "reported", sources: [{ label: "OpenTable listing", url: "https://www.opentable.com/r/srithai-thai-kitchen-and-sushi-bar-emory-point-atlanta" }] },

    { id: "hopdoddy-druid-hills", name: "Hopdoddy Burger Bar", neighborhood: "Emory / Druid Hills",
      address: "2470 Briarcliff Rd NE, Ste 47", lat: 33.82681, lng: -84.33269, price: 1, type: "Restaurant",
      cuisine: ["American"], vibes: ["Groups"], outdoor: ["Patio"],
      hours: [0, 1, 2, 3, 4, 5, 6].map(d => (d === 5 || d === 6 ? ["11:00", "23:00"] : ["11:00", "22:00"])),
      happyHours: [{ days: [1, 2, 3, 4], start: "15:00", end: "18:00", note: "Half off daily features (dine-in)" }],
      deals: ["food"], dealText: "Half off daily features, Mon–Thu (dine-in only)",
      hhStatus: "confirmed", sources: [{ label: "hopdoddy.com", url: "https://www.hopdoddy.com/locations/druidhills" }] },
  ];
  window.VENUES.forEach(v => { v.checked = CHECKED; });

  // Spots with no known happy hour (hhStatus "unknown") stay in this file as a
  // to-research list but aren't shown on the site. Once you confirm one's
  // happy hour, fill in happyHours and change hhStatus to show it.
  window.VENUES = window.VENUES.filter(v => v.hhStatus !== "unknown");
})();
