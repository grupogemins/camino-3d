import { clsx } from 'clsx';
import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none text-center';
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-110 active:brightness-95',
  secondary: 'bg-primary-soft text-primary hover:brightness-95',
  outline: 'border-2 border-line bg-surface text-ink hover:border-primary',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110 [data-theme=contrast]_&:text-black',
};
// Áreas de toque grandes (mín. 48px) para uso durante a caminhada.
const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-12 px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...rest }: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={clsx(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = 'primary', size = 'md', icon, block, className, children, ...rest }: CommonProps & { href: string; 'aria-label'?: string; onClick?: () => void }) {
  return (
    <Link href={href} className={clsx(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
