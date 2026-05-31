import { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { PenLine, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

gsap.registerPlugin(useGSAP);

interface HomeHeroProps {
  totalArticles: number;
  categoryCount: number;
  tagCount: number;
}

export default function HomeHero({ totalArticles, categoryCount, tagCount }: HomeHeroProps) {
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative mb-5 overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-4 py-4 text-white shadow-md shadow-blue-900/10 md:px-6 md:py-5 dark:border-blue-900/50 dark:from-blue-900 dark:via-slate-900 dark:to-indigo-950 dark:shadow-black/30"
    >
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            <span>技术博客 · 读写与分享</span>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">
            发现值得阅读的观点与笔记
          </h1>
          <p className="mt-1 hidden text-xs leading-relaxed text-blue-100 sm:block">
            浏览精选文章、按分类标签筛选，或登录后开始写作。
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-blue-100/90">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {totalArticles} 篇文章
            </span>
            <span>{categoryCount} 个分类</span>
            <span>{tagCount} 个标签</span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {user ? (
            <Link
              to="/editor"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              <PenLine className="h-3.5 w-3.5" />
              开始写作
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                免费注册
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/20"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
