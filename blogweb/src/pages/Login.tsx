import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAndResolveUser } from '../api';
import { Lock, User, AlertCircle, RefreshCcw, BookOpen, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorStatus('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    try {
      const { token, refreshToken, user } = await loginAndResolveUser(username.trim(), password.trim());
      login(token, user, refreshToken);
      navigate('/');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      setErrorStatus(`登录失败: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-10 text-white md:flex">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <BookOpen className="h-4 w-4" />
              BlogWeb
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight">欢迎回来</h2>
            <p className="mt-3 text-sm leading-relaxed text-blue-100">
              登录后继续写作、管理草稿、参与评论，或与管理员一起维护分类标签。
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              演示账号
            </div>
            <p className="mt-2 text-xs text-blue-100">admin / alice / bob · 密码 123456</p>
          </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 text-center md:text-left">
            <h2 className="font-display text-2xl font-bold text-gray-900">账号登录</h2>
            <p className="mt-1 text-sm text-gray-500">输入用户名与密码进入 BlogWeb</p>
          </div>

          {errorStatus && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{errorStatus}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
                用户名
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <User className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="请输入用户名"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm text-gray-800 focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
                密码
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Lock className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm text-gray-800 focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-700 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  正在验证…
                </span>
              ) : (
                '确定登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            还没有账号？
            <Link to="/register" className="ml-1 font-semibold text-blue-700 hover:underline">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
