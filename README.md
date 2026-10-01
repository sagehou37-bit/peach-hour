# Peach Hour

Atlanta happy hours, sorted by what's pouring right now. Covers Virginia-Highland, Poncey-Highland, Inman Park, Little Five Points, Reynoldstown and the Eastside Beltline.

A plain static site (HTML, CSS, JavaScript), with no build step.

## Files

- `index.html`: the page
- `styles.css`: the look
- `app.js`: filters, time logic, map
- `venues.js`: every bar and its happy hours. **Edit this to add or update spots.**

## Run it locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit http://localhost:8000.

## Updating a bar

In `venues.js`, find the bar and change its `happyHours`, `dealText`, `hhStatus` and `sources`. Days are numbered 0 = Sunday through 6 = Saturday. Times are 24-hour (`"16:00"`). The comment at the top of the file explains every field.
