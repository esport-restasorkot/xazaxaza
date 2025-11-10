
// components/CreateOperatorModal.tsx
import React, { useState } from 'react';
import Modal from './Modal';
import { Personnel } from '../types';
import { supabase } from '../supabaseClient';

interface CreateOperatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    personnel: Personnel;
    onSuccess: (updatedPersonnel: Personnel) => void;
}

const CreateOperatorModal: React.FC<CreateOperatorModalProps> = ({ isOpen, onClose, personnel, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('create-operator', {
                body: { 
                    personnelId: personnel.id,
                    email: email,
                    password: password,
                 },
            });

            if (invokeError) {
                // The error from the function is in invokeError.context if the function returned a JSON body.
                // We check for a custom 'error' property in the response, otherwise fall back to the main error message.
                const errorMessage = invokeError.context?.error || invokeError.message;
                throw new Error(errorMessage);
            }
            
            // If successful, update the personnel state in the parent
            const updatedPersonnel = { ...personnel, userId: data.userId, userEmail: email };
            onSuccess(updatedPersonnel);
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan yang tidak diketahui.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Buat Akun Operator untuk ${personnel.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/20 dark:text-red-400">
                        {error}
                    </div>
                )}
                 <div>
                    <label className="block mb-2 text-sm font-medium">Nama Personil</label>
                    <p className="p-2 bg-gray-100 dark:bg-dark-800 rounded">{personnel.name} ({personnel.rank})</p>
                </div>
                <div>
                    <label htmlFor="operator-email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
                    <input type="email" id="operator-email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </div>
                 <div>
                    <label htmlFor="operator-password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Password</label>
                    <input type="password" id="operator-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required minLength={6} />
                     <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter.</p>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-dark-700 mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? 'Membuat Akun...' : 'Buat Akun'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateOperatorModal;
