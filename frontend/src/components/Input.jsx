import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full bg-white border-4 border-black rounded-none px-4 py-2 text-base text-black placeholder:text-black/40 transition-all duration-100 focus-visible:bg-[#FFD93D] focus-visible:shadow-[4px_4px_0px_0px_var(--neo-shadow)] focus-visible:outline-none disabled:bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed font-bold font-body',
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
          'flex h-12 w-full bg-white border-4 border-black rounded-none px-4 py-2 pr-10 text-base text-black transition-all duration-100 focus-visible:bg-[#FFD93D] focus-visible:shadow-[4px_4px_0px_0px_var(--neo-shadow)] focus-visible:outline-none disabled:bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed font-bold font-body appearance-none cursor-pointer',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-black">
        <svg className="h-5 w-5 fill-none stroke-current stroke-[3px]" viewBox="0 0 24 24">
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
        'flex min-h-[96px] w-full bg-white border-4 border-black rounded-none px-4 py-3 text-base text-black placeholder:text-black/40 transition-all duration-100 focus-visible:bg-[#FFD93D] focus-visible:shadow-[4px_4px_0px_0px_var(--neo-shadow)] focus-visible:outline-none disabled:bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed font-bold font-body resize-y',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
