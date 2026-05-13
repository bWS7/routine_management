import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2.5 text-sm text-gray-900 bg-white border rounded-lg
          placeholder-gray-400 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-error focus:ring-error' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={`
          w-full px-3 py-2.5 text-sm text-gray-900 bg-white border rounded-lg resize-none
          placeholder-gray-400 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-error focus:ring-error' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, children, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 text-sm text-gray-900 bg-white border rounded-lg appearance-none pr-9
            placeholder-gray-400 transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
});
