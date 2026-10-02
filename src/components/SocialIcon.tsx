// Sosyal medya bağlantıları için sade ikonlar. Platform, bağlantının adresinden (yoksa adından) anlaşılır;
// tanınmayan platformlarda genel bir bağlantı ikonu gösterilir.

type Kind = 'linkedin' | 'instagram' | 'behance' | 'dribbble' | 'x' | 'youtube' | 'vimeo' | 'github' | 'link';

export function socialKind(href: string, label = ''): Kind {
  const s = `${href} ${label}`.toLowerCase();
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('instagram')) return 'instagram';
  if (s.includes('behance')) return 'behance';
  if (s.includes('dribbble')) return 'dribbble';
  if (s.includes('twitter') || /(^|\/\/|\s)x\.com/.test(s) || /\bx\b/.test(label.toLowerCase())) return 'x';
  if (s.includes('youtube') || s.includes('youtu.be')) return 'youtube';
  if (s.includes('vimeo')) return 'vimeo';
  if (s.includes('github')) return 'github';
  return 'link';
}

export default function SocialIcon({ href, label, className = 'h-5 w-5' }: { href: string; label?: string; className?: string }) {
  const kind = socialKind(href, label);
  const common = { viewBox: '0 0 24 24', className, 'aria-hidden': true } as const;
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

  switch (kind) {
    case 'linkedin':
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="4" {...stroke} />
          <path d="M7.5 10.5v6M7.5 7.6v.01M11 16.5v-6M11 13.2c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7v3.3" {...stroke} />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5.5" {...stroke} />
          <circle cx="12" cy="12" r="4" {...stroke} />
          <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
        </svg>
      );
    case 'behance':
      return (
        <svg {...common}>
          <path d="M3 6.5h4.6a2.6 2.6 0 0 1 0 5.2H3zM3 11.7h5.2a2.9 2.9 0 0 1 0 5.8H3zM14.2 7.4h5.3" {...stroke} />
          <path d="M14 14.2h7c0-2.3-1.4-3.9-3.5-3.9s-3.6 1.7-3.6 3.6 1.5 3.6 3.6 3.6c1.4 0 2.4-.6 3-1.6" {...stroke} />
        </svg>
      );
    case 'dribbble':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" {...stroke} />
          <path d="M8.3 3.8c3.2 3.6 5.4 8.6 6.6 16.4M3.2 10.3c5 .4 10.6-.6 15-3.3M5.6 18.4c2.8-3.4 7.8-5.2 15.2-3.6" {...stroke} />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4L4 20" {...stroke} />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2.5" y="5" width="19" height="14" rx="4" {...stroke} />
          <path d="M10.2 9.2v5.6l4.8-2.8z" fill="currentColor" />
        </svg>
      );
    case 'vimeo':
      return (
        <svg {...common}>
          <path d="M3 8.5c1.6-1.4 2.8-2.3 3.6-2.3 1.6 0 1.8 2.6 2.4 5.6.5 2.4 1 3.6 1.6 3.6.8 0 2.6-2.7 3.4-4.4.8-1.6 0-2.5-1.3-1.7 1-3.4 6.4-4.2 5.9.2-.4 3.6-5.3 9.3-8.3 9.3-2.4 0-3.1-4.2-4-7.7-.4-1.6-.8-2.3-1.6-1.7" {...stroke} />
        </svg>
      );
    case 'github':
      return (
        <svg {...common}>
          <path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.4a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.4 5.6-6.1a4.7 4.7 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.6 2.4 5.6 2.7 5.6 2.7a4.4 4.4 0 0 0-.1 3.2A4.7 4.7 0 0 0 4.2 9.2c0 4.7 2.9 5.8 5.6 6.1A3 3 0 0 0 9 17.6V21" {...stroke} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" {...stroke} />
        </svg>
      );
  }
}
