import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonClass?: string;
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Hapus',
  confirmButtonClass = 'bg-danger hover:bg-red-700',
  isConfirming = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">{message}</p>
        <div className="flex justify-end space-x-2 pt-4 border-t dark:border-dark-700 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800"
            disabled={isConfirming}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2 px-4 rounded text-white ${confirmButtonClass} disabled:opacity-50`}
            disabled={isConfirming}
          >
            {isConfirming ? 'Memproses...' : confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
