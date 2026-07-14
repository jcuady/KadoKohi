import { useEffect, useId, useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveDisplayImageUrl } from '../../lib/toWebpSrc';
import { useLandingCmsEditOptional } from '../../contexts/LandingCmsEditContext';

type Props = {
  cmsField?: string;
  cmsLabel?: string;
  src: string;
  alt: string;
  className?: string;
  onImageChange?: (url: string) => void;
};

export default function CmsEditableImage({
  cmsField,
  cmsLabel,
  src,
  alt,
  className,
  onImageChange,
}: Props) {
  const ctx = useLandingCmsEditOptional();
  const inputId = useId();
  const onImageChangeRef = useRef(onImageChange);
  onImageChangeRef.current = onImageChange;

  const editable = Boolean(cmsField && ctx?.editing && onImageChange);
  const registerField = ctx?.registerField;
  const unregisterField = ctx?.unregisterField;

  useEffect(() => {
    if (!editable || !cmsField || !registerField || !unregisterField) return;
    const onChange = (url: string) => onImageChangeRef.current?.(url);
    registerField(cmsField, {
      type: 'image',
      label: cmsLabel ?? cmsField,
      value: src,
      onChange,
    });
    return () => unregisterField(cmsField);
  }, [editable, cmsField, cmsLabel, src, registerField, unregisterField]);

  const active = editable && ctx?.activeFieldId === cmsField;
  const fieldLabel = cmsLabel ?? cmsField ?? alt;

  const openPicker = () => {
    if (!cmsField || !ctx) return;
    ctx.setActiveFieldId(cmsField);
    document.getElementById(inputId)?.click();
  };

  const displaySrc = resolveDisplayImageUrl(src) || src;

  if (!editable) {
    return (
      <img
        src={displaySrc}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (displaySrc !== src) e.currentTarget.src = src;
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={openPicker}
      className={cn(
        'group relative block overflow-hidden text-left',
        active ? 'ring-2 ring-amber-400 ring-offset-2' : 'hover:ring-2 hover:ring-amber-400/70 hover:ring-offset-1',
        className,
      )}
      aria-label={`Edit image: ${fieldLabel}`}
    >
      <img
        src={displaySrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (displaySrc !== src) e.currentTarget.src = src;
        }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
        <span className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ImagePlus className="h-3.5 w-3.5" />
          Change image
        </span>
      </span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && cmsField) void ctx.onPickImage(cmsField, file);
          e.target.value = '';
        }}
      />
    </button>
  );
}
