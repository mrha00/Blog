import React from 'react';

/** 全站渐变背景：浅色为蓝紫晨曦，深色为深海霓虹 */
export default function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 主渐变底 */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: `
            linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 28%, #f5f3ff 52%, #ecfeff 78%, #f8fafc 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `
            linear-gradient(145deg, #030712 0%, #0f172a 35%, #1e1b4b 65%, #0c4a6e 100%)
          `,
        }}
      />

      {/* 光晕层 */}
      <div
        className="absolute -left-[10%] -top-[20%] h-[65vmin] w-[65vmin] animate-backdrop-float rounded-full blur-[90px] dark:hidden"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute right-[-5%] top-[15%] h-[55vmin] w-[55vmin] animate-backdrop-float-alt rounded-full blur-[85px] dark:hidden"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, transparent 72%)',
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[30%] h-[50vmin] w-[50vmin] animate-backdrop-float rounded-full blur-[80px] dark:hidden"
        style={{
          background:
            'radial-gradient(circle, rgba(34, 211, 238, 0.22) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute -left-[8%] top-[-15%] hidden h-[60vmin] w-[60vmin] animate-backdrop-float rounded-full blur-[100px] dark:block"
        style={{
          background:
            'radial-gradient(circle, rgba(37, 99, 235, 0.45) 0%, transparent 68%)',
        }}
      />
      <div
        className="absolute right-[-8%] bottom-[10%] hidden h-[55vmin] w-[55vmin] animate-backdrop-float-alt rounded-full blur-[95px] dark:block"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 hidden h-[45vmin] w-[70vmin] -translate-x-1/2 animate-backdrop-float rounded-full blur-[110px] dark:block"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 65%)',
        }}
      />

      {/* 斜向高光带 */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
        }}
      />

      {/* 极淡网格（科技感，非纸纹） */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.12) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
