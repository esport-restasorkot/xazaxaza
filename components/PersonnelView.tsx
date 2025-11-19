
// components/PersonnelView.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, Unit } from '../types';
import { PlusIcon, EditIcon, SortIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import PersonnelFormModal from './PersonnelFormModal';
import { supabase } from '../supabaseClient';
import Pagination from './Pagination';
import Toast from './Toast';
import ConfirmationModal from './ConfirmationModal';

interface PersonnelViewProps {
    personnel: Personnel[];
    setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
    units: Unit[];
}

type SortableKeys = 'name' | 'rank' | 'unitId';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: SortableKeys;
    direction: SortDirection;
}

const PersonnelView: React.FC<PersonnelViewProps> = ({ personnel, setPersonnel, units }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [personnelToEdit, setPersonnelToEdit] = useState<Personnel | null>(null);
    const [notification, setNotification] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [unitFilter, setUnitFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [personnelToDelete, setPersonnelToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const unitMap = useMemo(() => new Map(units.map(u => [u.id, u.name])), [units]);

    const filteredPersonnel = useMemo(() => {
        let tempPersonnel = [...personnel];

        if (unitFilter !== 'all') {
            tempPersonnel = tempPersonnel.filter(p => p.unitId === unitFilter);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            tempPersonnel = tempPersonnel.filter(p =>
                p.name.toLowerCase().includes(lowercasedTerm) ||
                p.rank.toLowerCase().includes(lowercasedTerm) ||
                (unitMap.get(p.unitId) || '').toLowerCase().includes(lowercasedTerm)
            );
        }
        
         if (sortConfig !== null) {
            tempPersonnel.sort((a, b) => {
                let aValue: string | null | undefined;
                let bValue: string | null | undefined;

                switch(sortConfig.key) {
                    case 'unitId':
                        aValue = unitMap.get(a.unitId);
                        bValue = unitMap.get(b.unitId);
                        break;
                    default: // name, rank
                        aValue = a[sortConfig.key];
                        bValue = b[sortConfig.key];
                }
                
                // Treat null or undefined as empty strings for consistent sorting
                aValue = aValue || '';
                bValue = bValue || '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        } else {
             tempPersonnel.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return tempPersonnel;

    }, [personnel, searchTerm, unitFilter, unitMap, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, unitFilter, sortConfig]);


    const openFormModal = (p: Personnel | null = null) => {
        setPersonnelToEdit(p);
        setIsFormModalOpen(true);
    };
    
    const handleDelete = (personnelId: string) => {
        setPersonnelToDelete(personnelId);
    };

    const confirmDelete = async () => {
        if (!personnelToDelete) return;
        setIsDeleting(true);
        try {
            const { error: invokeError } = await supabase.functions.invoke('delete-personnel', {
                body: { personnelId: personnelToDelete },
            });

            if (invokeError) {
                const errorMessage = invokeError.context?.error || invokeError.message;
                throw new Error(errorMessage);
            }
            
            setPersonnel(personnel.filter(p => p.id !== personnelToDelete));
            setNotification('Data personil berhasil dihapus.');

        } catch (error: any) {
            alert(`Gagal menghapus personil: ${error.message}`);
        } finally {
            setIsDeleting(false);
            setPersonnelToDelete(null);
        }
    };
    
    // Sorting Logic
    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <SortIcon />;
        }
        if (sortConfig.direction === 'ascending') {
            return <ArrowUpIcon className="text-primary" />;
        }
        return <ArrowDownIcon className="text-primary" />;
    };

    const SortableHeader: React.FC<{ label: string; sortKey: SortableKeys; className?: string }> = ({ label, sortKey, className = '' }) => (
        <th scope="col" className={`px-6 py-3 ${className}`}>
            <button className="flex items-center gap-1.5 group" onClick={() => requestSort(sortKey)}>
                {label}
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {getSortIcon(sortKey)}
                </span>
            </button>
        </th>
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredPersonnel.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            {notification && <Toast message={notification} onClose={() => setNotification('')} />}
            <div className="flex flex-col md:flex-row justify-end items-center mb-4 gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Cari personil..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full md:w-auto bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                     <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">Semua Unit</option>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
                    <button onClick={() => openFormModal()} className="flex items-center bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">
                        <PlusIcon />
                        <span className="ml-2 hidden sm:inline">Tambah</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader label="Nama" sortKey="name" />
                            <SortableHeader label="Pangkat" sortKey="rank" />
                            <SortableHeader label="Unit" sortKey="unitId" />
                            <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(p => (
                            <tr key={p.id} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                <td className="px-6 py-4">{p.rank}</td>
                                <td className="px-6 py-4">{unitMap.get(p.unitId) || 'Belum Ditunjuk'}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => openFormModal(p)} className="p-1 text-yellow-500 hover:text-yellow-700" title="Edit"><EditIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination itemsPerPage={itemsPerPage} totalItems={filteredPersonnel.length} currentPage={currentPage} paginate={paginate} />

            {isFormModalOpen && (
                <PersonnelFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    setPersonnel={setPersonnel}
                    personnelToEdit={personnelToEdit}
                    units={units}
                    onActionSuccess={setNotification}
                />
            )}

            {personnelToDelete && (
                <ConfirmationModal
                    isOpen={!!personnelToDelete}
                    onClose={() => setPersonnelToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Konfirmasi Hapus Personil"
                    message="Apakah Anda yakin ingin menghapus personil ini? Tindakan ini juga akan menghapus akun login terkait secara permanen."
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};

export default PersonnelView;
