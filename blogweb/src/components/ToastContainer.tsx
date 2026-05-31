import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const styles: Record<ToastType, { bar: string; icon: React.ReactNode }> = {
  success: {
    bar: 'border-green-200 bg-green-50 text-green-800',
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />,
  },
  error: {
    bar: 'border-red-200 bg-red-50 text-red-800',
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />,
  },
  info: {
    bar: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: <Info className="w-4 h-4 shrink-0 text-blue-600" />,
  },
};

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const style = styles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm ${style.bar}`}
            role="alert"
          >
            {style.icon}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
