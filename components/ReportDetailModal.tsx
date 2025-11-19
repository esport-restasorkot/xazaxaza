
import React from 'react';
import Modal from './Modal';
import { Report, Unit, Personnel, ReportType, ReportStatus } from '../types';

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report;
    units: Unit[];
    personnel: Personnel[];
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200 dark:border-dark-700">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 col-span-1">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:mt-0 col-span-2">{value || '-'}</dd>
    </div>
);

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report, units, personnel }) => {
    
    const getUnitName = (unitId?: string) => units.find(u => u.id === unitId)?.name || 'Belum Ditunjuk';
    const getPersonnelNames = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Belum Ditunjuk';
        return ids.map(id => personnel.find(p => p.id === id)?.name || 'Personil tidak dikenal').join(', ');
    };
    const formatReportNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        const model = report.policeModel ? `/${report.policeModel}` : '';
        return `${typePrefix}${model}/${report.reportNumber}/${report.reportYear}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detail Laporan: ${formatReportNumber(report)}`}>
            <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Informasi Laporan & Kasus</h3>
                    <dl>
                        <DetailItem label="Jenis Laporan" value={report.reportType} />
                        <DetailItem label="SPKT" value={report.spkt} />
                        <DetailItem label="Tanggal Laporan" value={new Date(report.reportDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
                        <DetailItem label="Pelapor" value={report.reporterName} />
                        <DetailItem label="Kasus" value={report.caseType} />
                        <DetailItem label="Kerugian" value={`Rp ${report.lossAmount?.toLocaleString('id-ID') || 0}`} />
                    </dl>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Waktu & Tempat Kejadian</h3>
                     <dl>
                        <DetailItem label="Tanggal Kejadian" value={new Date(report.incidentDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} />
                        <DetailItem label="Waktu Kejadian" value={report.incidentTime} />
                        <DetailItem label="TKP" value={report.incidentLocation} />
                        <DetailItem label="Lokasi" value={`${report.locationType}, Kel. ${report.subDistrict}, Distrik ${report.district}`} />
                    </dl>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Penanganan & Status</h3>
                     <dl>
                         <DetailItem label="Status" value={
                             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${report.status === ReportStatus.PROSES ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                {report.status}
                            </span>
                         } />
                        <DetailItem label="Keterangan Status" value={report.statusDetail || 'Belum Ada'} />
                        <DetailItem label="Unit Penanganan" value={getUnitName(report.assignedUnitId)} />
                        <DetailItem label="Personil Ditunjuk" value={getPersonnelNames(report.assignedPersonnelIds)} />
                    </dl>
                </div>

                {report.stolenVehicles && report.stolenVehicles.length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-primary mb-2">Data Kendaraan Terkait</h3>
                        {report.stolenVehicles.map((v, i) => (
                            <dl key={i} className="mb-2 p-2 border rounded dark:border-dark-700">
                                <DetailItem label="Jenis Kendaraan" value={v.vehicleType} />
                                <DetailItem label="No. Rangka" value={v.frameNumber} />
                                <DetailItem label="No. Mesin" value={v.engineNumber} />
                            </dl>
                        ))}
                    </div>
                )}

                 <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800">Tutup</button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportDetailModal;
