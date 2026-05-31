import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react';

/** Stable tab switch — no GSAP transforms that cause layout jitter. */
export function useAnimatedTabSwitch<T extends string>(
  current: T,
  setTab: Dispatch<SetStateAction<T>>
) {
  const contentRef = useRef<HTMLDivElement>(null);

  const changeTab = useCallback(
    (next: T) => {
      if (next === current) return;
      setTab(next);
    },
    [current, setTab]
  );

  return { contentRef, changeTab };
}
