import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md text-sm font-medium transition-colors',
        variant === 'default' && 'bg-[#171717] text-[#fafafa] hover:bg-[#171717]/90',
        variant === 'outline' && 'border border-[#3ecf8e]/30 bg-transparent hover:bg-[#3ecf8e]/5',
        className
      )}
      {...props}
    />
  );
}
