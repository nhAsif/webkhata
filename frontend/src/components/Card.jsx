import { cn } from '../utils/cn';

export function Card({ 
  className, 
  variant = 'default', 
  hover = true, 
  decorShape = 'circle', 
  decorColor = 'red',
  showDecor = true,
  ...props 
}) {
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    triangle: '[clip-path:polygon(50%_0%,_0%_100%,_100%_100%)] w-[14px] h-[12px]!',
  };
  const colorClasses = {
    red: 'bg-[#D02020]',
    blue: 'bg-[#1040C0]',
    yellow: 'bg-[#F0C020]',
  };

  return (
    <div
      className={cn(
        'rounded-none border-4 border-[#121212] transition-all duration-200 font-body relative overflow-visible bg-white text-[#121212]',
        variant === 'default' && 'shadow-[6px_6px_0px_0px_#121212]',
        variant === 'glass' && 'shadow-[6px_6px_0px_0px_#121212] bg-white/90 backdrop-blur-md',
        variant === 'highlight' && 'border-[#121212] scale-[1.02] shadow-[10px_10px_0px_0px_#121212] z-10 bg-[#F0C020]',
        hover && variant !== 'highlight' && 'hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#121212]',
        className
      )}
      {...props}
    >
      {/* Bauhaus Geometric Corner Badge */}
      {showDecor && (
        <div 
          className={cn(
            "absolute top-3 right-3 w-3.5 h-3.5 border border-black",
            shapeClasses[decorShape] || shapeClasses.circle,
            colorClasses[decorColor] || colorClasses.red
          )} 
        />
      )}
      {props.children}
    </div>
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6 border-b-2 border-black/10 mb-4 bg-gray-50/50', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        'font-heading font-black text-xl md:text-2xl leading-none uppercase tracking-tighter text-[#121212]',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn('text-xs font-semibold text-gray-500 font-mono uppercase tracking-widest', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center p-6 pt-0 border-t-2 border-black/10 mt-4 bg-gray-50/30', className)}
      {...props}
    />
  );
}
