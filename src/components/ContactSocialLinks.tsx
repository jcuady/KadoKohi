import { Instagram, Facebook } from 'lucide-react';
import TikTokIcon from './icons/TikTokIcon';
import { useSettingsStore } from '../store/settingsStore';
import { cn } from '../lib/utils';

type Props = {
  className?: string;
  iconClassName?: string;
  buttonClassName?: string;
};

export default function ContactSocialLinks({ className, iconClassName, buttonClassName }: Props) {
  const social = useSettingsStore((s) => s.settings);

  const links = [
    { key: 'instagram', href: social.socialInstagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: social.socialFacebook, label: 'Facebook', Icon: Facebook },
    { key: 'tiktok', href: social.socialTiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((l) => l.href?.trim());

  if (links.length === 0) return null;

  return (
    <div className={cn('flex gap-2', className)}>
      {links.map(({ key, href, label, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'min-h-11 min-w-11 w-11 h-11 bg-white border border-kado-dark/10 text-kado-dark rounded-full flex items-center justify-center hover:bg-kado-red hover:text-white hover:border-kado-red transition-all shadow-sm touch-manipulation',
            buttonClassName,
          )}
          aria-label={label}
        >
          <Icon className={cn('w-4 h-4', iconClassName)} />
        </a>
      ))}
    </div>
  );
}

/** Footer variant — icon-only links on dark background. */
export function FooterSocialLinks({ className }: { className?: string }) {
  const social = useSettingsStore((s) => s.settings);

  const links = [
    { key: 'instagram', href: social.socialInstagram, label: 'Instagram', Icon: Instagram },
    { key: 'facebook', href: social.socialFacebook, label: 'Facebook', Icon: Facebook },
    { key: 'tiktok', href: social.socialTiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((l) => l.href?.trim());

  if (links.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {links.map(({ key, href, label, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-kado-cream/80 transition-colors hover:bg-white/10 hover:text-kado-red touch-manipulation"
          aria-label={label}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </a>
      ))}
    </div>
  );
}
