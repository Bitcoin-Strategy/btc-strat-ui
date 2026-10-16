import type { ComponentType, SVGProps } from 'react';

import type { SocialId } from '../../lib/constants';
import { SOCIAL_LINKS } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { DiscordIcon, GitHubIcon, XIcon } from '../ui';

const ICONS: Record<SocialId, ComponentType<SVGProps<SVGSVGElement>>> = {
  x: XIcon,
  discord: DiscordIcon,
  github: GitHubIcon,
};

type Variant = 'icon' | 'panel' | 'text';

/**
 * `icon` — compact header buttons; `panel` — the sidebar block with labels;
 * `text` — plain footer links.
 */
export function SocialLinks({
  variant = 'icon',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === 'panel') {
    return (
      <div
        className={cn('border-border bg-dark rounded-lg border p-3', className)}
      >
        <div className="text-muted mb-2 text-xs">Community</div>
        <div className="flex gap-2">
          {SOCIAL_LINKS.map((link) => {
            const Icon = ICONS[link.id];
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="border-border text-muted hover:border-orange/40 flex flex-1 items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition-colors hover:text-white"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        variant === 'icon' ? 'gap-1' : 'justify-center gap-6',
        className,
      )}
    >
      {SOCIAL_LINKS.map((link) => {
        const Icon = ICONS[link.id];
        return (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            title={link.label}
            aria-label={variant === 'icon' ? link.label : undefined}
            className={cn(
              'text-muted transition-colors hover:text-white',
              variant === 'icon' && 'p-2',
            )}
          >
            {variant === 'icon' ? <Icon className="h-5 w-5" /> : link.label}
          </a>
        );
      })}
    </div>
  );
}
