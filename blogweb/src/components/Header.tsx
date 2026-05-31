import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ChevronDown, Plus, LogOut, Tags, Folder, BookOpen, Settings, Moon, Sun, UserRound } from 'lucide-react';
import { getDisplayName } from '../utils/displayName';
import UserAvatar from './UserAvatar';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      id="top-nav-bar"
      className="sticky top-0 z-50 w-full border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400"
        >
          <BookOpen className="h-5 w-5" />
          BlogWeb
        </Link>

        <nav className="flex items-center space-x-4 sm:space-x-6">
          <Link
            to="/"
            className={`border-b-2 py-1 font-medium transition-colors ${
              isActive('/')
                ? 'border-blue-700 font-bold text-blue-700 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400'
            }`}
          >
            首页
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? '切换浅色模式' : '切换深色模式'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:text-blue-400"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {!user ? (
            <>
              <Link
                to="/login"
                className={`border-b-2 py-1 font-medium transition-colors ${
                  isActive('/login')
                    ? 'border-blue-700 font-bold text-blue-700 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
              >
                登录
              </Link>
              <Link
                to="/register"
                className={`border-b-2 py-1 font-medium transition-colors ${
                  isActive('/register')
                    ? 'border-blue-700 font-bold text-blue-700 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400'
                }`}
              >
                注册
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/editor"
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
              >
                <Plus className="h-4 w-4" />
                <span>撰写</span>
              </Link>

              <div className="relative">
                <button
                  id="admin-dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="flex cursor-pointer items-center gap-1.5 font-medium text-gray-700 transition-colors duration-200 hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-400"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="hidden max-w-[100px] truncate sm:inline-block">
                    {getDisplayName(user)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    id="admin-dropdown-menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                  >
                    {isAdmin && (
                      <>
                        <Link
                          to="/categories"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Folder className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                          <span>分类管理</span>
                        </Link>
                        <Link
                          to="/tags"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Tags className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                          <span>标签管理</span>
                        </Link>
                        <hr className="my-1 border-gray-100 dark:border-slate-800" />
                      </>
                    )}
                    <Link
                      to={`/users/${user.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                      <UserRound className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                      <span>我的主页</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                      <Settings className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                      <span>编辑资料</span>
                    </Link>
                    <hr className="my-1 border-gray-100 dark:border-slate-800" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4 text-red-400" />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
