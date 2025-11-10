
import React, { useState, useMemo, useEffect } from 'react';
import { Report, Unit, Personnel, VehicleDetail, ReportType } from '../types';
import Pagination from './Pagination';
import ReportDetailModal from './ReportDetailModal';
import { EyeIcon, SortIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

// Create a new interface for flattened vehicle data
interface FlatVehicle extends VehicleDetail {
    report: Report;
}

interface VehiclesViewProps {
    reports: Report[];
    units: Unit[];
    personnel: Personnel[];
}

type SortableKeys = 'reportNumber' | 'vehicleType' | 'frameNumber' | 'engineNumber' | 'reportDate' | 'unit';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: SortableKeys;
    direction: SortDirection;
}

const VehiclesView: React.FC<VehiclesViewProps> = ({ reports, units, personnel }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState('');
    const [reportToView, setReportToView] = useState<Report | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const getUnitName = (unitId?: string) => units.find(u => u.id === unitId)?.name || 'Belum Ditunjuk';
    
    const formatReportNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        const model = report.policeModel ? `/${report.policeModel}` : '';
        return `${typePrefix}${model}/${report.reportNumber}/${report.reportYear}`;
    };

    const allStolenVehicles = useMemo((): FlatVehicle[] => {
        const vehicles: FlatVehicle[] = [];
        reports.forEach(report => {
            if (report.stolenVehicles) {
                report.stolenVehicles.forEach(vehicle => {
                    vehicles.push({
                        ...vehicle,
                        report: report,
                    });
                });
            }
        });
        // Default sort by most recent report date
        vehicles.sort((a, b) => new Date(b.report.reportDate).getTime() - new Date(a.report.reportDate).getTime());
        return vehicles;
    }, [reports]);

    const filteredVehicles = useMemo(() => {
        let tempVehicles: FlatVehicle[] = allStolenVehicles;
        
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            tempVehicles = tempVehicles.filter(v =>
                v.vehicleType.toLowerCase().includes(lowercasedTerm) ||
                v.frameNumber.toLowerCase().includes(lowercasedTerm) ||
                v.engineNumber.toLowerCase().includes(lowercasedTerm) ||
                v.report.reportNumber.includes(lowercasedTerm) ||
                v.report.reporterName.toLowerCase().includes(lowercasedTerm)
            );
        }

        if (sortConfig !== null) {
            tempVehicles.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                switch(sortConfig.key) {
                    case 'reportNumber':
                        aValue = formatReportNumber(a.report);
                        bValue = formatReportNumber(b.report);
                        break;
                    case 'reportDate':
                        aValue = new Date(a.report.reportDate).getTime();
                        bValue = new Date(b.report.reportDate).getTime();
                        break;
                    case 'unit':
                        aValue = getUnitName(a.report.assignedUnitId);
                        bValue = getUnitName(b.report.assignedUnitId);
                        break;
                    default: // vehicleType, frameNumber, engineNumber
                        aValue = a[sortConfig.key as keyof FlatVehicle] as string || '';
                        bValue = b[sortConfig.key as keyof FlatVehicle] as string || '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return tempVehicles;
    }, [allStolenVehicles, searchTerm, sortConfig, units]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortConfig]);

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
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    
    const openDetailModal = (report: Report) => {
        setReportToView(report);
    };

    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Data Kendaraan Hilang (Curanmor)</h1>
                <input
                    type="text"
                    placeholder="Cari kendaraan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded w-full md:w-auto bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader label="No. Laporan" sortKey="reportNumber" />
                            <SortableHeader label="Jenis Kendaraan" sortKey="vehicleType" />
                            <SortableHeader label="No. Rangka" sortKey="frameNumber" />
                            <SortableHeader label="No. Mesin" sortKey="engineNumber" />
                            <SortableHeader label="Tgl Laporan" sortKey="reportDate" />
                            <SortableHeader label="Unit" sortKey="unit" />
                            <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((vehicle, index) => (
                            <tr key={`${vehicle.report.id}-${vehicle.id}-${index}`} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {formatReportNumber(vehicle.report)}
                                </td>
                                <td className="px-6 py-4">{vehicle.vehicleType}</td>
                                <td className="px-6 py-4">{vehicle.frameNumber}</td>
                                <td className="px-6 py-4">{vehicle.engineNumber}</td>
                                <td className="px-6 py-4">{new Date(vehicle.report.reportDate).toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4">{getUnitName(vehicle.report.assignedUnitId)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openDetailModal(vehicle.report)} className="p-1 text-blue-500 hover:text-blue-700" title="Lihat Detail Laporan">
                                        <EyeIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {currentItems.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    Tidak ada data kendaraan yang cocok.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination itemsPerPage={itemsPerPage} totalItems={filteredVehicles.length} currentPage={currentPage} paginate={paginate} />

            {reportToView && (
                <ReportDetailModal
                    isOpen={!!reportToView}
                    onClose={() => setReportToView(null)}
                    report={reportToView}
                    units={units}
                    personnel={personnel}
                />
            )}
        </div>
    );
};

export default VehiclesView;
