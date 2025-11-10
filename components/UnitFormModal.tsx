import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Unit } from '../types';
import { supabase } from '../supabaseClient';

interface UnitFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
    unitToEdit: Unit | null;
    onActionSuccess: (message: string) => void;
}

const UnitFormModal: React.FC<UnitFormModalProps> = ({ isOpen, onClose, setUnits, unitToEdit, onActionSuccess }) => {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (unitToEdit) {
            setName(unitToEdit.name);
        } else {
            setName('');
        }
    }, [unitToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (unitToEdit) {
                const { data, error } = await supabase.from('units').update({ name }).eq('id', unitToEdit.id).select().single();
                if (error) throw error;
                setUnits(prev => prev.map(u => u.id === unitToEdit.id ? data : u));
                onActionSuccess('Unit berhasil diperbarui.');
            } else {
                const newId = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { data, error } = await supabase.from('units').insert({ id: newId, name }).select().single();
                if (error) throw error;
                setUnits(prev => [data, ...prev]);
                onActionSuccess('Unit baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unitToEdit ? 'Edit Unit' : 'Tambah Unit Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Nama Unit</label>
                    <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : (unitToEdit ? 'Simpan Perubahan' : 'Tambah Unit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UnitFormModal;