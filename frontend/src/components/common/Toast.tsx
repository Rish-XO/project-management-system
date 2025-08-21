import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Wait for fade out animation
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    if (toast.icon) return toast.icon;
    
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full border rounded-lg shadow-lg p-4 mb-3 transition-all duration-300 transform
        ${getTypeStyles()}
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-lg mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {toast.title}
          </div>
          {toast.message && (
            <div className="text-sm mt-1 opacity-90">
              {toast.message}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;