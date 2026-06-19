import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wider select-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#121212]',
  {
    variants: {
      variant: {
        primary: 'bg-[#D02020] text-white shadow-[3px_3px_0px_0px_#121212] hover:bg-[#D02020]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        secondary: 'bg-[#1040C0] text-white shadow-[3px_3px_0px_0px_#121212] hover:bg-[#1040C0]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        yellow: 'bg-[#F0C020] text-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-[#F0C020]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        outline: 'bg-white text-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-gray-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        ghost: 'border-transparent bg-transparent text-[#121212] hover:bg-gray-100 active:bg-gray-200',
        link: 'border-transparent bg-transparent text-[#1040C0] hover:underline p-0 h-auto',
        success: 'bg-[#F0C020] text-[#121212] shadow-[3px_3px_0px_0px_#121212] hover:bg-[#F0C020]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        danger: 'bg-[#D02020] text-white shadow-[3px_3px_0px_0px_#121212] hover:bg-[#D02020]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
      },
      size: {
        default: 'h-11 px-6 text-sm',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
      },
      shape: {
        square: 'rounded-none',
        pill: 'rounded-full',
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      shape: 'square',
    },
  }
);

export default function Button({ className, variant, size, shape, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}
export { buttonVariants };
