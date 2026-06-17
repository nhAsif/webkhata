import { cn } from '../utils/cn';

export function Card({ className, variant = 'default', hover = true, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300 font-body',
        variant === 'default' && 'bg-matter border-white/10 text-pure',
        variant === 'glass' && 'bg-black/40 backdrop-blur-md border-white/10 text-pure',
        variant === 'highlight' && 'bg-matter border-bitcoin scale-105 shadow-[0_0_40px_-10px_rgba(247,147,26,0.15)] z-10 text-pure',
        hover && variant !== 'highlight' && 'hover:-translate-y-1 hover:border-bitcoin/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-heading font-semibold text-xl md:text-2xl leading-tight tracking-tight text-pure',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-sm text-stardust font-body', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  );
}
