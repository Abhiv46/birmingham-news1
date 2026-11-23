# Birmingham Pulse — News Website

A modern, responsive news website for Birmingham ("Bham Pulse | Birmingham's Premier News Source") with real-time updates from NewsAPI.

## Features (as implemented in the code)

- Live Birmingham news headlines via the NewsAPI integration in `script.js`
- Responsive newspaper-style layout (`index.html` + `style.css`)
- Visitor counter helper (`api-counter.js`)
- Vercel deployment config (`vercel.json`)

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Homepage |
| `style.css` | Site styling |
| `script.js` | News fetching and page behaviour |
| `api-counter.js` | Visitor counter |
| `assets/` | Images/media |

## ⚠️ Security note

`script.js` currently contains a hard-coded API key. Move it behind a server-side proxy / environment variable and rotate the key — see the 23 Nov 2026 audit report. Never commit real API keys to a public repository.

## Running locally

Open `index.html` in a browser, or serve the folder with any static server, e.g. `npx serve .`
