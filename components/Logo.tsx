export function Logo({ href, name }: { href: string; name: string }) {
  return (
    <a className="logo" href={href}>
      <svg viewBox="0 0 40 44" width="28" height="31" aria-hidden="true">
        <path
          d="M20 4 L29 18 L24 18 L31 29 L25 29 L33 40 L7 40 L15 29 L9 29 L16 18 L11 18 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="3" r="1.6" fill="currentColor" />
        <circle cx="17" cy="25" r="1.1" fill="currentColor" />
        <circle cx="23" cy="31" r="1.1" fill="currentColor" />
        <rect x="18" y="40" width="4" height="3" fill="currentColor" />
      </svg>
      <span>{name}</span>
    </a>
  );
}

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
