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
            'w-9 h-9 bg-white border border-kado-dark/10 text-kado-dark rounded-full flex items-center justify-center hover:bg-kado-red hover:text-white hover:border-kado-red transition-all shadow-sm',
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
    <div className={cn('flex items-center gap-4', className)}>
      {links.map(({ key, href, label, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-kado-red transition-colors"
          aria-label={label}
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}
