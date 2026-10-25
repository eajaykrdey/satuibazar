import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  zoomOnHover?: boolean;
}

export function ProductImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  zoomOnHover = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-[#F2F0EA] ${containerClassName}`}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-transform duration-200 ease-out ${
            zoomOnHover ? 'group-hover:scale-105' : ''
          } ${className}`}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F3F1EB] to-[#E5E2D9] p-6 text-center text-slate-600"
        >
          <Package className="h-8 w-8 text-emerald-800/70" aria-hidden="true" />
          <span className="max-w-[18ch] text-xs font-medium leading-snug text-slate-700">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}
