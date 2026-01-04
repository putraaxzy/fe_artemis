/**
 * useLazyRender Hook
 * Renders component only when it's visible in viewport
 */

import { useEffect, useRef, useState, useCallback } from "react";

interface UseLazyRenderOptions {
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Whether to unrender when out of view */
  unrenderOnHide?: boolean;
  /** Delay before rendering (ms) */
  delay?: number;
}

interface UseLazyRenderReturn {
  /** Ref to attach to the container element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Whether the component should be rendered */
  shouldRender: boolean;
  /** Whether the element is currently visible */
  isVisible: boolean;
}

export function useLazyRender(options: UseLazyRenderOptions = {}): UseLazyRenderReturn {
  const {
    rootMargin = "100px",
    threshold = 0,
    unrenderOnHide = false,
    delay = 0,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible) {
          if (delay > 0) {
            const timer = setTimeout(() => setShouldRender(true), delay);
            return () => clearTimeout(timer);
          } else {
            setShouldRender(true);
          }
        } else if (unrenderOnHide) {
          setShouldRender(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, unrenderOnHide, delay]);

  return { ref, shouldRender, isVisible };
}

/**
 * useVirtualList Hook
 * For rendering large lists efficiently
 */
interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
}

interface UseVirtualListReturn<T> {
  virtualItems: { item: T; index: number; style: React.CSSProperties }[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 3,
}: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
    };

    handleResize();
    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      item: items[i],
      index: i,
      style: {
        position: "absolute" as const,
        top: i * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      },
    });
  }

  return { virtualItems, totalHeight, containerRef };
}

/**
 * useDeferredRender Hook
 * Defers rendering of heavy components
 */
export function useDeferredRender(delay: number = 0): boolean {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;

    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender;
}

/**
 * useChunkedRender Hook
 * Renders items in chunks to prevent blocking
 */
export function useChunkedRender<T>(
  items: T[],
  chunkSize: number = 10,
  delay: number = 16
): T[] {
  const [renderedCount, setRenderedCount] = useState(chunkSize);

  useEffect(() => {
    if (renderedCount >= items.length) return;

    const timer = setTimeout(() => {
      setRenderedCount((prev) => Math.min(prev + chunkSize, items.length));
    }, delay);

    return () => clearTimeout(timer);
  }, [renderedCount, items.length, chunkSize, delay]);

  // Reset when items change
  useEffect(() => {
    setRenderedCount(chunkSize);
  }, [items, chunkSize]);

  return items.slice(0, renderedCount);
}
