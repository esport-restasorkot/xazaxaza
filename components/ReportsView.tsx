
import React, { useState, useMemo, useEffect } from 'react';
import { Report, Unit, Personnel, UserRole, ReportStatus, ReportType, StatusDetail } from '../types';
import { PlusIcon, EditIcon, ShieldIcon, UserPlusIcon, Edit3Icon, ArrowUpIcon, ArrowDownIcon, SortIcon, EyeIcon, PrinterIcon } from './icons';
import Pagination from './Pagination';
import ReportFormModal from './ReportFormModal';
import AssignUnitModal from './AssignUnitModal';
import AssignPersonnelModal from './AssignPersonnelModal';
import UpdateStatusModal from './UpdateStatusModal';
import ReportDetailModal from './ReportDetailModal';
import Toast from './Toast';
import { supabase } from '../supabaseClient';
import ConfirmationModal from './ConfirmationModal';

interface ReportsViewProps {
    reports: Report[];
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
    personnel: Personnel[];
    units: Unit[];
    userRole: UserRole;
    operatorUnitId: string;
}

type SortDirection = 'ascending' | 'descending';
type SortableKeys = 'reportNumber' | 'spkt' | 'caseType' | 'reporterName' | 'reportDate' | 'status' | 'statusDetail' | 'assignedUnitId';

interface SortConfig {
    key: SortableKeys;
    direction: SortDirection;
}

