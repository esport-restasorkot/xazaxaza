import React, { useEffect } from 'react';
import { XIcon } from './icons';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 bg-success text-white py-3 px-5 rounded-lg shadow-lg flex items-center justify-between z-50 animate-fade-in-down max-w-sm">
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 -mr-1 p-1 rounded-full hover:bg-green-600 transition-colors duration-200">
        <XIcon width="16" height="16" />
      </button>
    </div>
  );
};

export default Toast;
