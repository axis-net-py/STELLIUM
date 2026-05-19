import { clsx, type ClsxValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClsxValue[]) {
  return twMerge(clsx(inputs));
}
