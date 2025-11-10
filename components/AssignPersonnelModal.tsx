import React, { useState } from 'react';
import Modal from './Modal';
import { Report, Personnel, ReportType } from '../types';
import { supabase } from '../supabaseClient';

interface AssignPersonnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    personnel: Personnel[];
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
    onActionSuccess: (message: string) => void;
}

const AssignPersonnelModal: React.FC<AssignPersonnelModalProps> = ({ isOpen, onClose, report, personnel, setReports, onActionSuccess }) => {
    const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>(report.assignedPersonnelIds || []);
    const [isSaving, setIsSaving] = useState(false);

    const handleSelect = (personnelId: string) => {
        setSelectedPersonnelIds(prev =>
            prev.includes(personnelId) ? prev.filter(id => id !== personnelId) : [...prev, personnelId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Delete existing assignments for this report
            const { error: deleteError } = await supabase.from('assigned_personnel').delete().eq('report_id', report.id);
            if (deleteError) throw deleteError;

            // Insert new assignments if any are selected
            if (selectedPersonnelIds.length > 0) {
                const newAssignments = selectedPersonnelIds.map(personnel_id => ({
                    report_id: report.id,
                    personnel_id,
                }));
                const { error: insertError } = await supabase.from('assigned_personnel').insert(newAssignments);
                if (insertError) throw insertError;
            }

            setReports(prev => prev.map(r => r.id === report.id ? { ...r, assignedPersonnelIds: selectedPersonnelIds } : r));
            onActionSuccess(`Personil berhasil ditunjuk untuk laporan #${report.reportNumber}.`);
            onClose();

        } catch (error: any) {
            alert(`Gagal menyimpan data personil: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const formatCaseNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        const modelSuffix = report.policeModel ? `/${report.policeModel}` : '';
        return `${typePrefix}${modelSuffix}/${report.reportNumber}/${report.reportYear}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tunjuk Personil untuk Laporan: ${formatCaseNumber(report)}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Pilih Personil</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded dark:border-dark-700">
                        {personnel.map(p => (
                            <div key={p.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`personnel-${p.id}`}
                                    checked={selectedPersonnelIds.includes(p.id)}
                                    onChange={() => handleSelect(p.id)}
                                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor={`personnel-${p.id}`} className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{p.name} ({p.rank})</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignPersonnelModal;