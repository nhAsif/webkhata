import { cloneElement } from 'react';
import { cn } from '../utils/cn';

export default function StatCard({ label, value, icon, color = '#F7931A', change, className }) {
  // Map legacy color if it was indigo
  const displayColor = color === '#6366f1' ? '#F7931A' : color;
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-matter p-6 transition-all duration-300 hover:-translate-y-1 hover:border-bitcoin/50 hover:shadow-[0_0_35px_-10px_rgba(247,147,26,0.25)] font-body",
        className
      )}
    >
      {/* Decorative Background Icon */}
      {icon && (
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12">
          {cloneElement(icon, { className: "w-32 h-32 text-current", style: { color: displayColor } })}
        </div>
      )}

      {/* Dynamic top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r"
        style={{ 
          backgroundImage: `linear-gradient(to right, ${displayColor}, transparent)` 
        }}
      />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-stardust font-mono">
            {label}
          </div>
          <div 
            className="text-3xl font-bold text-pure mt-2 font-mono leading-none tracking-tight"
            style={{ color: displayColor }}
          >
            {value ?? '—'}
          </div>
          {change !== undefined && (
            <div className="text-xs text-stardust mt-2 flex items-center gap-1 font-mono">
              {change}
            </div>
          )}
        </div>
        
        {icon && (
          <div 
            className="text-2xl p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: `${displayColor}1A`, // 10% opacity
              borderColor: `${displayColor}4D`, // 30% opacity
              color: displayColor,
              boxShadow: `0 0 15px ${displayColor}1A`
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
