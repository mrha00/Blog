import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAndResolveUser } from '../api';
import { Lock, User, AlertCircle, RefreshCcw } from 'lucide-react';

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
      console.error('Login error:', err);
      // Give details about the connection
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setErrorStatus(
        `登录失败: ${errMsg}. 请确认后端服务在 6133 端口已正常启动，且用户凭证正确。`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-16 flex justify-center items-center flex-1 w-full">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">欢迎回来</h2>
          <p className="text-gray-500 text-sm">请输入您的用户名或邮箱进行登录</p>
        </div>

        {errorStatus && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex gap-2 mb-6 items-start leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              用户名 / 邮箱
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="键入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm py-3 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              密码
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="password"
                placeholder="填写您的安全密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm py-3 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>正在验证登录...</span>
              </span>
            ) : (
              <span>确定登录</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <span>还没有账号吗？</span>
          <Link to="/register" className="text-blue-700 hover:underline ml-1 font-semibold">
            立即免费注册
          </Link>
        </div>
      </div>
    </div>
  );
}
