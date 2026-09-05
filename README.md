# San Francisco Math Initiative

The website for the San Francisco Math Open and the rest of the initiative.
Built for **SFMO 2027 — Under the Sea**.

Static React site on GitHub Pages, with Supabase behind team registration and
the staff portal.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/sfmo/
```

The site runs fine without Supabase credentials — registration and the staff
portal simply report that the backend is not connected.

| Command           | What it does                                     |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Dev server with hot reload                       |
| `npm run build`   | Type-check, then build to `dist/`                 |
| `npm run preview` | Serve `dist/` exactly as Pages will              |

## Where things live

```
src/
  data/          All site copy that is a list: staff bios, past events,
                 resources, the yearly calendar. Edit here, not in JSX.
  lib/config.ts  Links, dates, org facts. One source of truth.
  lib/           Supabase client, registration calls, theme, asset paths.
  pages/         One file per route.
  components/    Nav, footer, logo, pixel wave, portraits, countdown.
  styles/        tokens → base → layout → components → pages, in that order.
public/
  art/           The submarine and seaweed drawings.
  crew/          Team portraits (see public/crew/README.md for filenames).
  brand/         Logo assets.
  fonts/         Self-hosted web fonts (generated).
supabase/
  schema.sql     Tables, row level security, registration function.
  README.md      Supabase setup, staff accounts, opening registration.
```

## Common edits

**Change a date, link, or the registration window** → `src/lib/config.ts`.

**Add or edit a team member** → `src/data/staff.ts`, then drop the photo in
`public/crew/<slug>.jpg`. The `photoPosition` field controls the crop.

**Add a past event to the archive** → `src/data/archive.ts`. Every field is
optional except the header ones, so a sparse event renders cleanly.

**Add a route** → create the page, register it in `src/App.tsx`, *and* add it
to `ROUTES` in `vite.config.ts` so it gets its own HTML file, metadata, and a
sitemap entry.

**Publish a problem set** → put the PDF in `public/docs/`, then set `href` in
`src/data/resources.ts` to `'/docs/your-file.pdf'`.

## Design notes

The look is deliberately hand-built rather than framework-default: hard ink
borders with unblurred offset shadows, a pixel display face (Silkscreen)
against a rounded body face (Nunito), stepped pixel-art wave dividers, and a
page background that darkens as you scroll — scrolling the site is descending
the water column. The dark theme is a night dive rather than an inversion.

Decoration is deterministic. Bubble positions are a fixed table, not
`Math.random()`, so the page looks the same on every visit.

Colours that sit on a filled surface (`--on-sub`, `--on-fill`) do not flip
with the theme; `--ink` does. Never pair `--ink` with a saturated background.

## Deployment

See [`DEPLOY.md`](DEPLOY.md) — GitHub Pages, the custom-domain switch, Google
Search Console, and Actions cost.
