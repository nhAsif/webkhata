import { cloneElement } from 'react';
import { cn } from '../utils/cn';

const getBauhausColor = (c) => {
  const clean = String(c).toLowerCase();
  if (clean.includes('ef4444') || clean.includes('ea580c') || clean.includes('red')) return '#D02020'; // Bauhaus Red
  if (clean.includes('3b82f6') || clean.includes('6366f1') || clean.includes('blue') || clean.includes('indigo')) return '#1040C0'; // Bauhaus Blue
  return '#F0C020'; // Bauhaus Yellow (default/success/warn)
};

export default function StatCard({ label, value, icon, color = '#F0C020', change, className }) {
  const displayColor = getBauhausColor(color);
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-none border-4 border-[#121212] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#121212] shadow-[6px_6px_0px_0px_#121212] font-body",
        className
      )}
    >
      {/* Decorative Background Icon */}
      {icon && (
        <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-10 transition-opacity duration-300 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12">
          {cloneElement(icon, { className: "w-32 h-32 text-[#121212]" })}
        </div>
      )}

      {/* Dynamic top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-2 bg-[#121212]"
        style={{ 
          backgroundColor: displayColor 
        }}
      />
      
      <div className="flex justify-between items-start relative z-10 pt-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 font-mono">
            {label}
          </div>
          <div 
            className="text-4xl font-heading font-black text-[#121212] mt-2 leading-none tracking-tighter uppercase"
          >
            {value ?? '—'}
          </div>
          {change !== undefined && (
            <div className="text-xs text-gray-500 mt-2.5 flex items-center gap-1 font-mono uppercase tracking-wider font-semibold">
              {change}
            </div>
          )}
        </div>
        
        {icon && (
          <div 
            className="text-2xl p-2.5 rounded-none border-2 border-black flex items-center justify-center transition-all duration-200 shadow-[3px_3px_0px_0px_#121212]"
            style={{
              backgroundColor: displayColor,
              color: displayColor === '#F0C020' ? '#121212' : '#FFFFFF',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
