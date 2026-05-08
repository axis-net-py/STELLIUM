import { clsx, type ClsxValue } from 'clsx';

export function cn(...inputs: ClsxValue[]) {
  return clsx(inputs);
}
