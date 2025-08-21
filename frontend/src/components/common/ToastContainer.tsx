import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastMessage } from './Toast';

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showIntegrationToast: (service: 'email' | 'slack', action: string, target?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showIntegrationToast = (service: 'email' | 'slack', action: string, target?: string) => {
    const serviceConfig = {
      email: { icon: '📧', name: 'Email' },
      slack: { icon: '💬', name: 'Slack' }
    };

    const config = serviceConfig[service];
    
    addToast({
      type: 'info',
      title: `${config.name} Integration`,
      message: `${action}${target ? ` to ${target}` : ''}`,
      icon: config.icon,
      duration: 4000
    });
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showIntegrationToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-4 sm:right-4 z-50 space-y-2 max-w-sm sm:max-w-none mx-auto sm:mx-0">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;