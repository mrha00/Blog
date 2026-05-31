import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Plus, LogOut, Tags, Folder, BookOpen, Settings } from 'lucide-react';
import { getDisplayName } from '../utils/displayName';
import UserAvatar from './UserAvatar';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header id="top-nav-bar" className="bg-white w-full top-0 border-b border-gray-200 sticky z-50 shadow-sm">
      <div className="flex justify-between items-center h-16 max-w-[800px] mx-auto px-6 md:px-0">
        {/* Brand */}
        <Link to="/" className="text-xl font-extrabold text-blue-700 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          BlogWeb
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className={`font-medium py-1 transition-colors ${
              isActive('/')
                ? 'text-blue-700 font-bold border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-blue-700 border-b-2 border-transparent'
            }`}
          >
            首页
          </Link>

          {!user ? (
            <>
              <Link
                to="/login"
                className={`font-medium py-1 transition-colors ${
                  isActive('/login')
                    ? 'text-blue-700 font-bold border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-blue-700 border-b-2 border-transparent'
                }`}
              >
                登录
              </Link>
              <Link
                to="/register"
                className={`font-medium py-1 transition-colors ${
                  isActive('/register')
                    ? 'text-blue-700 font-bold border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-blue-700 border-b-2 border-transparent'
                }`}
              >
                注册
              </Link>
            </>
          ) : (
            <>
              {/* Write Article shortcut button */}
              <Link
                to="/editor"
                className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>撰写</span>
              </Link>

              {/* Admin dropdown triggers */}
              <div className="relative">
                <button
                  id="admin-dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="flex items-center gap-1.5 text-gray-700 hover:text-blue-700 transition-colors duration-200 font-medium cursor-pointer"
                >
                  <UserAvatar user={user} size="sm" />
                  <span className="hidden sm:inline-block max-w-[100px] truncate">
                    {getDisplayName(user)}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown contents */}
                {dropdownOpen && (
                  <div
                    id="admin-dropdown-menu"
                    className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2"
                  >
                    {isAdmin && (
                      <>
                        <Link
                          to="/categories"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                        >
                          <Folder className="w-4 h-4 text-gray-400" />
                          <span>分类管理</span>
                        </Link>
                        <Link
                          to="/tags"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                        >
                          <Tags className="w-4 h-4 text-gray-400" />
                          <span>标签管理</span>
                        </Link>
                        <hr className="border-gray-100 my-1" />
                      </>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>个人资料</span>
                    </Link>
                    <hr className="border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
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
