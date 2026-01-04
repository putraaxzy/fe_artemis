/**
 * Lazy Components
 * Wrapper components for lazy rendering
 */

import React, { Suspense, memo } from "react";
import { useLazyRender, useChunkedRender } from "../hooks/useLazyRender";

/**
 * LazySection - Renders children only when visible in viewport
 */
interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  className?: string;
  minHeight?: string | number;
}

export const LazySection = memo(function LazySection({
  children,
  fallback,
  rootMargin = "200px",
  className = "",
  minHeight = "100px",
}: LazySectionProps) {
  const { ref, shouldRender } = useLazyRender({ rootMargin });

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: shouldRender ? undefined : minHeight }}
    >
      {shouldRender ? (
        children
      ) : (
        fallback || (
          <div className="animate-pulse bg-zinc-100 rounded-xl h-full min-h-[100px]" />
        )
      )}
    </div>
  );
});

/**
 * LazyList - Renders list items in chunks to prevent blocking
 */
interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  chunkSize?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
}

export function LazyList<T>({
  items,
  renderItem,
  keyExtractor,
  chunkSize = 10,
  className = "",
  loadingComponent,
}: LazyListProps<T>) {
  const renderedItems = useChunkedRender(items, chunkSize);
  const isFullyLoaded = renderedItems.length >= items.length;

  return (
    <div className={className}>
      {renderedItems.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      {!isFullyLoaded && (
        loadingComponent || (
          <div className="py-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
          </div>
        )
      )}
    </div>
  );
}

/**
 * LazyImage - Lazy loads images with blur placeholder
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderColor?: string;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholderColor = "#e4e4e7",
  className = "",
  ...props
}: LazyImageProps) {
  const { ref, shouldRender } = useLazyRender({ rootMargin: "100px" });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {shouldRender && !hasError ? (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{ backgroundColor: placeholderColor }}
            />
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            loading="lazy"
            {...props}
          />
        </>
      ) : hasError ? (
        <div
          className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs"
        >
          Failed to load
        </div>
      ) : (
        <div
          className="w-full h-full animate-pulse"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
    </div>
  );
});

/**
 * DeferredContent - Delays rendering to not block initial paint
 */
interface DeferredContentProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export function DeferredContent({
  children,
  delay = 100,
  fallback,
}: DeferredContentProps) {
  const [shouldRender, setShouldRender] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay === 0) return;

    // Use requestIdleCallback if available, otherwise setTimeout
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(() => setShouldRender(true), {
        timeout: delay,
      });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</> || null;
  }

  return <>{children}</>;
}

/**
 * SkeletonPlaceholder - Generic skeleton for lazy loading
 */
interface SkeletonPlaceholderProps {
  type?: "card" | "list" | "text" | "avatar" | "button";
  className?: string;
  count?: number;
}

export function SkeletonPlaceholder({
  type = "card",
  className = "",
  count = 1,
}: SkeletonPlaceholderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = (key: number) => {
    switch (type) {
      case "card":
        return (
          <div
            key={key}
            className={`animate-pulse bg-zinc-100 rounded-xl p-4 ${className}`}
          >
            <div className="h-4 bg-zinc-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-zinc-200 rounded w-full mb-2" />
            <div className="h-3 bg-zinc-200 rounded w-2/3" />
          </div>
        );
      case "list":
        return (
          <div
            key={key}
            className={`animate-pulse flex items-center gap-3 p-3 ${className}`}
          >
            <div className="w-10 h-10 bg-zinc-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-200 rounded w-3/4" />
            </div>
          </div>
        );
      case "text":
        return (
          <div key={key} className={`animate-pulse space-y-2 ${className}`}>
            <div className="h-3 bg-zinc-200 rounded w-full" />
            <div className="h-3 bg-zinc-200 rounded w-5/6" />
            <div className="h-3 bg-zinc-200 rounded w-4/6" />
          </div>
        );
      case "avatar":
        return (
          <div
            key={key}
            className={`animate-pulse w-10 h-10 bg-zinc-200 rounded-full ${className}`}
          />
        );
      case "button":
        return (
          <div
            key={key}
            className={`animate-pulse h-10 bg-zinc-200 rounded-xl w-24 ${className}`}
          />
        );
      default:
        return (
          <div
            key={key}
            className={`animate-pulse bg-zinc-100 rounded-xl h-20 ${className}`}
          />
        );
    }
  };

  return <>{skeletons.map(renderSkeleton)}</>;
}
