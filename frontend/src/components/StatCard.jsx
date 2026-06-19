import { cloneElement } from 'react';
import { cn } from '../utils/cn';

export default function StatCard({ label, value, icon, color = '#FF6B6B', change, className }) {
  // Map hex color to matching theme var
  const displayColor = color.startsWith('var') ? 'var(--brand)' : color;
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-none bg-white p-6 shadow-[8px_8px_0px_0px_var(--neo-shadow)] hover:-translate-y-2 hover:shadow-[14px_14px_0px_0px_var(--neo-shadow)] transition-all duration-200 font-body border-4 border-black",
        className
      )}
    >
      {/* Decorative Halftone Dots pattern in background */}
      <div className="absolute inset-0 bg-halftone opacity-5 pointer-events-none" />

      {/* Top indicator bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-[8px] border-b-4 border-black"
        style={{ 
          backgroundColor: displayColor
        }}
      />
      
      <div className="flex justify-between items-start relative z-10 mt-2">
        <div>
          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 font-heading">
            {label}
          </div>
          <div 
            className="text-4xl font-display font-black text-black mt-2 leading-none tracking-tighter"
          >
            {value ?? '—'}
          </div>
          {change !== undefined && (
            <div className="text-xs font-bold text-black/80 mt-4 flex items-center gap-1 font-body">
              {change}
            </div>
          )}
        </div>
        
        {icon && (
          <div 
            className="text-2xl p-2.5 rounded-none flex items-center justify-center border-4 border-black shadow-[3px_3px_0px_0px_var(--neo-shadow)] group-hover:rotate-6 transition-transform duration-200"
            style={{
              backgroundColor: displayColor,
              color: '#000000',
            }}
          >
            {cloneElement(icon, { className: "w-6 h-6 stroke-[3px]" })}
          </div>
        )}
      </div>
    </div>
  );
}
