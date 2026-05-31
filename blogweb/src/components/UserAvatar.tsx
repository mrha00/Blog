import React from 'react';
import { resolveAssetUrl } from '../api';
import { getDisplayName } from '../utils/displayName';
import { User } from '../types';

type UserAvatarProps = {
  user?: Pick<User, 'nickname' | 'username' | 'avatarUrl'> | null;
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-20 h-20 text-2xl',
};

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export default function UserAvatar({
  user,
  avatarUrl,
  name,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const displayName = name || (user ? getDisplayName(user) : '用户');
  const src = resolveAssetUrl(avatarUrl ?? user?.avatarUrl);
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <img
        src={src}
        alt={displayName}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover border border-gray-200 shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200 shrink-0 ${sizeClass} ${className}`}
      aria-hidden
    >
      {getInitial(displayName)}
    </span>
  );
}
