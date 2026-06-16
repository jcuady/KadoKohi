import { useEffect, useId, useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLandingCmsEditOptional } from '../../contexts/LandingCmsEditContext';

type Props = {
  cmsField?: string;
  src: string;
  alt: string;
  className?: string;
  onImageChange?: (url: string) => void;
};

export default function CmsEditableImage({ cmsField, src, alt, className, onImageChange }: Props) {
  const ctx = useLandingCmsEditOptional();
  const inputId = useId();
  const registered = useRef(false);

  const binding = cmsField && ctx?.editing ? ctx.getField(cmsField) : undefined;
  const editable = Boolean(cmsField && ctx?.editing && binding?.type === 'image');

  useEffect(() => {
    if (!cmsField || !ctx?.editing || !onImageChange) return;
    if (registered.current) return;
    registered.current = true;
    ctx.registerField(cmsField, {
      type: 'image',
      label: binding?.type === 'image' ? binding.label : cmsField,
      value: src,
      onChange: onImageChange,
    });
    return () => {
      registered.current = false;
      ctx.unregisterField(cmsField);
    };
  }, [cmsField, ctx, onImageChange, src, binding]);

  useEffect(() => {
    if (!cmsField || !ctx?.editing || !onImageChange) return;
    ctx.registerField(cmsField, {
      type: 'image',
      label: binding?.type === 'image' ? binding.label : cmsField,
      value: src,
      onChange: onImageChange,
    });
  }, [src, cmsField, ctx, onImageChange, binding]);

  const active = editable && ctx?.activeFieldId === cmsField;

  const openPicker = () => {
    if (!cmsField || !ctx) return;
    ctx.setActiveFieldId(cmsField);
    document.getElementById(inputId)?.click();
  };

  if (!editable) {
    return <img src={src} alt={alt} className={className} />;
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
      aria-label={`Edit image: ${binding?.type === 'image' ? binding.label : alt}`}
    >
      <img src={src} alt={alt} className="h-full w-full object-cover" />
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
