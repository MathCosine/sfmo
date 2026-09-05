# Team photos

Drop each portrait in here using **exactly** these filenames. The site picks
them up automatically — no code changes needed. Until a file exists, that
card shows a pixel monogram instead of a broken image.

| File            | Person                |
| --------------- | --------------------- |
| `thomas.jpg`    | Zi-Jie (Thomas) Ni    |
| `seojin.jpg`    | Seojin Lee            |
| `ella.jpg`      | Ella Feng             |
| `alexander.jpg` | Alexander Braun       |
| `ethan.jpg`     | Ethan Sun             |
| `rylan.jpg`     | Rylan Zhang           |
| `temujin.jpg`   | Temujin Battulga      |
| `william.jpg`   | William Tao           |

## After adding photos, run this

```bash
npm run photos
```

Phone photos and screenshots arrive as multi-megabyte files — the first batch
totalled **16.7 MB**, which is a miserable load for a page that displays them
at about 260px wide. `npm run photos` resizes everything to a sensible ceiling
and rewrites it as real JPEG. That batch came out at **442 KB**, a 38x saving,
with no visible difference. It is safe to re-run and never upscales a small
source.

Notes:

* `.jpg` extension exactly (lowercase). A `.jpeg` or `.png` will not be found.
  (A PNG *named* `.jpg` does work in browsers, and `npm run photos` converts
  it to a real JPEG anyway.)
* Portrait orientation, roughly 4:5. Anything from 600×750 up is plenty;
  the optimiser caps at 900×1200.
* The crop focus per person is set by `photoPosition` in `src/data/staff.ts`
  (e.g. `'50% 20%'` keeps the face near the top of the frame). Adjust there
  if someone's crop looks off.
