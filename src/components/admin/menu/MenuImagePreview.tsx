import { useEffect, useState } from 'react';

export default function MenuImagePreview({
  src,
  label,
  emphasize = false,
}: {
  src: string;
  label: string;
  emphasize?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={[
        'rounded-xl border p-2.5',
        emphasize ? 'border-kado-red/30 bg-kado-red/5' : 'dash-border',
      ].join(' ')}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider dash-muted">{label}</p>
      {failed ? (
        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          Could not load this preview. Use a direct image link (https://…jpg) or upload a file. Google Drive files must
          be shared as &quot;Anyone with the link&quot;.
        </p>
      ) : (
        <img
          src={src}
          alt=""
          className="h-32 w-full rounded-lg border dash-border object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
