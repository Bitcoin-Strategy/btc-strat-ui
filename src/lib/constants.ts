export const PAGE = {
  DASHBOARD: '/',
  BONDING: '/bonding',
  VESTING: '/vesting',
  REDEMPTION: '/redemption',
  GOVERNANCE: '/governance',
  SYSTEM_PARAMETERS: '/system-parameters',
} as const;

export const LINKS = {
  SITE: 'https://btc-strategy.org',
  X: 'https://x.com/BTCStrategyCoin',
  /** No community server yet; the footer hides links with an empty href. */
  DISCORD: '',
  GITHUB: 'https://github.com/Bitcoin-Strategy',
};

export type SocialId = 'x' | 'discord' | 'github';

const ALL_SOCIAL_LINKS: { id: SocialId; label: string; href: string }[] = [
  { id: 'x', label: 'X', href: LINKS.X },
  { id: 'discord', label: 'Discord', href: LINKS.DISCORD },
  { id: 'github', label: 'GitHub', href: LINKS.GITHUB },
];

/** Only the links that have a URL. */
export const SOCIAL_LINKS = ALL_SOCIAL_LINKS.filter(
  (link) => link.href.length > 0,
);
