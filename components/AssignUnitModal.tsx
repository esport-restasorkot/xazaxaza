import React, { useState } from 'react';
import Modal from './Modal';
import { Report, Unit, ReportType } from '../types';
import { supabase } from '../supabaseClient';

interface AssignUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    units: Unit[];
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
    onActionSuccess: (message: string) => void;
}

const AssignUnitModal: React.FC<AssignUnitModalProps> = ({ isOpen, onClose, report, units, setReports, onActionSuccess }) => {
    const [selectedUnitId, setSelectedUnitId] = useState<string>(report.assignedUnitId || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await supabase
            .from('reports')
            .update({ assigned_unit_id: selectedUnitId })
            .eq('id', report.id);

        if (error) {
            alert(`Gagal menunjuk unit: ${error.message}`);
        } else {
            setReports(prev => prev.map(r => r.id === report.id ? { ...r, assignedUnitId: selectedUnitId } : r));
            onActionSuccess(`Unit berhasil ditunjuk untuk laporan #${report.reportNumber}.`);
            onClose();
        }
        setIsSaving(false);
    };

    const formatCaseNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        const modelSuffix = report.policeModel ? `/${report.policeModel}` : '';
        return `${typePrefix}${modelSuffix}/${report.reportNumber}/${report.reportYear}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tunjuk Unit untuk Laporan: ${formatCaseNumber(report)}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="unit" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Pilih Unit</label>
                    <select
                        id="unit"
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    >
                        <option value="" disabled>-- Pilih Unit --</option>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
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

export default AssignUnitModal;