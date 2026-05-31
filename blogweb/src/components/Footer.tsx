import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      id="footer"
      className="mt-auto w-full border-t border-gray-200 bg-white/90 text-xs text-gray-500 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-400"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-3 sm:flex-row">
        <span className="text-gray-400 dark:text-slate-500">
          © {new Date().getFullYear()} BlogWeb
        </span>

        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <Link to="/" className="px-2 py-1 transition hover:text-blue-700 dark:hover:text-blue-400">
            首页
          </Link>
          <span className="text-gray-300 dark:text-slate-600">·</span>
          <Link to="/login" className="px-2 py-1 transition hover:text-blue-700 dark:hover:text-blue-400">
            登录
          </Link>
          <span className="text-gray-300 dark:text-slate-600">·</span>
          <Link to="/register" className="px-2 py-1 transition hover:text-blue-700 dark:hover:text-blue-400">
            注册
          </Link>
          <span className="text-gray-300 dark:text-slate-600">·</span>
          <Link to="/editor" className="px-2 py-1 transition hover:text-blue-700 dark:hover:text-blue-400">
            写文章
          </Link>
          <span className="text-gray-300 dark:text-slate-600">·</span>
          <Link to="/settings" className="px-2 py-1 transition hover:text-blue-700 dark:hover:text-blue-400">
            设置
          </Link>
        </nav>

        <a
          href="https://github.com/mrha00/Blog"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-blue-700 dark:hover:text-blue-400"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>
    </footer>
  );
}
