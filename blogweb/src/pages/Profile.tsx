import React, { useRef, useState } from 'react';
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
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, User as UserIcon } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
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
      updateUser({
        nickname: updated.nickname,
        avatarUrl: updated.avatarUrl,
      });
      setProfileMessage('头像已更新');
    } catch (err) {
      setProfileError(getApiError(err, '头像上传失败'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setProfileError('昵称至少 2 个字符');
      return;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await updateProfile({ nickname: nickname.trim() });
      updateUser({
        nickname: updated.nickname,
        avatarUrl: updated.avatarUrl,
      });
      setProfileMessage('资料已保存');
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
      setPasswordMessage('密码已修改');
    } catch (err) {
      setPasswordError(getApiError(err, '修改密码失败'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-10 flex-grow w-full">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 font-semibold mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回首页</span>
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h1 className="text-xl font-bold text-gray-900">个人资料</h1>
          <p className="text-sm text-gray-500 mt-1">管理头像、昵称与登录密码</p>
        </div>

        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-800 mb-4">头像</h2>
            <div className="flex items-center gap-4">
              <UserAvatar
                user={{ ...user, nickname, avatarUrl }}
                size="lg"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-sm bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
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
            </div>
            <p className="text-xs text-gray-400 mt-3">支持 JPG / JPEG / PNG，与文章封面共用上传接口。</p>
          </section>

          <form onSubmit={handleProfileSubmit} className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-gray-800">基本信息</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">用户名</label>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                <UserIcon className="w-4 h-4" />
                <span>{user.username}</span>
              </div>
            </div>
            <div>
              <label htmlFor="profile-nickname" className="block text-xs font-medium text-gray-600 mb-1.5">
                昵称
              </label>
              <input
                id="profile-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={getDisplayName(user)}
                className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>

            {profileError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}
            {profileMessage && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{profileMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
            >
              {profileSaving ? '保存中…' : '保存资料'}
            </button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t border-gray-100 pt-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">修改密码</h2>
              <p className="text-xs text-gray-500 mt-1">
                修改后需使用新密码重新登录。新密码至少 6 个字符，且不能与当前密码相同。
              </p>
            </div>

            <PasswordField
              id="current-password"
              label="当前密码"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="请输入当前登录密码"
              autoComplete="current-password"
              disabled={passwordSaving}
            />
            <PasswordField
              id="new-password"
              label="新密码"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="至少 6 个字符"
              autoComplete="new-password"
              disabled={passwordSaving}
            />
            <PasswordField
              id="confirm-password"
              label="确认新密码"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="再次输入新密码"
              autoComplete="new-password"
              disabled={passwordSaving}
            />

            {passwordError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordMessage && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{passwordMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer"
            >
              {passwordSaving ? '提交中…' : '更新密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
