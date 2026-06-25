import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-full mx-4',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const overlayRef = useRef(null);
  // Guarda onde o gesto do mouse COMEÇOU. Só fechamos no clique do backdrop
  // se o press iniciou no próprio overlay — assim, selecionar texto dentro de
  // um campo e soltar o mouse fora não fecha o modal (evitando perder os dados).
  const pressStartedOnOverlay = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(2px)' }}
          onMouseDown={e => { pressStartedOnOverlay.current = e.target === overlayRef.current; }}
          onClick={e => {
            if (e.target === overlayRef.current && pressStartedOnOverlay.current) onClose?.();
            pressStartedOnOverlay.current = false;
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-modal w-full ${SIZES[size] || SIZES.md} flex flex-col max-h-[92vh] sm:max-h-[90vh]`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 shrink-0 bg-gray-50 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
