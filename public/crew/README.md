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

Notes:

* `.jpg` extension exactly (lowercase). A `.jpeg` or `.png` will not be found.
* Portrait orientation, roughly 4:5. Anything from 600×750 up is plenty;
  larger than ~1600px wide is wasted bytes.
* The crop focus per person is set by `photoPosition` in `src/data/staff.ts`
  (e.g. `'50% 20%'` keeps the face near the top of the frame). Adjust there
  if someone's crop looks off.
