import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getMe } from '../api';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isAdminRole(role?: string): boolean {
  return role === 'Admin' || role === 'admin';
}

function mapMeToUser(me: Awaited<ReturnType<typeof getMe>>): User {
  return {
    id: Number(me.userId),
    username: me.username,
    nickname: me.nickname || me.username,
    avatarUrl: me.avatarUrl,
    email: me.email,
    role: me.role,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const persistUser = useCallback((next: User | null) => {
    setUser(next);
    if (next) {
      localStorage.setItem('user', JSON.stringify(next));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    persistUser(newUser);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    persistUser(null);
    setToken(null);
  };

  const updateUser = useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    persistUser(mapMeToUser(me));
  }, [persistUser]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        persistUser(mapMeToUser(me));
      } catch {
        if (!cancelled) logout();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, persistUser]);

  const isAdmin = isAdminRole(user?.role);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
