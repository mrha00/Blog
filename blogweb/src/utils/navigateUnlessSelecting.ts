import type { MouseEvent } from 'react';

/** 若用户正在框选文字，或点在链接上，则不触发导航 */
export function shouldSkipCardNavigation(e: MouseEvent) {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    return true;
  }
  if ((e.target as HTMLElement).closest('a, button, input, textarea, select, label')) {
    return true;
  }
  return false;
}
