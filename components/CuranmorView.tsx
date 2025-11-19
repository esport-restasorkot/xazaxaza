
import React, { useState, useMemo } from 'react';
import { StolenVehicle, Report, ReportType, UserRole } from '../types';
import { PlusIcon, EditIcon } from './icons';
import CuranmorFormModal from './CuranmorFormModal';
import Pagination from './Pagination';

interface CuranmorViewProps {
    stolenVehicles: StolenVehicle[];
    setStolenVehicles: React.Dispatch<React.SetStateAction<StolenVehicle[]>>;
    reports: Report[];
    userRole: UserRole;
}

const CuranmorView: React.FC<CuranmorViewProps> = ({ stolenVehicles, setStolenVehicles, reports, userRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [vehicleToEdit, setVehicleToEdit] = useState<StolenVehicle | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    
    const reportMap = useMemo(() => {
        return new Map(reports.map(r => [r.id, r]));
    }, [reports]);

    const formatReportNumber = (report?: Report) => {
        if (!report) return 'N/A';
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        return `${typePrefix}-${report.reportNumber}/${report.reportYear}`;
    };

    const openModal = (vehicle: StolenVehicle | null = null) => {
        setVehicleToEdit(vehicle);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setVehicleToEdit(null);
        setIsModalOpen(false);
    };

    const handleDelete = (vehicleId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data kendaraan ini?')) {
            setStolenVehicles(stolenVehicles.filter(v => v.id !== vehicleId));
        }
    };
    
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = stolenVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            <div className="flex justify-end items-center mb-4">
                <button onClick={() => openModal()} className="flex items-center bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    <PlusIcon />
                    <span className="ml-2">Tambah Data</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">No. LP</th>
                            <th scope="col" className="px-6 py-3">Jenis Kendaraan</th>
                            <th scope="col" className="px-6 py-3">No. Rangka</th>
                            <th scope="col" className="px-6 py-3">No. Mesin</th>
                            <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(vehicle => {
                            const report = reportMap.get(vehicle.reportId);
                            return (
                                <tr key={vehicle.id} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatReportNumber(report)}</td>
                                    <td className="px-6 py-4">{vehicle.vehicleType}</td>
                                    <td className="px-6 py-4">{vehicle.frameNumber}</td>
                                    <td className="px-6 py-4">{vehicle.engineNumber}</td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => openModal(vehicle)} className="p-1 text-yellow-500 hover:text-yellow-700" title="Edit Data"><EditIcon /></button>
                                    </td>
                                </tr>
                            );
                        })}
                         {currentItems.length === 0 && (
                            <tr className="bg-white border-b dark:bg-dark-900 dark:border-dark-700">
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    Tidak ada data curanmor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination itemsPerPage={itemsPerPage} totalItems={stolenVehicles.length} currentPage={currentPage} paginate={paginate} />
            
            {isModalOpen && (
                <CuranmorFormModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    setStolenVehicles={setStolenVehicles}
                    vehicleToEdit={vehicleToEdit}
                    reports={reports}
                    stolenVehicles={stolenVehicles}
                />
            )}
        </div>
    );
};

export default CuranmorView;
