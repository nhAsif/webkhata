import { cn } from '../utils/cn';

export function Card({ className, variant = 'default', hover = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-none border-4 border-black font-body transition-all duration-200',
        // Cream default card
        variant === 'default' && 'bg-white text-black shadow-[8px_8px_0px_0px_var(--neo-shadow)]',
        // Glassmorphism/Flat panel
        variant === 'glass' && 'bg-[#FFFDF5] text-black shadow-[8px_8px_0px_0px_var(--neo-shadow)]',
        // Highlight variant - Violet brand panel
        variant === 'highlight' && 'bg-[#C4B5FD] text-black shadow-[12px_12px_0px_0px_var(--neo-shadow)]',
        // Interactive hover states
        hover && variant === 'default' && 'hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_var(--neo-shadow)] cursor-pointer',
        hover && variant === 'highlight' && 'hover:-translate-y-2 hover:shadow-[20px_20px_0px_0px_var(--neo-shadow)] cursor-pointer',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6 border-b-4 border-black bg-[#C4B5FD]/15', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-heading font-black text-xl md:text-2xl leading-none tracking-tighter text-black uppercase',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-black/70 font-bold font-body mt-1', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0 border-t-4 border-black mt-6 bg-[#FFD93D]/10', className)}
      {...props}
    />
  );
}
