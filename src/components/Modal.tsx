import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-2',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizeClass} bg-dark-800 rounded-t-2xl sm:rounded-2xl border border-dark-600 shadow-2xl animate-slideUp max-h-[85vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-600 shrink-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button onClick={onClose} className="btn-press w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-dark-300 hover:text-white">
              ✕
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 scrollable">
          {children}
        </div>
      </div>
    </div>
  );
}
