import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * LazyImage component with native lazy loading and blur placeholder effect.
 * Uses Intersection Observer for better performance.
 */
export const LazyImage = ({
  src,
  alt,
  className,
  placeholderClassName,
  width,
  height,
  priority = false,
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        placeholderClassName
      )}
      style={{ width, height }}
    >
      {/* Placeholder gradient */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse",
            placeholderClassName
          )}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
};

export default LazyImage;
