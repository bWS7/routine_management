import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:   'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
  danger:    'bg-error hover:bg-red-600 text-white shadow-sm',
  success:   'bg-success hover:bg-green-600 text-white shadow-sm',
};

const SIZES = {
  xs: 'px-2.5 py-1.5 text-xs gap-1',
  sm: 'px-3 py-2 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'sm',
  loading = false,
  icon: Icon,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        disabled:opacity-60 disabled:cursor-not-allowed
        ${VARIANTS[variant] || VARIANTS.primary}
        ${SIZES[size] || SIZES.sm}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={14} className="shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
