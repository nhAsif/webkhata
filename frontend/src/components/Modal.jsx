import { useEffect } from 'react';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-none bg-white shadow-[12px_12px_0px_0px_var(--neo-shadow)] flex flex-col transition-all max-h-[90vh] overflow-hidden border-4 border-black",
          maxWidths[size] || maxWidths.md
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b-4 border-black bg-[#C4B5FD]">
          <h2 className="text-xl font-heading font-black text-black tracking-tighter uppercase">{title}</h2>
          <button 
            className="w-8 h-8 rounded-none border-2 border-black bg-[#FF6B6B] text-black hover:bg-[#FF6B6B]/80 flex items-center justify-center transition-all duration-100 font-bold cursor-pointer shadow-[2px_2px_0px_0px_var(--neo-shadow)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            onClick={onClose}
          >
            <X className="w-4 h-4 stroke-[3px]" />
          </button>
        </div>
        
        <div className="px-6 py-6 overflow-y-auto text-base text-black font-bold leading-relaxed space-y-4">
          {children}
        </div>
        
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-4 border-black bg-[#FFD93D]/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
