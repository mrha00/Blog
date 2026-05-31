import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollRowProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
}

export default function HorizontalScrollRow({
  children,
  className = '',
  scrollStep = 220,
}: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -scrollStep : scrollStep,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative min-w-0">
      {canScrollLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-10 bg-gradient-to-r from-white to-transparent md:block dark:from-slate-900"
        />
      )}
      {canScrollRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-12 bg-gradient-to-l from-white to-transparent md:block dark:from-slate-900"
        />
      )}

      {canScrollLeft && (
        <button
          type="button"
          aria-label="向左滚动"
          onClick={() => scrollBy('left')}
          className="absolute left-0 top-1/2 z-[2] hidden h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 md:flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="向右滚动"
          onClick={() => scrollBy('right')}
          className="absolute right-0 top-1/2 z-[2] hidden h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 md:flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:text-blue-400"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        className={`flex gap-2 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>
    </div>
  );
}
