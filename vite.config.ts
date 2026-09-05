import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Deploy target is switchable without touching code.
 *
 *   SITE_BASE  – path the site is served from. "/sfmo/" for a GitHub Pages
 *                project site, "/" once we move to sfmathopen.org.
 *   SITE_URL   – absolute origin + base, used for canonical URLs and sitemap.
 *
 * Both are set as GitHub repository variables and read by the deploy workflow.
 */
const SITE_BASE = normaliseBase(process.env.SITE_BASE ?? '/sfmo/');
const SITE_URL =
  (process.env.SITE_URL ?? `https://mathcosine.github.io${SITE_BASE}`).replace(/\/+$/, '') + '/';

function normaliseBase(value: string) {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

type RouteMeta = {
  path: string;
  title: string;
  description: string;
  priority: string;
};

/**
 * Every crawlable route. GitHub Pages only serves static files, so each of
 * these gets its own index.html — a copy of the app shell with route-specific
 * metadata. That means deep links return a real 200 with the right <title>
 * instead of relying on a 404-redirect hack, which Search Console dislikes.
 */
const ROUTES: RouteMeta[] = [
  {
    path: '',
    title: 'SFMO 2027 — San Francisco Math Open',
    description:
      'The San Francisco Math Open returns in person to San Francisco in January 2027. A free math competition for students, run by students.',
    priority: '1.0',
  },
  {
    path: 'register',
    title: 'Register — SFMO 2027',
    description:
      'Team registration for the San Francisco Math Open 2027. Teams of up to four. Registration opens October 24, 2026.',
    priority: '0.9',
  },
  {
    path: 'about',
    title: 'About — San Francisco Math Initiative',
    description:
      'Our mission, our team, and the community of problem solvers from ten countries who have joined our contests.',
    priority: '0.8',
  },
  {
    path: 'initiatives',
    title: 'Initiatives — MathCloud & San Francisco Math Academy',
    description:
      'MathCloud, our competition testing platform, and San Francisco Math Academy: free AMC 8 summer camp and 1-on-1 tutoring.',
    priority: '0.7',
  },
  {
    path: 'archive',
    title: 'Archive — Past Contests & Resources',
    description:
      'SFPO 2026, SFM3 2026 and SFMO 2026 recaps, past problem sets, and recommended training resources.',
    priority: '0.7',
  },
  {
    path: 'team',
    title: 'Team — San Francisco Math Initiative',
    description:
      'The organizers, problem writers, and volunteers behind the San Francisco Math Initiative.',
    priority: '0.6',
  },
];

/** Emits per-route HTML, robots.txt and sitemap.xml for the deployed origin. */
function staticSiteFiles(): Plugin {
  return {
    name: 'sfmo-static-site-files',
    apply: 'build',

    /**
     * Preload the display face. It is tiny and it is the most jarring thing to
     * swap in late, so it is worth a hint. Discovered from disk rather than
     * hard-coded, since the filename carries a content hash.
     */
    transformIndexHtml(html) {
      const display = readdirSync(resolve('public/fonts')).find((file) =>
        /^silkscreen-latin-[0-9a-f]+\.woff2$/.test(file),
      );
      if (!display) return html;
      return html.replace(
        '</head>',
        `  <link rel="preload" href="${SITE_BASE}fonts/${display}" as="font" type="font/woff2" crossorigin />\n  </head>`,
      );
    },

    writeBundle(options) {
      const outDir = options.dir ?? resolve(process.cwd(), 'dist');
      const shell = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      const today = new Date().toISOString().slice(0, 10);

      for (const route of ROUTES) {
        const canonical = `${SITE_URL}${route.path}`;
        const html = shell
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`)
          .replace(
            /(<meta name="description" content=")[\s\S]*?(")/,
            `$1${escapeAttr(route.description)}$2`,
          )
          .replace(/(<meta property="og:title" content=")[\s\S]*?(")/, `$1${escapeAttr(route.title)}$2`)
          .replace(
            /(<meta property="og:description" content=")[\s\S]*?(")/,
            `$1${escapeAttr(route.description)}$2`,
          )
          .replace(/(<link rel="canonical" href=")[\s\S]*?(")/, `$1${canonical}$2`)
          .replace(/(<meta property="og:url" content=")[\s\S]*?(")/, `$1${canonical}$2`);

        const target =
          route.path === ''
            ? resolve(outDir, 'index.html')
            : resolve(outDir, route.path, 'index.html');
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, html);
      }

      // Unknown URLs: the shell boots and the router renders our 404 page.
      writeFileSync(
        resolve(outDir, '404.html'),
        shell.replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found — SFMO</title>'),
      );

      const urls = ROUTES.map(
        (route) =>
          `  <url>\n    <loc>${SITE_URL}${route.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${route.priority}</priority>\n  </url>`,
      ).join('\n');
      writeFileSync(
        resolve(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
      writeFileSync(
        resolve(outDir, 'robots.txt'),
        `User-agent: *\nAllow: /\nDisallow: ${SITE_BASE}staff\n\nSitemap: ${SITE_URL}sitemap.xml\n`,
      );
      // Pages would otherwise run the output through Jekyll and drop _-prefixed files.
      writeFileSync(resolve(outDir, '.nojekyll'), '');
    },
  };
}

function escapeAttr(value: string) {
  return value.replace(/"/g, '&quot;');
}

export default defineConfig({
  base: SITE_BASE,
  plugins: [react(), staticSiteFiles()],
  define: {
    __SITE_URL__: JSON.stringify(SITE_URL),
  },
  build: {
    outDir: 'dist',
    // Keeps the Actions build cheap: no source maps shipped to Pages.
    sourcemap: false,
  },
});
