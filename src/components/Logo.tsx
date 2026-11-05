import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Nexora AI">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#1d4ed8" />
        <path d="M9 23V9h3l8 10V9h3v14h-3l-8-10v10z" fill="#fff" />
      </svg>
      <span>Nexora AI</span>
    </Link>
  );
}
