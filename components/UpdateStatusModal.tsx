import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Report, ReportStatus, StatusUpdate, UserRole, StatusDetail } from '../types';
import { supabase } from '../supabaseClient';

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
    userRole: UserRole;
    onUpdateSuccess: (message: string) => void;
}

const statusDetailOptions = {
    [ReportStatus.PROSES]: [StatusDetail.LIDIK, StatusDetail.SIDIK],
    [ReportStatus.SELESAI]: [StatusDetail.P21, StatusDetail.DIVERSI, StatusDetail.RJ, StatusDetail.SP3],
};

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, onClose, report, setReports, userRole, onUpdateSuccess }) => {
    const [newStatus, setNewStatus] = useState<ReportStatus>(report.status);
    const [newStatusDetail, setNewStatusDetail] = useState<StatusDetail | undefined>(report.statusDetail);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

     useEffect(() => {
        // Reset status detail if status changes and current detail is not valid for the new status
        if (!statusDetailOptions[newStatus].includes(newStatusDetail!)) {
            setNewStatusDetail(statusDetailOptions[newStatus][0]);
        }
    }, [newStatus, newStatusDetail]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusDetail) {
            alert('Silakan pilih keterangan status.');
            return;
        }
        setIsSaving(true);

        try {
            // 1. Update the report status
            const { error: reportUpdateError } = await supabase
                .from('reports')
                .update({ status: newStatus, status_detail: newStatusDetail })
                .eq('id', report.id);

            if (reportUpdateError) throw reportUpdateError;

            // 2. Add to status history
            const newHistory = {
                report_id: report.id,
                status: newStatus,
                status_detail: newStatusDetail,
                description,
                updated_by: userRole,
            };
            const { data: historyData, error: historyError } = await supabase
                .from('status_history')
                .insert(newHistory)
                .select()
                .single();

            if (historyError) throw historyError;

            const statusUpdateForState: StatusUpdate = {
                status: historyData.status,
                statusDetail: historyData.status_detail,
                description: historyData.description,
                updatedAt: historyData.updated_at,
                updatedBy: historyData.updated_by,
            };

            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: newStatus, statusDetail: newStatusDetail, statusHistory: [...r.statusHistory, statusUpdateForState] } : r));
            onUpdateSuccess(`Status laporan #${report.reportNumber} diperbarui menjadi ${newStatusDetail}.`);
            onClose();
        } catch (error: any) {
            alert(`Gagal memperbarui status: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Status Laporan: ${report.reportNumber}`}>
            <div className="mb-6">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-100">Riwayat Status</h4>
                <div className="border border-gray-200 dark:border-dark-700 rounded-lg max-h-48 overflow-y-auto">
                    {report.statusHistory.slice().reverse().map((update, index) => (
                        <div key={index} className={`p-3 ${index !== report.statusHistory.length - 1 ? 'border-b border-gray-200 dark:border-dark-700' : ''}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-gray-800 dark:text-white">{update.status}: <span className="text-primary">{update.statusDetail}</span></p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(update.updatedAt).toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{update.description} - oleh {update.updatedBy}</p>
                        </div>
                    ))}
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Status Baru</label>
                        <select
                            id="status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                            className={inputClass}
                        >
                            {Object.values(ReportStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="statusDetail" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Keterangan Status</label>
                        <select
                            id="statusDetail"
                            value={newStatusDetail}
                            onChange={(e) => setNewStatusDetail(e.target.value as StatusDetail)}
                            className={inputClass}
                        >
                            {statusDetailOptions[newStatus].map(detail => (
                                <option key={detail} value={detail}>{detail}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 <div className="col-span-2">
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Keterangan Update</label>
                    <textarea 
                        name="description" 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows={3} 
                        className={inputClass} 
                        required 
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-dark-700 mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : 'Update Status'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UpdateStatusModal;