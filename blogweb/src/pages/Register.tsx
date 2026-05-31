import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAndResolveUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, RefreshCcw, CheckCircle } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessMsg(null);

    // Basic Validations
    if (!username.trim() || !nickname.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorStatus('所有输入框均为必填项');
      return;
    }

    if (nickname.trim().length < 2) {
      setErrorStatus('昵称长度不能少于 2 个字符');
      return;
    }

    if (username.length < 3) {
      setErrorStatus('用户名长度不能少于 3 个字符');
      return;
    }

    if (!email.includes('@')) {
      setErrorStatus('请输入有效的电子邮件地址');
      return;
    }

    if (password.length < 6) {
      setErrorStatus('密码长度不能少于 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      setErrorStatus('两次输入的密码不一致，请重新检查');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await registerAndResolveUser(
        username.trim(),
        email.trim(),
        password,
        nickname.trim()
      );
      login(token, user);
      navigate('/');
    } catch (err: any) {
      console.error('Registration processing failed:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setErrorStatus(`注册失败: ${errMsg}. 请核实该用户名或邮箱是否未被占用。`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12 flex justify-center items-center flex-1 w-full">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2 font-sans">加入 BlogWeb</h2>
          <p className="text-gray-500 text-sm">创建属于您自己的写作者或读者账号</p>
        </div>

        {errorStatus && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-xs flex gap-2 mb-6 items-start leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorStatus}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex gap-2 mb-6 items-start leading-relaxed animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              个性化用户名
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="例如: coding_fox"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              显示昵称
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="在评论区和文章页展示的名称"
                maxLength={30}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              电子邮箱
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              设置安全密码
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="password"
                placeholder="至少 6 个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              确认重复密码
            </label>
            <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all">
              <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="password"
                placeholder="请再次填写您的密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm cursor-pointer mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>正在注册及连接服务器...</span>
              </span>
            ) : (
              <span>注册并登录</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <span>已经有账号了？</span>
          <Link to="/login" className="text-blue-700 hover:underline ml-1 font-semibold">
            安全登录入口
          </Link>
        </div>
      </div>
    </div>
  );
}
