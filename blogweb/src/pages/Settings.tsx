import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  changePassword,
  getApiError,
  updateProfile,
  uploadCover,
} from '../api';
import UserAvatar from '../components/UserAvatar';
import PasswordField from '../components/PasswordField';
import { getDisplayName } from '../utils/displayName';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Github,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import SettingsTabNav, { type SettingsTab } from '../components/SettingsTabNav';
import { useAnimatedTabSwitch } from '../hooks/useAnimatedTabSwitch';

function TabPanel({
  active,
  id,
  children,
}: {
  active: SettingsTab;
  id: SettingsTab;
  children: React.ReactNode;
}) {
  const isActive = active === id;
  return (
    <section
      aria-hidden={!isActive}
      className={`col-start-1 row-start-1 transition-opacity duration-200 ease-out ${
        isActive
          ? 'relative z-10 opacity-100'
          : 'pointer-events-none z-0 opacity-0'
      }`}
    >
      {children}
    </section>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<SettingsTab>('general');
  const { contentRef, changeTab } = useAnimatedTabSwitch(tab, setTab);

  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname || user.username);
    setBio(user.bio || '');
    setAvatarUrl(user.avatarUrl || '');
  }, [user?.id, user?.nickname, user?.bio, user?.avatarUrl]);

  if (!user) {
    return null;
  }

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setProfileError(null);
    try {
      const url = await uploadCover(file);
      setAvatarUrl(url);
      const updated = await updateProfile({ avatarUrl: url });
      updateUser({ nickname: updated.nickname, avatarUrl: updated.avatarUrl, bio: updated.bio });
      setProfileMessage('头像已更新');
    } catch (err) {
      setProfileError(getApiError(err, '头像上传失败'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setProfileError('昵称至少 2 个字符');
      return;
    }
    if (bio.length > 500) {
      setProfileError('个人简介不能超过 500 个字符');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
      });
      updateUser({ nickname: updated.nickname, avatarUrl: updated.avatarUrl, bio: updated.bio });
      setProfileMessage('资料已保存，将展示在你的公开主页');
    } catch (err) {
      setProfileError(getApiError(err, '保存失败'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('请填写当前密码和新密码');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('新密码至少 6 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('密码已修改，建议重新登录');
    } catch (err) {
      setPasswordError(getApiError(err, '修改密码失败'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-grow px-6 py-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        返回首页
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">设置</h1>
        <p className="mt-1 text-sm text-gray-500">管理个人资料、账号安全与应用信息</p>
      </div>

      <div className="flex flex-col items-start gap-6 md:flex-row">
        <SettingsTabNav active={tab} onChange={changeTab} />

        <div className="form-surface min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6 dark:border-slate-700 dark:bg-slate-900">
          <div ref={contentRef} className="grid [&>*]:col-start-1 [&>*]:row-start-1">
            <TabPanel active={tab} id="general">
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100">个人资料</h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      以下内容会展示在你的公开主页（昵称、头像、简介）
                    </p>
                  </div>
                  <Link
                    to={`/users/${user.id}`}
                    className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                  >
                    预览我的主页 →
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <UserAvatar user={{ ...user, nickname, avatarUrl }} size="lg" />
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    <Camera className="h-4 w-4" />
                    {avatarUploading ? '上传中…' : '更换头像'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarPick}
                  />
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4 border-t border-gray-100 pt-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">用户名</label>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      <UserIcon className="h-4 w-4" />
                      {user.username}
                      <span className="ml-auto text-[10px] text-gray-400">不可修改</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-nickname" className="mb-1.5 block text-xs font-medium text-gray-600">
                      昵称
                    </label>
                    <input
                      id="settings-nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={getDisplayName(user)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-bio" className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">
                      个人简介
                    </label>
                    <textarea
                      id="settings-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="介绍一下你自己：擅长领域、写作方向、个人网站等…"
                      className="select-text w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900"
                    />
                    <p className="mt-1 text-right text-[11px] text-gray-400 dark:text-slate-500">
                      {bio.length}/500
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-slate-400">角色</label>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{user.role === 'Admin' ? '管理员' : '普通用户'}</p>
                  </div>

                  {profileError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {profileError}
                    </div>
                  )}
                  {profileMessage && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {profileMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="cursor-pointer rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    {profileSaving ? '保存中…' : '保存更改'}
                  </button>
                </form>
              </div>
            </TabPanel>

            <TabPanel active={tab} id="security">
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">账号安全</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    修改密码后需使用新密码重新登录；新密码至少 6 位且不能与当前密码相同。
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <PasswordField
                    id="settings-current-password"
                    label="当前密码"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    placeholder="请输入当前登录密码"
                    autoComplete="current-password"
                    disabled={passwordSaving}
                  />
                  <PasswordField
                    id="settings-new-password"
                    label="新密码"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="至少 6 个字符"
                    autoComplete="new-password"
                    disabled={passwordSaving}
                  />
                  <PasswordField
                    id="settings-confirm-password"
                    label="确认新密码"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="再次输入新密码"
                    autoComplete="new-password"
                    disabled={passwordSaving}
                  />

                  {passwordError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {passwordError}
                    </div>
                  )}
                  {passwordMessage && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {passwordMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  >
                    <Lock className="h-4 w-4" />
                    {passwordSaving ? '提交中…' : '更新密码'}
                  </button>
                </form>
              </div>
            </TabPanel>

            <TabPanel active={tab} id="about">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">关于 BlogWeb</h2>
                  <p className="mt-1 text-xs text-gray-500">应用信息与开源仓库</p>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-100 py-2">
                    <dt className="text-gray-500">版本</dt>
                    <dd className="font-medium text-gray-800">1.0.0</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-2">
                    <dt className="text-gray-500">前端</dt>
                    <dd className="text-gray-700">React · Vite · Tailwind</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-2">
                    <dt className="text-gray-500">后端</dt>
                    <dd className="text-gray-700">ASP.NET Core 8 · EF Core</dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 py-2">
                    <dt className="text-gray-500">数据</dt>
                    <dd className="text-gray-700">SQLite · Redis 缓存</dd>
                  </div>
                </dl>

                <p className="text-sm leading-relaxed text-gray-600">
                  BlogWeb 是轻量技术博客全栈示例：支持 Markdown 写作、嵌套评论、分类标签、JWT 认证与封面图上传。
                </p>

                <a
                  href="https://github.com/mrha00/Blog"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
                >
                  <Github className="h-4 w-4" />
                  查看 GitHub 仓库
                </a>
              </div>
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
