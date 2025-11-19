
import React, { useMemo, useState } from 'react';
import { FileTextIcon, MotorcycleIcon } from './icons';
import { UserRole, Unit, Report, ReportType, ReportStatus, Personnel, StatusDetail } from '../types';

interface DashboardProps {
  reports: Report[];
  userRole?: UserRole;
  operatorUnitId?: string;
  units: Unit[];
  personnel: Personnel[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-dark-900 rounded-lg shadow p-5 flex justify-between items-center border-l-4 ${color}`}>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
        </div>
        <div className={`text-3xl opacity-70 ${color.replace('border-', 'text-')}`}>
            {icon}
        </div>
    </div>
);

const HorizontalBarChart: React.FC<{ title: string; data: { name: string; count: number }[]; color: string; }> = ({ title, data, color }) => {
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 h-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h3>
                <div className="flex items-center justify-center h-4/5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak tersedia.</p>
                </div>
            </div>
        );
    }
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return (
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6 h-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h3>
            <div className="space-y-4">
                {data.map(({ name, count }) => (
                    <div key={name} className="flex items-center text-sm" title={`${name}: ${count}`}>
                        <div className="w-2/5 text-gray-600 dark:text-gray-300 truncate pr-2">{name}</div>
                        <div className="w-3/5 flex items-center">
                            <div className="w-full bg-gray-100 dark:bg-dark-800 rounded-full h-2">
                                <div
                                    className={`${color} h-2 rounded-full transition-all duration-500`}
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                ></div>
                            </div>
                            <div className="ml-3 w-8 text-right font-medium text-gray-700 dark:text-gray-200">{count}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface MonthlyData {
    label: string;
    total: number;
    selesai: number;
}
const YearlyTrendChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.total), 1);
    const hasData = data.some(d => d.total > 0);
    const currentYear = new Date().getFullYear();

    return (
        <div className="bg-white dark:bg-dark-900 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100">Tren Laporan Tahunan</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Data untuk tahun {currentYear}</p>
             
            {!hasData ? (
                 <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-dark-800/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak cukup untuk menampilkan grafik.</p>
                </div>
            ) : (
                <div className="overflow-x-auto pb-4">
                    <div className="flex items-end h-64 border-l border-b border-gray-200 dark:border-dark-700 pl-4 pt-4 gap-4" style={{ minWidth: '40rem' }}>
                        {data.map(month => (
                            <div key={month.label} className="flex flex-col items-center h-full justify-end flex-1" title={`Bulan: ${month.label}\nTotal: ${month.total}\nSelesai: ${month.selesai}`}>
                                 <div className="flex items-end h-full gap-1.5">
                                    <div className="w-4 bg-info rounded-t transition-all duration-500 hover:opacity-80" style={{ height: `${(month.total / maxCount) * 100}%` }}></div>
                                    <div className="w-4 bg-success rounded-t transition-all duration-500 hover:opacity-80" style={{ height: `${(month.selesai / maxCount) * 100}%` }}></div>
                                </div>
                                <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{month.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             <div className="flex justify-center items-center space-x-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center"><span className="w-3 h-3 bg-info mr-2 rounded"></span>Total Laporan</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-success mr-2 rounded"></span>Laporan Selesai</div>
            </div>
        </div>
    );
};

interface ReportAnalyticsSectionProps {
    reports: Report[];
    units: Unit[];
    personnel: Personnel[];
    userRole?: UserRole;
}

const ReportAnalyticsSection: React.FC<ReportAnalyticsSectionProps> = ({ reports, units, personnel, userRole }) => {
    
    const stats = useMemo(() => ({
        totalReports: reports.length,
        openCases: reports.filter(r => r.status === ReportStatus.PROSES).length,
        closedCases: reports.filter(r => r.status === ReportStatus.SELESAI).length,
        totalVehicles: reports.reduce((acc, report) => acc + (report.stolenVehicles?.length || 0), 0),
    }), [reports]);

    const topCases = useMemo(() => {
        const caseCounts = reports.reduce((acc, report) => {
          acc[report.caseType] = (acc[report.caseType] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        return Object.entries(caseCounts)
          // FIX: The values from Object.entries are not strongly typed as numbers, so they must be cast for the arithmetic sort operation.
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 7)
          .map(([name, count]) => ({ name, count }));
    }, [reports]);

    const monthlyData = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const months = Array(12).fill(0).map((_, i) => {
            const d = new Date(currentYear, i, 1);
            return {
                label: d.toLocaleString('id-ID', { month: 'short' }),
                year: currentYear,
                month: i,
                total: 0,
                selesai: 0,
            };
        });

        reports.forEach(report => {
            const reportDate = new Date(report.reportDate);
            const reportYear = reportDate.getFullYear();

            if (reportYear === currentYear) {
                const reportMonth = reportDate.getMonth();
                const monthBin = months[reportMonth];
                if (monthBin) {
                    monthBin.total++;
                    if (report.status === ReportStatus.SELESAI) monthBin.selesai++;
                }
            }
        });

        return months;
    }, [reports]);

    const topUnits = useMemo(() => {
        if (userRole !== UserRole.ADMIN) return [];
        const unitCounts = reports.reduce((acc, report) => {
            if (report.assignedUnitId) {
                acc[report.assignedUnitId] = (acc[report.assignedUnitId] || 0) + 1;
            }
            return acc;
        }, {} as { [key: string]: number });

        const unitMap = new Map(units.map(u => [u.id, u.name]));

        return Object.entries(unitCounts)
            .map(([unitId, count]) => ({ name: unitMap.get(unitId) || 'Unit Tidak Dikenal', count }))
            .filter(u => u.name !== 'Unit Tidak Dikenal')
            // FIX: The count property is not strongly typed as a number, so it must be cast for the arithmetic sort operation.
            .sort((a, b) => (b.count as number) - (a.count as number))
            .slice(0, 5);
    }, [reports, units, userRole]);

    const topPersonnel = useMemo(() => {
        if (userRole !== UserRole.ADMIN) return [];
        const personnelCounts: { [key: string]: number } = {};
        reports
            .filter(r => r.statusDetail === StatusDetail.P21)
            .forEach(r => {
                r.assignedPersonnelIds.forEach(pId => {
                    personnelCounts[pId] = (personnelCounts[pId] || 0) + 1;
                });
            });
        
        const personnelMap = new Map(personnel.map(p => [p.id, p]));

        return Object.entries(personnelCounts)
            .map(([personnelId, count]) => {
                // FIX: Add type assertion to resolve 'unknown' type for `p` from `personnelMap.get`.
                // This allows accessing `rank` and `name` properties after the truthiness check.
                const p = personnelMap.get(personnelId) as Personnel;
                const name = p ? `${p.rank} ${p.name}` : 'Personil Tidak Dikenal';
                return { name, count };
            })
            .filter(p => p.name !== 'Personil Tidak Dikenal' && p.count > 0)
            // FIX: The count property is not strongly typed as a number, so it must be cast for the arithmetic sort operation.
            .sort((a, b) => (b.count as number) - (a.count as number))
            .slice(0, 5);

    }, [reports, personnel, userRole]);

    if (reports.length === 0) {
        return (
            <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">Tidak ada data laporan untuk ditampilkan pada kategori ini.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Total Laporan" value={stats.totalReports} icon={<FileTextIcon />} color="border-info" />
                <StatCard title="Proses" value={stats.openCases} icon={<FileTextIcon />} color="border-warning" />
                <StatCard title="Selesai" value={stats.closedCases} icon={<FileTextIcon />} color="border-success" />
                <StatCard title="Curanmor" value={stats.totalVehicles} icon={<MotorcycleIcon />} color="border-danger" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-5">
                    <YearlyTrendChart data={monthlyData} />
                </div>
                <div className="lg:col-span-3">
                    <HorizontalBarChart title="Kasus Terbanyak" data={topCases} color="bg-primary" />
                </div>
                {userRole === UserRole.ADMIN && (
                    <div className="lg:col-span-2 space-y-6">
                         <HorizontalBarChart title="Top 5 Unit" data={topUnits} color="bg-indigo-500" />
                         <HorizontalBarChart title="Top 5 Anggota (P21)" data={topPersonnel} color="bg-green-600" />
                    </div>
                )}
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ reports, userRole, operatorUnitId, units, personnel }) => {
  const [activeTab, setActiveTab] = useState<'laporanPolisi' | 'pengaduanMasyarakat'>('laporanPolisi');

  const unitName = useMemo(() => {
    if (userRole === UserRole.OPERATOR && operatorUnitId && units) {
        return units.find(u => u.id === operatorUnitId)?.name;
    }
    return null;
  }, [userRole, operatorUnitId, units]);

  const filteredReports = useMemo(() => {
    if (userRole === UserRole.OPERATOR && operatorUnitId) {
        return reports.filter(r => r.assignedUnitId === operatorUnitId);
    }
    return reports;
  }, [reports, userRole, operatorUnitId]);
  
  const policeReports = useMemo(() => filteredReports.filter(r => r.reportType === ReportType.LAPORAN_POLISI), [filteredReports]);
  const complaintReports = useMemo(() => filteredReports.filter(r => r.reportType === ReportType.PENGADUAN_MASYARAKAT), [filteredReports]);

  const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`py-3 px-1 sm:px-4 font-semibold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-800 rounded-t-md ${
            isActive
                ? 'border-b-2 border-primary text-primary'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {children}
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
        {unitName ? `Dashboard - ${unitName}` : 'Dashboard Analitik'}
      </h1>

      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="-mb-px flex space-x-2 sm:space-x-6" aria-label="Tabs">
            <TabButton isActive={activeTab === 'laporanPolisi'} onClick={() => setActiveTab('laporanPolisi')}>
                Laporan Polisi (LP)
            </TabButton>
            <TabButton isActive={activeTab === 'pengaduanMasyarakat'} onClick={() => setActiveTab('pengaduanMasyarakat')}>
                Pengaduan Masyarakat
            </TabButton>
        </nav>
      </div>
      
      <div className="mt-6">
        {activeTab === 'laporanPolisi' && (
            <ReportAnalyticsSection reports={policeReports} units={units} personnel={personnel} userRole={userRole}/>
        )}
        {activeTab === 'pengaduanMasyarakat' && (
            <ReportAnalyticsSection reports={complaintReports} units={units} personnel={personnel} userRole={userRole}/>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
