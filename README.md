# GamersArchives.org front-end beta prototype

A deployable static starter website for a gaming tournament and community platform.

## Included in this prototype

- Responsive home dashboard
- Tournament listing, filters, and local demo creation
- Duel challenge listing, filters, and local demo creation
- Gaming clip archive and local demo upload form
- Forum thread list and local demo posting
- Live chat demo saved in the browser
- Profile and badges
- Virtual Archive Credits and free-play arcade demos
- Rules and safety page

## Run locally

Open `index.html` in a web browser. No installation is required.

For a local development server, run one of the following commands inside this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Publish free with Netlify Drop

1. Extract the ZIP file.
2. Visit Netlify Drop in a web browser.
3. Drag the `gamersarchives-site` folder into the upload area.
4. Netlify provides a free public site address.

## What still needs a backend

This is a polished front-end prototype. The browser stores demo data with `localStorage`, so it is not shared across devices or members.

A production version should connect to a backend for:

- Real account registration and login
- Database-backed tournaments, brackets, profiles, forum posts, and credit history
- Secure moderator and administrator roles
- Video storage, upload limits, and content moderation
- Realtime chat and notifications
- Rate limiting, anti-spam tools, and reporting workflows

## Archive Credits safety rule

Archive Credits are designed as virtual community points only. They must not be sold, purchased, traded, transferred, cashed out, or exchanged for money, gift cards, physical prizes, or anything else with real-world value without appropriate legal review.
