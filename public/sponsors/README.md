# Sponsor logos

Sponsors render as typeset plates until a logo file exists here. To use a
logo, drop the file in this folder and add its filename to the sponsor entry
in `src/data/archive.ts`:

```ts
sponsors: [
  { name: 'AwesomeMath', logo: 'awesomemath.png', url: 'https://www.awesomemath.org/' },
]
```

Guidelines:

* PNG or SVG with a **transparent background** works best — the plates are a
  warm off-white in light mode and a dark blue in dark mode, so a baked-in
  white box will show as a rectangle in dark mode.
* Roughly 3:1 landscape, at least 240px wide. Logos are capped at 40px tall.
* If a file is named but missing or fails to load, the plate quietly falls
  back to the sponsor's name, so a typo never breaks the page.
