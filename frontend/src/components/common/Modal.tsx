import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const mobileFullScreen = 'fixed inset-0 w-full h-full max-w-none sm:relative sm:inset-auto sm:w-auto sm:h-auto';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-0 px-0 pb-0 text-center sm:items-center sm:pt-4 sm:px-4 sm:pb-20 sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className={`
          inline-block align-bottom bg-white text-left overflow-hidden shadow-xl transform transition-all 
          w-full h-full rounded-none sm:rounded-lg sm:my-8 sm:align-middle sm:w-full sm:h-auto ${sizeClasses[size]}
        `}>
          <div className="bg-white h-full flex flex-col sm:block sm:h-auto">
            {/* Mobile Header with close button */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 sm:border-b-0 sm:p-6 sm:pb-4">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 truncate pr-4">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 touch-manipulation flex-shrink-0"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:pt-2">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;