import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  alt: string;
  className?: string;
}

export default function EventImageGallery({ images, alt, className = '' }: Props) {
  const [index, setIndex] = useState(0);
  if (!images.length) return null;

  const current = images[Math.min(index, images.length - 1)];

  return (
    <div className={`relative h-48 sm:h-56 w-full overflow-hidden bg-kado-dark/5 ${className}`}>
      <img
        src={current}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/45'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
