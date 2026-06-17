import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-full',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-burnt to-bitcoin text-pure uppercase tracking-wider font-semibold shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(247,147,26,0.6)]',
        outline: 'border-2 border-pure/20 text-pure hover:border-pure hover:bg-pure/10',
        secondary: 'bg-matter border border-white/10 text-pure hover:border-pure/50 hover:bg-pure/5',
        ghost: 'bg-transparent text-pure hover:bg-pure/10 hover:text-bitcoin',
        link: 'bg-transparent text-bitcoin hover:underline p-0 h-auto',
        success: 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500 hover:text-pure hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]',
        danger: 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-pure hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]',
      },
      size: {
        default: 'h-11 px-6 text-sm',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export default function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { buttonVariants };
