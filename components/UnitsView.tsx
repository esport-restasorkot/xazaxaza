import React, { useState } from 'react';
import { Unit } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import UnitFormModal from './UnitFormModal';
import { supabase } from '../supabaseClient';
import Toast from './Toast';

interface UnitsViewProps {
    units: Unit[];
    setUnits: React.Dispatch<React.SetStateAction<Unit[]>>;
}

const UnitsView: React.FC<UnitsViewProps> = ({ units, setUnits }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
    const [notification, setNotification] = useState('');

    const openModal = (unit: Unit | null = null) => {
        setUnitToEdit(unit);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setUnitToEdit(null);
        setIsModalOpen(false);
    };
    
    const handleDelete = async (unitId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus unit ini?')) {
            try {
                const { error: invokeError } = await supabase.functions.invoke('delete-unit', {
                    body: { unitId },
                });

                if (invokeError) {
                    const errorMessage = invokeError.context?.error || invokeError.message;
                    throw new Error(errorMessage);
                }

                setUnits(units.filter(u => u.id !== unitId));
                setNotification('Unit berhasil dihapus.');

            } catch (error: any) {
                alert(error.message); // The error message from the function is user-friendly
            }
        }
    };

    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            {notification && <Toast message={notification} onClose={() => setNotification('')} />}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Unit</h1>
                <button onClick={() => openModal()} className="flex items-center bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    <PlusIcon />
                    <span className="ml-2">Tambah Unit</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nama Unit</th>
                            <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {units.map(unit => (
                            <tr key={unit.id} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{unit.name}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openModal(unit)} className="text-yellow-500 hover:underline"><EditIcon/></button>
                                    <button onClick={() => handleDelete(unit.id)} className="text-red-500 hover:underline"><TrashIcon/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <UnitFormModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    setUnits={setUnits}
                    unitToEdit={unitToEdit}
                    onActionSuccess={setNotification}
                />
            )}
        </div>
    );
};

export default UnitsView;