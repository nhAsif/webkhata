import { useEffect } from 'react';
import { cn } from '../utils/cn';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = { 
    sm: 'max-w-sm', 
    md: 'max-w-lg', 
    lg: 'max-w-2xl', 
    xl: 'max-w-4xl' 
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-void/85 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-2xl border border-white/10 bg-matter shadow-[0_0_50px_-10px_rgba(247,147,26,0.2)] flex flex-col transition-all duration-300 max-h-[90vh] overflow-hidden",
          maxWidths[size] || maxWidths.md
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-heading font-semibold text-pure tracking-tight">{title}</h2>
          <button 
            className="text-stardust hover:text-bitcoin hover:bg-white/5 transition-all duration-200 text-sm p-1.5 rounded-lg"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="px-6 py-5 overflow-y-auto text-sm text-pure/90">
          {children}
        </div>
        
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-void/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
