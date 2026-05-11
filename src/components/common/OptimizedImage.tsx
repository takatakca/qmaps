import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getImageLoadingStrategy, getImageFetchPriority } from "@/lib/performance";

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  priority?: boolean;
  index?: number;
  aspectRatio?: string; // e.g. "16/9", "1/1"
  containerClassName?: string;
}

const DEFAULT_FALLBACK = "/placeholder.svg";

const OptimizedImage = ({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  priority = false,
  index = 0,
  aspectRatio,
  className,
  containerClassName,
  ...rest
}: OptimizedImageProps) => {
  const [errored, setErrored] = useState(false);
  const finalSrc = errored || !src ? fallbackSrc : src;
  const loading = priority ? "eager" : getImageLoadingStrategy(index);
  const fetchPriority = priority ? "high" : getImageFetchPriority(index);

  const img = (
    <img
      src={finalSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      // @ts-expect-error fetchpriority not yet in React types
      fetchpriority={fetchPriority}
      onError={() => setErrored(true)}
      className={cn("block w-full h-full object-cover", className)}
      {...rest}
    />
  );

  if (aspectRatio) {
    return (
      <div
        className={cn("relative overflow-hidden bg-muted", containerClassName)}
        style={{ aspectRatio }}
      >
        {img}
      </div>
    );
  }
  return img;
};

export default OptimizedImage;
