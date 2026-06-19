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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#121212]/80 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-none border-4 border-[#121212] bg-white shadow-[8px_8px_0px_0px_#121212] flex flex-col transition-all duration-300 max-h-[90vh] overflow-hidden text-[#121212]",
          maxWidths[size] || maxWidths.md
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#121212] bg-[#F0C020]">
          <h2 className="text-lg font-heading font-black uppercase tracking-tighter text-[#121212]">{title}</h2>
          <button 
            className="text-black border-2 border-black bg-white hover:bg-gray-100 transition-all duration-200 text-xs w-7 h-7 flex items-center justify-center font-bold rounded-none shadow-[2px_2px_0px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="px-6 py-5 overflow-y-auto text-sm text-[#121212]">
          {children}
        </div>
        
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-4 border-[#121212] bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
