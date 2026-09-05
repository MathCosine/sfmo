type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  'aria-hidden': true as const,
  focusable: 'false' as const,
});

export function DiscordIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M19.54 5.34A16.1 16.1 0 0 0 15.55 4.1a.06.06 0 0 0-.06.03c-.17.3-.36.7-.5 1.01a14.9 14.9 0 0 0-4.48 0c-.14-.32-.34-.71-.51-1.01a.06.06 0 0 0-.06-.03A16 16 0 0 0 5.95 5.34a.06.06 0 0 0-.03.02C3.4 9.13 2.71 12.8 3.05 16.42a.07.07 0 0 0 .03.05 16.2 16.2 0 0 0 4.88 2.47.06.06 0 0 0 .07-.02c.38-.51.71-1.05.99-1.62a.06.06 0 0 0-.03-.09c-.53-.2-1.03-.44-1.51-.72a.06.06 0 0 1 0-.1l.3-.24a.06.06 0 0 1 .06 0 11.6 11.6 0 0 0 9.83 0 .06.06 0 0 1 .07 0l.3.24a.06.06 0 0 1 0 .1c-.49.29-.99.53-1.52.72a.06.06 0 0 0-.03.09c.29.57.62 1.11.99 1.62a.06.06 0 0 0 .07.02 16.1 16.1 0 0 0 4.89-2.47.06.06 0 0 0 .02-.05c.4-4.18-.67-7.82-2.86-11.06a.05.05 0 0 0-.03-.02ZM9.68 14.22c-.96 0-1.76-.88-1.76-1.97s.78-1.98 1.76-1.98c.99 0 1.78.9 1.76 1.98 0 1.09-.78 1.97-1.76 1.97Zm6.5 0c-.96 0-1.75-.88-1.75-1.97s.78-1.98 1.76-1.98c.99 0 1.78.9 1.76 1.98 0 1.09-.77 1.97-1.76 1.97Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sun / moon toggle drawn on a pixel grid to match the display type. */
export function ThemeIcon({ dark, size = 18 }: { dark: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {dark ? (
        <path d="M9 2h4v1h-2v1h-1v3h1v1h2v1h-1v1h-2v1H6v-1H4v-1H3V9h1V6h1V4h1V3h2V2h1Z" />
      ) : (
        <>
          <rect x="7" y="1" width="2" height="2" />
          <rect x="7" y="13" width="2" height="2" />
          <rect x="1" y="7" width="2" height="2" />
          <rect x="13" y="7" width="2" height="2" />
          <rect x="3" y="3" width="2" height="2" />
          <rect x="11" y="3" width="2" height="2" />
          <rect x="3" y="11" width="2" height="2" />
          <rect x="11" y="11" width="2" height="2" />
          <rect x="6" y="5" width="4" height="6" />
          <rect x="5" y="6" width="6" height="4" />
        </>
      )}
    </svg>
  );
}

export function MenuIcon({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      {open ? (
        <path d="M3 4h2v2H3V4Zm8 0h2v2h-2V4ZM5 6h2v2H5V6Zm4 0h2v2H9V6ZM7 8h2v2H7V8Zm-2 2h2v2H5v-2Zm4 0h2v2H9v-2Zm-6 2h2v2H3v-2Zm8 0h2v2h-2v-2Z" />
      ) : (
        <>
          <rect x="2" y="3" width="12" height="2" />
          <rect x="2" y="7" width="12" height="2" />
          <rect x="2" y="11" width="12" height="2" />
        </>
      )}
    </svg>
  );
}

export function ArrowIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      <rect x="2" y="7" width="9" height="2" />
      <rect x="8" y="4" width="2" height="2" />
      <rect x="10" y="6" width="2" height="4" />
      <rect x="8" y="10" width="2" height="2" />
    </svg>
  );
}

export function ExternalIcon({ size = 13 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      fill="currentColor"
    >
      <rect x="9" y="2" width="5" height="2" />
      <rect x="12" y="2" width="2" height="5" />
      <rect x="8" y="6" width="2" height="2" />
      <rect x="10" y="4" width="2" height="2" />
      <rect x="2" y="4" width="6" height="2" />
      <rect x="2" y="4" width="2" height="10" />
      <rect x="2" y="12" width="10" height="2" />
      <rect x="10" y="9" width="2" height="5" />
    </svg>
  );
}
