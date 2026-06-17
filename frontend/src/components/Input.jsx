import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full bg-black/50 border-b-2 border-white/20 px-4 py-2 text-sm text-pure transition-all duration-200 placeholder:text-white/30 focus-visible:border-bitcoin focus-visible:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          'flex h-12 w-full bg-black/50 border-b-2 border-white/20 px-4 py-2 pr-10 text-sm text-pure transition-all duration-200 focus-visible:border-bitcoin focus-visible:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-stardust">
        <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
});
Select.displayName = 'Select';

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full bg-black/50 border-b-2 border-white/20 px-4 py-2 text-sm text-pure transition-all duration-200 placeholder:text-white/30 focus-visible:border-bitcoin focus-visible:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body resize-y',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
