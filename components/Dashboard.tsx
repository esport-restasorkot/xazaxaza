import React, { useMemo } from 'react';
import { FileTextIcon } from './icons';
import { UserRole, Unit, Report, ReportType, ReportStatus } from '../types';

interface DashboardProps {
  reports: Report[];
  userRole?: UserRole;
  operatorUnitId?: string;
  units?: Unit[];
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`rounded-lg shadow-lg p-6 flex items-center space-x-4 ${color}`}>
    <div className="text-4xl">{icon}</div>
    <div>
      <p className="text-md font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  </div>
);

const TopCasesChart: React.FC<{ data: [string, number][] }> = ({ data }) => {
    const maxCount = data[0]?.[1] || 1;
    if (data.length === 0) {
        return (
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">10 Kasus Terbanyak</h3>
                <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak cukup untuk menampilkan grafik.</p>
                </div>
            </div>
        );
    }
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">10 Kasus Terbanyak</h3>
            <div className="space-y-3">
                {data.map(([caseType, count]) => (
                    <div key={caseType} className="flex items-center" title={`${caseType}: ${count}`}>
                        <div className="w-1/3 text-sm text-gray-600 dark:text-gray-300 truncate pr-2">{caseType}</div>
                        <div className="w-2/3 bg-gray-200 dark:bg-dark-800 rounded-full h-5">
                            <div
                                className="bg-primary h-5 rounded-full flex items-center justify-end px-2 text-white text-xs font-bold transition-all duration-500"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                            >
                                {count}
                            </div>
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
    const currentYear = 2025; // Target year

    if (!hasData) {
        return (
            <div>
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Laporan Tahun {currentYear}</h3>
                 <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data tidak cukup untuk menampilkan grafik.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Laporan Tahun {currentYear}</h3>
            <div className="overflow-x-auto pb-4">
                <div className="flex items-end h-64 border-l border-b border-gray-300 dark:border-dark-700 pl-4 pt-4 gap-4" style={{ minWidth: '40rem' }}>
                    {data.map(month => (
                        <div key={month.label} className="flex flex-col items-center h-full justify-end flex-grow">
                             <div className="flex items-end h-full gap-1" title={`Bulan: ${month.label}\nTotal: ${month.total}\nSelesai: ${month.selesai}`}>
                                {/* Total Bar */}
                                <div className="w-4 bg-info rounded-t-md" style={{ height: `${(month.total / maxCount) * 100}%` }}></div>
                                {/* Selesai Bar */}
                                <div className="w-4 bg-success rounded-t-md" style={{ height: `${(month.selesai / maxCount) * 100}%` }}></div>
                            </div>
                            <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{month.label}</div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex justify-center space-x-4 mt-4 text-xs">
                <div className="flex items-center"><span className="w-3 h-3 bg-info mr-1 rounded-sm"></span>Crime Total</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-success mr-1 rounded-sm"></span>Crime Clearance</div>
            </div>
        </div>
    );
};

const ReportAnalyticsSection: React.FC<{ title: string; reports: Report[] }> = ({ title, reports }) => {
    
    const stats = useMemo(() => ({
        totalReports: reports.length,
        openCases: reports.filter(r => r.status === ReportStatus.PROSES).length,
        closedCases: reports.filter(r => r.status === ReportStatus.SELESAI).length,
    }), [reports]);

    const topCases = useMemo(() => {
        const caseCounts = reports.reduce((acc, report) => {
          acc[report.caseType] = (acc[report.caseType] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        return Object.entries(caseCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
    }, [reports]);

    const monthlyData = useMemo(() => {
        const currentYear = 2025; // Target year
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
                const reportMonth = reportDate.getMonth(); // 0 for Jan, 11 for Dec
                const monthBin = months[reportMonth];
                if (monthBin) {
                    monthBin.total++;
                    if (report.status === ReportStatus.SELESAI) monthBin.selesai++;
                }
            }
        });

        return months;
    }, [reports]);

    if (reports.length === 0) {
        return (
            <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">{title}</h2>
                <p className="text-gray-500 dark:text-gray-400">Tidak ada data laporan untuk ditampilkan.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Laporan" value={stats.totalReports} icon={<FileTextIcon className="h-10 w-10" />} color="bg-info text-white" />
                <StatCard title="Total Proses" value={stats.openCases} icon={<FileTextIcon className="h-10 w-10" />} color="bg-warning text-white" />
                <StatCard title="Total Selesai" value={stats.closedCases} icon={<FileTextIcon className="h-10 w-10" />} color="bg-success text-white" />
            </div>

            <div className="space-y-8">
                <YearlyTrendChart data={monthlyData} />
                <TopCasesChart data={topCases} />
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ reports, userRole, operatorUnitId, units }) => {
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
  // FIX: Corrected a potential typo or hidden character issue in the enum member access causing the error.
  const complaintReports = useMemo(() => filteredReports.filter(r => r.reportType === ReportType.PENGADUAN_MASYARAKAT), [filteredReports]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {unitName ? `Dashboard - ${unitName}` : 'Dashboard'}
      </h1>
      <div className="space-y-8">
        <ReportAnalyticsSection title="Data Laporan Polisi (LP)" reports={policeReports} />
        <ReportAnalyticsSection title="Data Pengaduan Masyarakat" reports={complaintReports} />
      </div>
    </div>
  );
};

export default Dashboard;