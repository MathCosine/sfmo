/// <reference types="vite/client" />

/** Absolute site URL, defined by vite.config.ts at build time. */
declare const __SITE_URL__: string;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
