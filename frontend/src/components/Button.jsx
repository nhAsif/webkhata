import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { ArrowRight } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-heading font-bold select-none cursor-pointer transition-all duration-100 rounded-none border-black focus-visible:outline-none focus-visible:bg-[#FFD93D] focus-visible:border-black disabled:bg-disabled disabled:text-fg-disabled disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-[#FF6B6B] text-black border-4 hover:bg-[#FF6B6B]/90',
        brand: 'bg-[#FF6B6B] text-black border-4 hover:bg-[#FF6B6B]/90',
        secondary: 'bg-[#FFD93D] text-black border-4 hover:bg-[#FFD93D]/90',
        outline: 'bg-white text-black border-4 hover:bg-neutral-100',
        ghost: 'bg-transparent text-black border-2 border-transparent hover:border-black hover:bg-[#C4B5FD] hover:shadow-[4px_4px_0px_0px_var(--neo-shadow)] hover:active:translate-x-[4px] hover:active:translate-y-[4px] hover:active:shadow-none transition-all duration-100',
        link: 'bg-transparent text-black underline hover:text-[#FF6B6B] p-0 h-auto border-0 shadow-none hover:shadow-none active:translate-x-0 active:translate-y-0',
        success: 'bg-[#C4B5FD] text-black border-4 hover:bg-[#C4B5FD]/90',
        danger: 'bg-[#FF6B6B] text-black border-4 hover:bg-[#FF6B6B]/90',
        warning: 'bg-[#FFD93D] text-black border-4 hover:bg-[#FFD93D]/90',
      },
      size: {
        xs: 'h-8 px-3 text-xs border-2 shadow-[2px_2px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        sm: 'h-10 px-4.5 text-sm border-4 shadow-[4px_4px_0px_0px_var(--neo-shadow)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        default: 'h-12 px-[26px] text-[15px] border-4 shadow-[4px_4px_0px_0px_var(--neo-shadow)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
        lg: 'h-14 px-8 text-base border-4 shadow-[6px_6px_0px_0px_var(--neo-shadow)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none',
        xl: 'h-16 px-10 text-lg border-4 shadow-[8px_8px_0px_0px_var(--neo-shadow)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export default function Button({ className, variant = 'primary', size = 'default', children, arrow = false, ...props }) {
  const isCta = variant === 'primary' || arrow;
  
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }), 'group')}
      {...props}
    >
      <span className="flex items-center gap-2">{children}</span>
      {isCta && (
        <ArrowRight className="w-4 h-4 ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1" />
      )}
    </button>
  );
}
export { buttonVariants };
