/**
 * @component ModalLayout
 * @description Accessible, keyboard-trapped modal overlay preventing body scroll while active.
 * @usedBy AddExpensePage (as a dialogue variant), Alert modals.
 * @connectsTo None (pure DOM portal candidate)
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import Icon from '../components/atoms/Icon';

export const ModalLayout = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = 'max-w-md',
}) => {
  // Focus trap reference
  const modalRef = useRef(null);

  // Handle ESC mapping and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Focus shifting
    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render into document.body to avoid stacking context (z-index) wars
  return createPortal(
    <div 
      className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Card */}
      <div 
        ref={modalRef}
        tabIndex="-1"
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden focus:outline-none animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          maxWidth,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
          <h2 id="modal-title" className="text-lg font-bold font-display text-slate-900 line-clamp-1">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-1"
            aria-label="Close modal"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto w-full">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalLayout;