const ReportsView: React.FC<ReportsViewProps> = ({ reports, setReports, personnel, units, userRole, operatorUnitId }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [notification, setNotification] = useState<string>('');

    // Modal States
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportToEdit, setReportToEdit] = useState<Report | null>(null);
    const [isAssignUnitModalOpen, setIsAssignUnitModalOpen] = useState(false);
    const [reportToAssignUnit, setReportToAssignUnit] = useState<Report | null>(null);
    const [isAssignPersonnelModalOpen, setIsAssignPersonnelModalOpen] = useState(false);
    const [reportToAssignPersonnel, setReportToAssignPersonnel] = useState<Report | null>(null);
    const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
    const [reportToUpdateStatus, setReportToUpdateStatus] = useState<Report | null>(null);
    const [reportToView, setReportToView] = useState<Report | null>(null);
    const [reportToDelete, setReportToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const getUnitName = (unitId?: string) => units.find(u => u.id === unitId)?.name || 'Belum Ditunjuk';
    
    const formatReportNumber = (report: Report) => {
        const typePrefix = report.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG';
        return `${typePrefix}-${report.reportNumber}`;
    };
    
    const processedReports = useMemo(() => {
        let reportsToFilter = reports;

        if (userRole === UserRole.OPERATOR) {
            reportsToFilter = reports.filter(r => r.assignedUnitId === operatorUnitId || r.assignedPersonnelIds.some(pId => {
                const p = personnel.find(p => p.id === pId);
                return p?.unitId === operatorUnitId;
            }));
        }

        if (statusFilter !== 'all') {
            reportsToFilter = reportsToFilter.filter(r => r.status === statusFilter);
        } else {
            // If filtering 'all', we should exclude 'Dihapus' status so they don't show up
            reportsToFilter = reportsToFilter.filter(r => r.status !== ReportStatus.DIHAPUS);
        }

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            reportsToFilter = reportsToFilter.filter(r =>
                r.reporterName.toLowerCase().includes(lowercasedTerm) ||
                r.caseType.toLowerCase().includes(lowercasedTerm) ||
                r.reportNumber.includes(lowercasedTerm) ||
                formatReportNumber(r).toLowerCase().includes(lowercasedTerm)
            );
        }
        
        if (sortConfig !== null) {
            reportsToFilter.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                switch(sortConfig.key) {
                    case 'reportNumber':
                        aValue = parseInt(a.reportNumber, 10);
                        bValue = parseInt(b.reportNumber, 10);
                        break;
                    case 'reportDate':
                        aValue = new Date(a.reportDate).getTime();
                        bValue = new Date(b.reportDate).getTime();
                        break;
                    case 'assignedUnitId':
                        aValue = getUnitName(a.assignedUnitId);
                        bValue = getUnitName(b.assignedUnitId);
                        break;
                    default:
                        aValue = a[sortConfig.key] || '';
                        bValue = b[sortConfig.key] || '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        } else {
            // Default sort
            reportsToFilter.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
        }

        return reportsToFilter;

    }, [reports, userRole, operatorUnitId, statusFilter, searchTerm, personnel, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'descending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
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
    const currentItems = processedReports.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Modal Handlers
    const openReportModal = (report: Report | null = null) => {
        setReportToEdit(report);
        setIsReportModalOpen(true);
    };

    const openAssignUnitModal = (report: Report) => {
        setReportToAssignUnit(report);
        setIsAssignUnitModalOpen(true);
    };

    const openAssignPersonnelModal = (report: Report) => {
        setReportToAssignPersonnel(report);
        setIsAssignPersonnelModalOpen(true);
    };

    const openUpdateStatusModal = (report: Report) => {
        setReportToUpdateStatus(report);
        setIsUpdateStatusModalOpen(true);
    };

    const openDetailModal = (report: Report) => {
        setReportToView(report);
    };

    const handleDelete = (reportId: string) => {
        setReportToDelete(reportId);
    };
    
    const confirmDelete = async () => {
        if (!reportToDelete) return;
        setIsDeleting(true);
        try {
             // Fallback / Replacement: Soft Delete using Client Side Update
             // This replaces the Edge Function call that was failing.
            const { error: updateError } = await supabase
                .from('reports')
                .update({ 
                    status: ReportStatus.DIHAPUS, 
                    status_detail: StatusDetail.DIHAPUS 
                })
                .eq('id', reportToDelete);

            if (updateError) throw updateError;
            
            // Optional: Add to history
            await supabase.from('status_history').insert({
                report_id: reportToDelete,
                status: ReportStatus.DIHAPUS,
                status_detail: StatusDetail.DIHAPUS,
                description: 'Laporan dihapus (Soft Delete)',
                updated_by: userRole
            });

            // Update UI by removing the deleted item from the local state
            setReports(reports.filter(r => r.id !== reportToDelete));
            setNotification('Laporan berhasil dihapus.');
    
        } catch (error: any) {
            console.error("Delete operation failed:", error);
            alert(`Gagal menghapus laporan: ${error.message}`);
        } finally {
            setIsDeleting(false);
            setReportToDelete(null);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    const printTitle = `Daftar Laporan (${statusFilter === 'all' ? 'Semua Status' : statusFilter})`;
    const printDate = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });

    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg printable-container" data-title={printTitle} data-date={printDate}>
            {notification && <Toast message={notification} onClose={() => setNotification('')} />}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 no-print">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Daftar Laporan</h1>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Cari laporan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border border-gray-300 rounded w-full md:w-auto bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">Semua Status</option>
                        <option value={ReportStatus.PROSES}>Proses</option>
                        <option value={ReportStatus.SELESAI}>Selesai</option>
                    </select>
                    <button onClick={handlePrint} className="flex items-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">
                        <PrinterIcon className="h-5 w-5"/>
                        <span className="ml-2 hidden sm:inline">Cetak</span>
                    </button>
                    {userRole === UserRole.ADMIN && (
                        <button onClick={() => openReportModal()} className="flex items-center bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded whitespace-nowrap">
                            <PlusIcon />
                            <span className="ml-2 hidden sm:inline">Tambah</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                        <tr>
                            <SortableHeader label="No. Laporan" sortKey="reportNumber" className="w-1/12"/>
                            <SortableHeader label="Tgl Lap" sortKey="reportDate" className="w-1/12" />
                            <SortableHeader label="Kasus" sortKey="caseType" className="w-2/12"/>
                            <SortableHeader label="Pelapor" sortKey="reporterName" className="w-2/12"/>
                            <SortableHeader label="Status" sortKey="status" className="w-1/12"/>
                            <SortableHeader label="Ket. Status" sortKey="statusDetail" className="w-1/12"/>
                            <SortableHeader label="Unit" sortKey="assignedUnitId" className="w-2/12"/>
                            <th scope="col" className="px-6 py-3 w-2/12">Anggota</th>
                            <th scope="col" className="px-6 py-3 text-right no-print">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(report => (
                            <tr key={report.id} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                    {formatReportNumber(report)}
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(report.reportDate).toLocaleDateString('id-ID')}
                                </td>
                                <td className="px-6 py-4">{report.caseType}</td>
                                <td className="px-6 py-4">{report.reporterName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${report.status === ReportStatus.PROSES ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{report.statusDetail || 'Belum Ada'}</td>
                                <td className="px-6 py-4">{getUnitName(report.assignedUnitId)}</td>
                                <td className="px-6 py-4 text-xs">
                                    {report.assignedPersonnelIds.length > 0
                                        ? report.assignedPersonnelIds.map(id => personnel.find(p => p.id === id)?.name || '').join(', ')
                                        : 'Belum Ditunjuk'
                                    }
                                </td>
                                <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap no-print">
                                    {/* Common action: View Details */}
                                    <button onClick={() => openDetailModal(report)} className="p-1 text-blue-500 hover:text-blue-700" title="Lihat Detail Laporan"><EyeIcon /></button>

                                    {/* Admin-only Actions */}
                                    {userRole === UserRole.ADMIN && (
                                        <>
                                            {/* Conditional "Tunjuk Unit" button */}
                                            {!report.assignedUnitId ? (
                                                <button onClick={() => openAssignUnitModal(report)} className="p-1 text-white bg-indigo-500 rounded hover:bg-indigo-600 animate-pulse" title="Tunjuk Unit">
                                                    <ShieldIcon width="16" height="16"/>
                                                </button>
                                            ) : (
                                                <button onClick={() => openAssignUnitModal(report)} className="p-1 text-indigo-500 hover:text-indigo-700" title="Ubah Unit">
                                                    <ShieldIcon width="16" height="16"/>
                                                </button>
                                            )}
                                            
                                            <button onClick={() => openReportModal(report)} className="p-1 text-yellow-500 hover:text-yellow-700" title="Edit Laporan"><EditIcon /></button>
                                        </>
                                    )}

                                    {/* Operator-only Actions */}
                                    {userRole === UserRole.OPERATOR && (
                                        <>
                                            <button onClick={() => openUpdateStatusModal(report)} className="p-1 text-green-500 hover:text-green-700" title="Update Status"><Edit3Icon /></button>
                                            
                                            {/* Operator can assign personnel if a unit is assigned */}
                                            {report.assignedUnitId && ( 
                                                report.assignedPersonnelIds.length === 0 ? (
                                                    <button onClick={() => openAssignPersonnelModal(report)} className="p-1 text-white bg-purple-500 rounded hover:bg-purple-600 animate-pulse" title="Tunjuk Personil">
                                                        <UserPlusIcon />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openAssignPersonnelModal(report)} className="p-1 text-purple-500 hover:text-purple-700" title="Ubah Personil">
                                                        <UserPlusIcon />
                                                    </button>
                                                )
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="no-print">
                <Pagination itemsPerPage={itemsPerPage} totalItems={processedReports.length} currentPage={currentPage} paginate={paginate} />
            </div>
            
            {isReportModalOpen && <ReportFormModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} setReports={setReports} reportToEdit={reportToEdit} onActionSuccess={setNotification}/>}
            {isAssignUnitModalOpen && reportToAssignUnit && <AssignUnitModal isOpen={isAssignUnitModalOpen} onClose={() => setIsAssignUnitModalOpen(false)} report={reportToAssignUnit} units={units} setReports={setReports} onActionSuccess={setNotification} />}
            {isAssignPersonnelModalOpen && reportToAssignPersonnel && <AssignPersonnelModal isOpen={isAssignPersonnelModalOpen} onClose={() => setIsAssignPersonnelModalOpen(false)} report={reportToAssignPersonnel} personnel={personnel.filter(p => p.unitId === reportToAssignPersonnel.assignedUnitId)} setReports={setReports} onActionSuccess={setNotification} />}
            {isUpdateStatusModalOpen && reportToUpdateStatus && <UpdateStatusModal isOpen={isUpdateStatusModalOpen} onClose={() => setIsUpdateStatusModalOpen(false)} report={reportToUpdateStatus} setReports={setReports} userRole={userRole} onUpdateSuccess={setNotification} />}
            {reportToView && (
                <ReportDetailModal
                    isOpen={!!reportToView}
                    onClose={() => setReportToView(null)}
                    report={reportToView}
                    units={units}
                    personnel={personnel}
                />
            )}
            {reportToDelete && (
                <ConfirmationModal
                    isOpen={!!reportToDelete}
                    onClose={() => setReportToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Konfirmasi Hapus Laporan"
                    message="Apakah Anda yakin ingin menghapus laporan ini? Laporan akan ditandai sebagai dihapus."
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};

export default ReportsView;
