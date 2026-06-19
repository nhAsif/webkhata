import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full bg-white border-2 border-[#121212] px-4 py-2 text-sm text-[#121212] transition-all duration-200 placeholder:text-gray-400 focus-visible:border-[#D02020] focus-visible:shadow-[3px_3px_0px_0px_#121212] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body rounded-none shadow-[2px_2px_0px_0px_#121212]',
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
          'flex h-12 w-full bg-white border-2 border-[#121212] px-4 py-2 pr-10 text-sm text-[#121212] transition-all duration-200 focus-visible:border-[#D02020] focus-visible:shadow-[3px_3px_0px_0px_#121212] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body appearance-none cursor-pointer rounded-none shadow-[2px_2px_0px_0px_#121212]',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#121212]">
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
        'flex min-h-[80px] w-full bg-white border-2 border-[#121212] px-4 py-2 text-sm text-[#121212] transition-all duration-200 placeholder:text-gray-400 focus-visible:border-[#D02020] focus-visible:shadow-[3px_3px_0px_0px_#121212] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body resize-y rounded-none shadow-[2px_2px_0px_0px_#121212]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
