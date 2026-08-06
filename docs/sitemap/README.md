# Kado Kohi — Website Sitemap (Business Owners)

This folder is a **plain-language map of the whole website**: what guests see, what customers do after login, and what Admin / Barista / Staff use day to day.

## Files

| File | What it is |
|------|------------|
| [`kado-kohi-sitemap.html`](./kado-kohi-sitemap.html) | Interactive sitemap — open in any browser |
| [`kado-kohi-sitemap.pdf`](./kado-kohi-sitemap.pdf) | Same content as a PDF (ready to email / print) |
| [`README.md`](./README.md) | This guide |

Live site: **https://www.kadokohi.com**

## How to open

1. Double-click `kado-kohi-sitemap.html`, **or**
2. Drag the file into Chrome / Edge / Safari / Firefox.

No install and no internet required to view the file (links to the live site need internet).

## How to share with business owners

- **Email / Drive / Slack:** attach or upload `kado-kohi-sitemap.html` (and this README if helpful).
- **PDF:** open the HTML → **Print** → choose **Save as PDF** (or “Microsoft Print to PDF”).
  - Tip: use **Landscape** orientation and enable **Background graphics** so colors print correctly.
- **Meeting:** project the HTML in a browser; use the section jump links at the top.

## How to read the colors

| Color | Meaning |
|-------|---------|
| Blue | Starting point (home / portal entry) |
| Gold | Major area of the site |
| Red / magenta | A page or screen |
| Teal | Step or detail under a page |

This matches the style of a classic website sitemap diagram (home → sections → pages → details).

## Who uses which area

| Audience | How they get in | What they use |
|----------|-----------------|---------------|
| **Guest** (anyone) | Public website | Menu, events, bookings, branches, QR ordering |
| **Customer** | Sign up / log in on the public site | My Account (orders, loyalty, profile) |
| **Barista** | Hidden staff login | Order board, POS, stamps, kiosk |
| **Staff** | Hidden staff login | Merch, booth bookings, event sign-ups |
| **Admin** | Hidden staff login | Full control: menu, branches, users, settings, CMS |

Internal login address (not shown in the public menu): `/management-portal`

## Keeping this up to date

When routes change in the app (`src/App.tsx` / `PROJECT_CONTEXT.md` §4), update `kado-kohi-sitemap.html` in the same pull request so owners always see the current map.

_Last aligned with production routes as of August 2026._
