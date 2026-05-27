import { Phone } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

type Props = {
  message?: string;
  className?: string;
};

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

export default function BoothContactCallCard({ message, className = '' }: Props) {
  const phone = useSettingsStore((s) => s.settings.boothContactPhone);
  const contactName = useSettingsStore((s) => s.settings.boothContactName);

  if (!phone?.trim()) return null;

  return (
    <div
      className={`rounded-xl border border-kado-red/20 bg-kado-red/5 p-4 ${className}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-kado-red mb-2">
        Questions? Call our events team
      </p>
      {message && <p className="text-sm text-kado-dark/70 mb-3 leading-relaxed">{message}</p>}
      {contactName && (
        <p className="text-xs font-semibold text-kado-dark/55 mb-1">{contactName}</p>
      )}
      <a
        href={telHref(phone)}
        className="inline-flex items-center gap-2 rounded-xl bg-kado-dark text-kado-cream px-4 py-3 text-sm font-bold hover:bg-kado-red transition-colors"
      >
        <Phone className="w-4 h-4" />
        {phone}
      </a>
    </div>
  );
}
