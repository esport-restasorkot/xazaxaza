import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { StolenVehicle, Report, ReportType } from '../types';

interface CuranmorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    setStolenVehicles: React.Dispatch<React.SetStateAction<StolenVehicle[]>>;
    vehicleToEdit: StolenVehicle | null;
    reports: Report[];
    stolenVehicles: StolenVehicle[];
}

const CuranmorFormModal: React.FC<CuranmorFormModalProps> = ({ isOpen, onClose, setStolenVehicles, vehicleToEdit, reports, stolenVehicles }) => {
    const [formData, setFormData] = useState({
        reportId: '',
        vehicleType: '',
        frameNumber: '',
        engineNumber: '',
    });

    const eligibleReports = useMemo(() => {
        const linkedReportIds = new Set(stolenVehicles.map(v => v.reportId));
        return reports.filter(r => 
            r.caseType === 'Curanmor' && 
            r.reportType === ReportType.LAPORAN_POLISI &&
            (!linkedReportIds.has(r.id) || r.id === vehicleToEdit?.reportId)
        );
    }, [reports, stolenVehicles, vehicleToEdit]);

    useEffect(() => {
        if (vehicleToEdit) {
            setFormData({
                reportId: vehicleToEdit.reportId,
                vehicleType: vehicleToEdit.vehicleType,
                frameNumber: vehicleToEdit.frameNumber,
                engineNumber: vehicleToEdit.engineNumber,
            });
        } else {
             setFormData({
                reportId: eligibleReports[0]?.id || '',
                vehicleType: '',
                frameNumber: '',
                engineNumber: '',
            });
        }
    }, [vehicleToEdit, isOpen, eligibleReports]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.reportId) {
            alert('Silakan pilih Laporan Polisi yang sesuai.');
            return;
        }

        if (vehicleToEdit) {
            setStolenVehicles(prev => prev.map(v => v.id === vehicleToEdit.id ? { ...v, ...formData } : v));
        } else {
            const newVehicle: StolenVehicle = {
                id: `sv${Date.now()}`,
                ...formData,
            };
            setStolenVehicles(prev => [newVehicle, ...prev]);
        }
        onClose();
    };

    const formatReportNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        return `${typePrefix}-${report.reportNumber}/${report.reportYear} - ${report.reporterName}`;
    };

    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={vehicleToEdit ? 'Edit Data Curanmor' : 'Tambah Data Curanmor'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="reportId" className="block mb-2 text-sm font-medium">Laporan Polisi (LP)</label>
                    <select name="reportId" id="reportId" value={formData.reportId} onChange={handleChange} className={inputClass} required>
                        <option value="" disabled>-- Pilih LP Curanmor --</option>
                        {eligibleReports.map(report => (
                            <option key={report.id} value={report.id}>
                                {formatReportNumber(report)}
                            </option>
                        ))}
                    </select>
                     {eligibleReports.length === 0 && !vehicleToEdit && (
                        <p className="text-xs text-yellow-600 mt-1">Tidak ada LP Curanmor yang tersedia atau semua sudah tertaut dengan data kendaraan.</p>
                    )}
                </div>
                <div>
                    <label htmlFor="vehicleType" className="block mb-2 text-sm font-medium">Jenis Kendaraan</label>
                    <input type="text" name="vehicleType" id="vehicleType" value={formData.vehicleType} onChange={handleChange} className={inputClass} required placeholder="cth: Honda Beat, Yamaha NMAX" />
                </div>
                 <div>
                    <label htmlFor="frameNumber" className="block mb-2 text-sm font-medium">Nomor Rangka</label>
                    <input type="text" name="frameNumber" id="frameNumber" value={formData.frameNumber} onChange={handleChange} className={inputClass} required />
                </div>
                 <div>
                    <label htmlFor="engineNumber" className="block mb-2 text-sm font-medium">Nomor Mesin</label>
                    <input type="text" name="engineNumber" id="engineNumber" value={formData.engineNumber} onChange={handleChange} className={inputClass} required />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-dark-700 mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800">Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700">{vehicleToEdit ? 'Simpan Perubahan' : 'Tambah Data'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default CuranmorFormModal;
