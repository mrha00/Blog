import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled = false,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-lg px-3 transition-all">
        <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full text-sm py-2.5 text-gray-800 bg-transparent focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="ml-2 shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer disabled:opacity-60"
          aria-label={visible ? '隐藏密码' : '显示密码'}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}
