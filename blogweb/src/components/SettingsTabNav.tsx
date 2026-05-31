import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Info, Shield, User as UserIcon } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export type SettingsTab = 'general' | 'security' | 'about';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: '常规', icon: UserIcon },
  { id: 'security', label: '账号安全', icon: Shield },
  { id: 'about', label: '关于', icon: Info },
];

interface SettingsTabNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

function moveIndicator(
  nav: HTMLElement,
  btn: HTMLElement,
  indicator: HTMLElement,
  animate: boolean
) {
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();

  const props = {
    top: btnRect.top - navRect.top + nav.scrollTop,
    left: btnRect.left - navRect.left + nav.scrollLeft,
    width: btnRect.width,
    height: btnRect.height,
  };

  if (animate) {
    gsap.to(indicator, {
      ...props,
      duration: 0.28,
      ease: 'power2.out',
    });
  } else {
    gsap.set(indicator, props);
  }
}

export default function SettingsTabNav({ active, onChange }: SettingsTabNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const didMountRef = useRef(false);

  const syncIndicator = (animate: boolean) => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const index = TABS.findIndex((t) => t.id === active);
    const btn = buttonRefs.current[index];
    if (!btn) return;

    moveIndicator(nav, btn, indicator, animate);
  };

  useGSAP(
    () => {
      syncIndicator(didMountRef.current);
      didMountRef.current = true;
    },
    { scope: navRef, dependencies: [active] }
  );

  useGSAP(
    () => {
      const nav = navRef.current;
      if (!nav) return;

      const handleResize = () => syncIndicator(false);
      const observer = new ResizeObserver(handleResize);
      observer.observe(nav);
      window.addEventListener('resize', handleResize);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    },
    { scope: navRef }
  );

  return (
    <nav
      ref={navRef}
      className="relative flex shrink-0 gap-1 self-start overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/80 p-1 md:w-44 md:flex-col md:overflow-visible"
    >
      <div
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute z-0 rounded-lg bg-blue-700 will-change-transform"
      />

      {TABS.map(({ id, label, icon: Icon }, index) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            onClick={() => onChange(id)}
            className={`relative z-10 flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-gray-600 hover:text-blue-700'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
