
import React, { useState, useMemo } from 'react';
import { Report, ReportStatus, StatusDetail, UserRole } from '../types';
import { FileTextIcon } from './icons';

// Declare XLSX to be available globally from the script tag in index.html
declare const XLSX: any;

interface CrimeDataViewProps {
    reports: Report[];
    userRole: UserRole;
    operatorUnitId: string;
}

interface CrimeSummaryItem {
    total: number;
    selesai: number;
    lidik: number;
    sidik: number;
    p21: number;
    diversi: number;
    rj: number;
    sp3: number;
}

interface CrimeDataSummary {
    [caseType: string]: CrimeSummaryItem;
}

interface TrendData {
    data: { [caseType: string]: ({ total: number; selesai: number })[] };
    monthLabels: string[];
}

const CrimeDataView: React.FC<CrimeDataViewProps> = ({ reports, userRole, operatorUnitId }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState<'trend' | 'summary'>('trend');

    const reportsForView = useMemo(() => {
        if (userRole === UserRole.OPERATOR) {
            return reports.filter(r => r.assignedUnitId === operatorUnitId);
        }
        return reports;
    }, [reports, userRole, operatorUnitId]);

    const filteredReports = useMemo(() => {
        if (!startDate || !endDate) {
            return reportsForView;
        }
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + 86400000; // Include the whole end day

        return reportsForView.filter(report => {
            const reportDate = new Date(report.reportDate).getTime();
            return reportDate >= start && reportDate <= end;
        });
    }, [reportsForView, startDate, endDate]);

    const crimeData = useMemo<CrimeDataSummary>(() => {
        // FIX: Replaced `reduce` with a `for...of` loop to fix type inference issues.
        const data: CrimeDataSummary = {};
        for (const report of filteredReports) {
            const { caseType, status, statusDetail } = report;
            if (!data[caseType]) {
                data[caseType] = { total: 0, selesai: 0, lidik: 0, sidik: 0, p21: 0, diversi: 0, rj: 0, sp3: 0 };
            }

            const summary = data[caseType];
            summary.total++;
            if (status === ReportStatus.SELESAI) summary.selesai++;
            if (statusDetail === StatusDetail.LIDIK) summary.lidik++;
            if (statusDetail === StatusDetail.SIDIK) summary.sidik++;
            if (statusDetail === StatusDetail.P21) summary.p21++;
            if (statusDetail === StatusDetail.DIVERSI) summary.diversi++;
            if (statusDetail === StatusDetail.RJ) summary.rj++;
            if (statusDetail === StatusDetail.SP3) summary.sp3++;
        }
        return data;
    }, [filteredReports]);

    const totals = useMemo<CrimeSummaryItem>(() => {
        const initialTotals: CrimeSummaryItem = { total: 0, selesai: 0, lidik: 0, sidik: 0, p21: 0, diversi: 0, rj: 0, sp3: 0 };
        
        // FIX: Replaced reduce with a for...of loop for robustness against type inference issues.
        // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
        for (const data of Object.values(crimeData) as CrimeSummaryItem[]) {
            initialTotals.total += data.total;
            initialTotals.selesai += data.selesai;
            initialTotals.lidik += data.lidik;
            initialTotals.sidik += data.sidik;
            initialTotals.p21 += data.p21;
            initialTotals.diversi += data.diversi;
            initialTotals.rj += data.rj;
            initialTotals.sp3 += data.sp3;
        }
        return initialTotals;

    }, [crimeData]);

    const trendData = useMemo<TrendData>(() => {
        const now = new Date();
        const monthLabels: string[] = [];
        const monthStartDates: Date[] = [];

        // Get labels and start dates for the last 3 months
        for (let i = 2; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthLabels.push(date.toLocaleString('id-ID', { month: 'long' }));
            monthStartDates.push(date);
        }

        const data: { [caseType: string]: ({ total: number; selesai: number })[] } = {};

        reportsForView.forEach(report => {
            const reportDate = new Date(report.reportDate);
            let monthIndex = -1;
            
            // Determine which month the report belongs to, starting from the most recent
            if (reportDate >= monthStartDates[2]) {
                monthIndex = 2;
            } else if (reportDate >= monthStartDates[1]) {
                monthIndex = 1;
            } else if (reportDate >= monthStartDates[0]) {
                monthIndex = 0;
            }

            if (monthIndex > -1) {
                const { caseType, status } = report;
                if (!data[caseType]) {
                    // Initialize array for 3 months
                    data[caseType] = Array(3).fill(null).map(() => ({ total: 0, selesai: 0 }));
                }

                data[caseType][monthIndex].total++;
                if (status === ReportStatus.SELESAI) {
                    data[caseType][monthIndex].selesai++;
                }
            }
        });
        
        // FIX: Replaced `reduce` with a loop to fix type inference issues when creating the filtered data object.
        const filteredData: TrendData['data'] = {};
        Object.entries(data)
            .filter(([, values]) => values.some(v => v.total > 0))
            .forEach(([caseType, values]) => {
                filteredData[caseType] = values;
            });


        return { data: filteredData, monthLabels };

    }, [reportsForView]);


    const handleReset = () => {
        setStartDate('');
        setEndDate('');
    }

    const handleSummaryExport = () => {
        const headers = ['Kasus', 'Total', 'Selesai', 'Lidik', 'Sidik', 'P21', 'Diversi', 'RJ', 'SP3'];
    
        const dataRows = Object.entries(crimeData).map(([caseType, dataValue]) => {
            // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
            const data = dataValue as CrimeSummaryItem;
            return [
                caseType, data.total, data.selesai, data.lidik, data.sidik,
                data.p21, data.diversi, data.rj, data.sp3,
            ];
        });
    
        const totalRow = [
            'Total', totals.total, totals.selesai, totals.lidik, totals.sidik,
            totals.p21, totals.diversi, totals.rj, totals.sp3,
        ];

        const title = [`Rekapitulasi Data Gangguan Kamtibmas`];
        const dateRange = (startDate && endDate) 
            ? [`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`] 
            : [`Periode: Semua Data`];
    
        const finalData = [ title, dateRange, [], headers, ...dataRows, totalRow ];
    
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        ws['!cols'] = [
            { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
            { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        ];
    
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi GK');
    
        const fileName = `Rekapitulasi_GK_${startDate || 'semua'}_${endDate || 'data'}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleTrendExport = () => {
        const title = [`Tren Kasus 3 Bulan Terakhir`];
        
        // FIX: Replaced flatMap with reduce for wider JS engine compatibility.
        // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
        const headers = ['Kasus', ...(trendData as TrendData).monthLabels.reduce<string[]>((acc, label) => acc.concat([`${label} Total`, `${label} Selesai`]), [])];

        // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
        const dataRows = Object.entries((trendData as TrendData).data).map(([caseType, monthlyData]) => [
            caseType,
            // FIX: Replaced flatMap with reduce for wider JS engine compatibility.
            ...monthlyData.reduce<number[]>((acc, d) => acc.concat([d.total, d.selesai]), [])
        ]);

        const monthTotals = Array(3).fill(null).map(() => ({ total: 0, selesai: 0 }));
        // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
        Object.values((trendData as TrendData).data).forEach(monthlyData => {
            monthlyData.forEach((data, index) => {
                monthTotals[index].total += data.total;
                monthTotals[index].selesai += data.selesai;
            });
        });
        
        const totalRow = [
            'Total',
            // FIX: Replaced flatMap with reduce for wider JS engine compatibility.
            ...monthTotals.reduce<number[]>((acc, t) => acc.concat([t.total, t.selesai]), [])
        ];
    
        const finalData = [ title, [], headers, ...dataRows, totalRow ];
    
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        ws['!cols'] = [
            { wch: 30 }, 
            // FIX: Replaced flatMap with reduce for wider JS engine compatibility.
            // FIX: Add type assertion to fix '... does not exist on type unknown' errors.
            ...(trendData as TrendData).monthLabels.reduce<{wch: number}[]>((acc) => acc.concat([{ wch: 15 }, { wch: 15 }]), [])
        ];
    
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tren Kasus 3 Bulan');
    
        const fileName = `Tren_Kasus_3_Bulan_Terakhir.xlsx`;
        XLSX.writeFile(wb, fileName);
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow-lg">
            
            <div className="flex border-b border-gray-200 dark:border-dark-700 mb-6">
                <button
                    onClick={() => setActiveTab('trend')}
                    className={`py-2 px-4 text-sm sm:text-base -mb-px font-semibold transition-colors duration-200 focus:outline-none ${activeTab === 'trend' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'}`}
                >
                    Tren Kasus 3 Bulan Terakhir
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`py-2 px-4 text-sm sm:text-base -mb-px font-semibold transition-colors duration-200 focus:outline-none ${activeTab === 'summary' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent'}`}
                >
                    Rekapitulasi
                </button>
            </div>

            <div>
                {activeTab === 'trend' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={handleTrendExport} className="flex items-center py-2 px-4 rounded bg-success text-white hover:bg-green-700 whitespace-nowrap">
                                <FileTextIcon className="h-4 w-4 mr-2" />
                                Export Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400 align-middle">
                                    <tr>
                                        <th scope="col" className="px-6 py-3" rowSpan={2}>Kasus</th>
                                        {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                        {(trendData as TrendData).monthLabels.map(label => (
                                            <th key={label} scope="col" colSpan={2} className="px-6 py-3 text-center border-x dark:border-dark-800">{label}</th>
                                        ))}
                                    </tr>
                                     <tr>
                                        {/* FIX: Replaced flatMap with reduce for wider JS engine compatibility. */}
                                        {/* FIX: Replaced JSX.Element[] with React.ReactNode[] to fix namespace error. */}
                                        {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                        {(trendData as TrendData).monthLabels.reduce<React.ReactNode[]>((acc, label) => acc.concat([
                                            <th key={`${label}-total`} scope="col" className="px-3 py-3 text-center bg-gray-100 dark:bg-dark-700/50 border-l dark:border-dark-800">Total</th>,
                                            <th key={`${label}-selesai`} scope="col" className="px-3 py-3 text-center bg-gray-100 dark:bg-dark-700/50 border-r dark:border-dark-800">Selesai</th>
                                        ]), [])}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                    {Object.entries((trendData as TrendData).data).map(([caseType, monthlyData]) => (
                                        <tr key={caseType} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{caseType}</td>
                                            {/* FIX: Replaced flatMap with reduce for wider JS engine compatibility. */}
                                            {/* FIX: Replaced JSX.Element[] with React.ReactNode[] to fix namespace error. */}
                                            {monthlyData.reduce<React.ReactNode[]>((acc, data, index) => acc.concat([
                                                <td key={`${index}-total`} className="px-3 py-4 text-center border-l dark:border-dark-800">{data.total}</td>,
                                                <td key={`${index}-selesai`} className="px-3 py-4 text-center border-r dark:border-dark-800">{data.selesai}</td>
                                            ]), [])}
                                        </tr>
                                    ))}
                                    {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                    {Object.keys((trendData as TrendData).data).length === 0 && (
                                    <tr className="bg-white border-b dark:bg-dark-900 dark:border-dark-700">
                                            {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                            <td colSpan={1 + (trendData as TrendData).monthLabels.length * 2} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                Tidak ada data tren untuk 3 bulan terakhir.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeTab === 'summary' && (
                    <div className="space-y-8">
                        <div>
                             <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700/50 rounded-lg border dark:border-dark-700">
                                <div className="flex-grow">
                                    <label htmlFor="start-date" className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
                                </div>
                                <div className="flex-grow">
                                     <label htmlFor="end-date" className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
                                </div>
                                <div className="self-end flex gap-2">
                                    <button onClick={handleReset} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-800 dark:hover:bg-dark-700 whitespace-nowrap">
                                        Reset
                                    </button>
                                     <button onClick={handleSummaryExport} className="flex items-center py-2 px-4 rounded bg-success text-white hover:bg-green-700 whitespace-nowrap">
                                        <FileTextIcon className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-400">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Kasus</th>
                                            <th scope="col" className="px-6 py-3 text-center">Total</th>
                                            <th scope="col" className="px-6 py-3 text-center">Selesai</th>
                                            <th scope="col" className="px-6 py-3 text-center">Lidik</th>
                                            <th scope="col" className="px-6 py-3 text-center">Sidik</th>
                                            <th scope="col" className="px-6 py-3 text-center">P21</th>
                                            <th scope="col" className="px-6 py-3 text-center">Diversi</th>
                                            <th scope="col" className="px-6 py-3 text-center">RJ</th>
                                            <th scope="col" className="px-6 py-3 text-center">SP3</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(crimeData).map(([caseType, data]) => (
                                            <tr key={caseType} className="bg-white border-b dark:bg-dark-900 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{caseType}</td>
                                                {/* FIX: Add type assertion to fix '... does not exist on type unknown' errors. */}
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).total}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).selesai}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).lidik}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).sidik}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).p21}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).diversi}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).rj}</td>
                                                <td className="px-6 py-4 text-center">{(data as CrimeSummaryItem).sp3}</td>
                                            </tr>
                                        ))}
                                         {Object.keys(crimeData).length === 0 && (
                                            <tr className="bg-white border-b dark:bg-dark-900 dark:border-dark-700">
                                                <td colSpan={9} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                                    Tidak ada data untuk rentang tanggal yang dipilih.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                     <tfoot>
                                        <tr className="bg-gray-100 dark:bg-dark-700/80 font-bold text-gray-800 dark:text-gray-200">
                                            <td className="px-6 py-3">Total</td>
                                            <td className="px-6 py-3 text-center">{totals.total}</td>
                                            <td className="px-6 py-3 text-center">{totals.selesai}</td>
                                            <td className="px-6 py-3 text-center">{totals.lidik}</td>
                                            <td className="px-6 py-3 text-center">{totals.sidik}</td>
                                            <td className="px-6 py-3 text-center">{totals.p21}</td>
                                            <td className="px-6 py-3 text-center">{totals.diversi}</td>
                                            <td className="px-6 py-3 text-center">{totals.rj}</td>
                                            <td className="px-6 py-3 text-center">{totals.sp3}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrimeDataView;
