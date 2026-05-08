import { cn } from '@/lib/utils';

export function Select({ children, ...props }: { children?: any; className?: string }) {
  return <select className={cn('border rounded px-3 py-2 text-sm', props.className)} {...props}>{children}</select>;
}

export function SelectContent({ children }: { children?: any }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children?: any }) {
  return <option value={value}>{children}</option>;
}

export function SelectTrigger({ children }: { children?: any }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <option value="">{placeholder}</option>;
}
