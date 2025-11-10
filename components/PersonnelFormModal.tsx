
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Personnel, Unit } from '../types';
import { supabase } from '../supabaseClient';

interface PersonnelFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
    personnelToEdit: Personnel | null;
    units: Unit[];
    onActionSuccess: (message: string) => void;
}

const formatPersonnelFromDB = (dbPersonnel: any): Personnel => ({
    id: dbPersonnel.id,
    name: dbPersonnel.name,
    rank: dbPersonnel.rank,
    unitId: dbPersonnel.unit_id,
});

const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({ isOpen, onClose, setPersonnel, personnelToEdit, units, onActionSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        rank: '',
        unitId: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (personnelToEdit) {
            setFormData({
                name: personnelToEdit.name,
                rank: personnelToEdit.rank,
                unitId: personnelToEdit.unitId,
            });
        } else {
             setFormData({ name: '', rank: '', unitId: units[0]?.id || '' });
        }
    }, [personnelToEdit, units, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const payload = { ...formData, unit_id: formData.unitId };
        delete (payload as any).unitId; // remove camelCase key

        try {
            if (personnelToEdit) {
                const { data, error } = await supabase.from('personnel').update(payload).eq('id', personnelToEdit.id).select().single();
                if (error) throw error;
                const formattedData = formatPersonnelFromDB(data);
                setPersonnel(prev => prev.map(p => p.id === personnelToEdit.id ? formattedData : p));
                onActionSuccess('Data personil berhasil diperbarui.');
            } else {
                const newId = `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const { data, error } = await supabase.from('personnel').insert({ ...payload, id: newId }).select().single();
                if (error) throw error;
                const formattedData = formatPersonnelFromDB(data);
                setPersonnel(prev => [formattedData, ...prev]);
                onActionSuccess('Personil baru berhasil ditambahkan.');
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
        <Modal isOpen={isOpen} onClose={onClose} title={personnelToEdit ? 'Edit Personil' : 'Tambah Personil Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Nama Lengkap</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="rank" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Pangkat</label>
                    <input type="text" name="rank" id="rank" value={formData.rank} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="unitId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Unit</label>
                    <select name="unitId" id="unitId" value={formData.unitId} onChange={handleChange} className={inputClass} required>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : (personnelToEdit ? 'Simpan Perubahan' : 'Tambah Personil')}
                        </button>
                </div>
            </form>
        </Modal>
    );
};

export default PersonnelFormModal;
