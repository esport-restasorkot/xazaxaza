
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Report, ReportStatus, ReportType, PoliceModel, SPKT, LocationType, StatusDetail, VehicleDetail } from '../types';
import { DISTRICT_SUBDISTRICT_MAP } from '../constants';
import { PlusIcon, XIcon } from './icons';
import { supabase } from '../supabaseClient';

interface ReportFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
    reportToEdit: Report | null;
    onActionSuccess: (message: string) => void;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({ isOpen, onClose, setReports, reportToEdit, onActionSuccess }) => {
    
    const getDefaultFormData = () => {
        const defaultDistrict = Object.keys(DISTRICT_SUBDISTRICT_MAP)[0];
        const defaultSubDistrict = DISTRICT_SUBDISTRICT_MAP[defaultDistrict][0];
        return {
            reportType: ReportType.LAPORAN_POLISI,
            reportYear: new Date().getFullYear(),
            reportNumber: '',
            policeModel: PoliceModel.B,
            spkt: SPKT.POLRESTA_SORONG_KOTA,
            reportDate: new Date().toISOString().split('T')[0],
            reporterName: '',
            caseType: '',
            incidentDate: new Date().toISOString().split('T')[0],
            incidentTime: '12:00',
            incidentLocation: '',
            locationType: LocationType.JALAN_RAYA,
            district: defaultDistrict,
            subDistrict: defaultSubDistrict,
            lossAmount: 0,
        };
    }
    
    const [formData, setFormData] = useState(getDefaultFormData());
    const [vehicles, setVehicles] = useState<VehicleDetail[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (reportToEdit) {
            setFormData({
                reportType: reportToEdit.reportType,
                reportYear: reportToEdit.reportYear,
                reportNumber: reportToEdit.reportNumber,
                policeModel: reportToEdit.policeModel || PoliceModel.B,
                spkt: reportToEdit.spkt,
                reportDate: reportToEdit.reportDate.split('T')[0],
                reporterName: reportToEdit.reporterName,
                caseType: reportToEdit.caseType,
                incidentDate: reportToEdit.incidentDate.split('T')[0],
                incidentTime: reportToEdit.incidentTime,
                incidentLocation: reportToEdit.incidentLocation,
                locationType: reportToEdit.locationType,
                district: reportToEdit.district,
                subDistrict: reportToEdit.subDistrict,
                lossAmount: reportToEdit.lossAmount || 0,
            });
            setVehicles(reportToEdit.stolenVehicles?.map((v, i) => ({...v, id: v.id || i})) || []);
        } else {
             setFormData(getDefaultFormData());
             setVehicles([]);
        }
    }, [reportToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'district') {
            const newSubDistricts = DISTRICT_SUBDISTRICT_MAP[value] || [];
            setFormData(prev => ({
                ...prev,
                district: value,
                subDistrict: newSubDistricts[0] || '' // Reset subDistrict to the first valid option
            }));
        } else {
             const isNumber = (e.target as HTMLInputElement).type === 'number';
             setFormData(prev => ({ ...prev, [name]: isNumber ? parseInt(value) || 0 : value }));
        }
    };
    
    const handleVehicleChange = (index: number, field: keyof Omit<VehicleDetail, 'id'>, value: string) => {
        const newVehicles = [...vehicles];
        newVehicles[index] = { ...newVehicles[index], [field]: value };
        setVehicles(newVehicles);
    };

    const handleAddVehicle = () => {
        setVehicles([...vehicles, { id: Date.now(), vehicleType: '', frameNumber: '', engineNumber: '' }]);
    };

    const handleRemoveVehicle = (id: number | string) => {
        setVehicles(vehicles.filter(v => v.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const reportPayload = {
            report_type: formData.reportType,
            report_year: formData.reportYear,
            report_number: formData.reportNumber,
            police_model: formData.reportType === ReportType.LAPORAN_POLISI ? formData.policeModel : null,
            spkt: formData.spkt,
            report_date: new Date(formData.reportDate).toISOString(),
            reporter_name: formData.reporterName,
            case_type: formData.caseType,
            incident_date: new Date(formData.incidentDate).toISOString(),
            incident_time: formData.incidentTime,
            incident_location: formData.incidentLocation,
            location_type: formData.locationType,
            district: formData.district,
            sub_district: formData.subDistrict,
            loss_amount: formData.lossAmount,
        };

        try {
            if (reportToEdit) {
                // UPDATE
                const { error } = await supabase.from('reports').update(reportPayload).eq('id', reportToEdit.id);
                if (error) throw error;

                await supabase.from('stolen_vehicles').delete().eq('report_id', reportToEdit.id);
                if (vehicles.length > 0) {
                    const vehiclePayload = vehicles.map(v => ({
                        report_id: reportToEdit.id,
                        vehicle_type: v.vehicleType,
                        frame_number: v.frameNumber,
                        engine_number: v.engineNumber,
                    }));
                    const { error: vehicleError } = await supabase.from('stolen_vehicles').insert(vehiclePayload);
                    if (vehicleError) throw vehicleError;
                }

                const updatedReport = { ...reportToEdit, ...formData, stolenVehicles: vehicles };
                setReports(prev => prev.map(r => r.id === reportToEdit.id ? updatedReport : r));
                onActionSuccess('Laporan berhasil diperbarui.');

            } else {
                // CREATE
                const fullReportPayload = {
                    ...reportPayload,
                    status: ReportStatus.PROSES,
                    status_detail: StatusDetail.LIDIK,
                    id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Client-side temp ID
                };
                
                const { data: newReportData, error } = await supabase.from('reports').insert(fullReportPayload).select().single();
                if (error) throw error;
                
                if (vehicles.length > 0) {
                    const vehiclePayload = vehicles.map(v => ({
                        report_id: newReportData.id,
                        vehicle_type: v.vehicleType,
                        frame_number: v.frameNumber,
                        engine_number: v.engineNumber,
                    }));
                    const { error: vehicleError } = await supabase.from('stolen_vehicles').insert(vehiclePayload);
                    if (vehicleError) throw vehicleError;
                }
                
                const initialStatus = {
                    report_id: newReportData.id,
                    status: ReportStatus.PROSES,
                    status_detail: StatusDetail.LIDIK,
                    description: 'Laporan dibuat oleh Admin.',
                    updated_by: 'Admin'
                };
                const { error: statusError } = await supabase.from('status_history').insert(initialStatus);
                if (statusError) throw statusError;

                const newReportForState: Report = {
                    id: newReportData.id,
                    ...formData,
                    policeModel: formData.reportType === ReportType.LAPORAN_POLISI ? formData.policeModel : undefined,
                    reportDate: newReportData.report_date,
                    incidentDate: newReportData.incident_date,
                    status: newReportData.status,
                    statusDetail: newReportData.status_detail,
                    assignedPersonnelIds: [],
                    stolenVehicles: vehicles,
                    // FIX: Manually construct the StatusUpdate object to match the type, mapping snake_case to camelCase.
                    statusHistory: [{
                        status: initialStatus.status,
                        statusDetail: initialStatus.status_detail,
                        description: initialStatus.description,
                        updatedAt: new Date().toISOString(),
                        updatedBy: initialStatus.updated_by
                    }],
                };
                setReports(prev => [newReportForState, ...prev]);
                onActionSuccess('Laporan baru berhasil ditambahkan.');
            }
            onClose();
        } catch (error: any) {
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputClass = "w-full p-2 border border-gray-300 rounded bg-gray-50 dark:bg-dark-800 dark:border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary";
    const gridItemClass = "col-span-12 sm:col-span-6";
    const gridItemFullClass = "col-span-12";
    const sectionTitleClass = "col-span-12 text-lg font-semibold text-primary mt-4 border-b border-primary pb-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={reportToEdit ? 'Edit Laporan' : 'Tambah Laporan Baru'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    <h3 className={sectionTitleClass}>Informasi Laporan</h3>
                    <div className={gridItemClass}>
                        <label htmlFor="reportType" className="block mb-2 text-sm font-medium">Jenis Laporan</label>
                        <select name="reportType" id="reportType" value={formData.reportType} onChange={handleChange} className={inputClass} required>
                            {Object.values(ReportType).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="spkt" className="block mb-2 text-sm font-medium">SPKT</label>
                        <select name="spkt" id="spkt" value={formData.spkt} onChange={handleChange} className={inputClass} required>
                             {Object.values(SPKT).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className={gridItemClass}>
                        <label htmlFor="reportNumber" className="block mb-2 text-sm font-medium">Nomor Laporan</label>
                        <div className="flex items-center space-x-2">
                             <span className="font-bold">{formData.reportType === ReportType.LAPORAN_POLISI ? 'LP' : 'REG'}-</span>
                             <input type="text" name="reportNumber" id="reportNumber" value={formData.reportNumber} onChange={handleChange} className={inputClass} required placeholder="1" />
                        </div>
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="reportYear" className="block mb-2 text-sm font-medium">Tahun Laporan</label>
                        <input type="number" name="reportYear" id="reportYear" value={formData.reportYear} onChange={handleChange} className={inputClass} required />
                    </div>

                    {formData.reportType === ReportType.LAPORAN_POLISI && (
                        <div className={gridItemClass}>
                            <label htmlFor="policeModel" className="block mb-2 text-sm font-medium">Model Laporan</label>
                            <select name="policeModel" id="policeModel" value={formData.policeModel} onChange={handleChange} className={inputClass} required>
                                {Object.values(PoliceModel).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={gridItemClass}>
                        <label htmlFor="reportDate" className="block mb-2 text-sm font-medium">Tanggal Laporan</label>
                        <input type="date" name="reportDate" id="reportDate" value={formData.reportDate} onChange={handleChange} className={inputClass} required />
                    </div>

                    <div className={gridItemFullClass}>
                        <label htmlFor="reporterName" className="block mb-2 text-sm font-medium">Nama Pelapor</label>
                        <input type="text" name="reporterName" id="reporterName" value={formData.reporterName} onChange={handleChange} className={inputClass} required />
                    </div>

                     <h3 className={sectionTitleClass}>Informasi Kasus & TKP</h3>
                    <div className={gridItemFullClass}>
                        <label htmlFor="caseType" className="block mb-2 text-sm font-medium">Kasus</label>
                        <input type="text" name="caseType" id="caseType" value={formData.caseType} onChange={handleChange} className={inputClass} required placeholder="Curanmor, Penganiayaan, dll"/>
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="incidentDate" className="block mb-2 text-sm font-medium">Tanggal Kejadian</label>
                        <input type="date" name="incidentDate" id="incidentDate" value={formData.incidentDate} onChange={handleChange} className={inputClass} required />
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="incidentTime" className="block mb-2 text-sm font-medium">Waktu Kejadian</label>
                        <input type="time" name="incidentTime" id="incidentTime" value={formData.incidentTime} onChange={handleChange} className={inputClass} required />
                    </div>
                     <div className={gridItemFullClass}>
                        <label htmlFor="incidentLocation" className="block mb-2 text-sm font-medium">Tempat Kejadian Perkara (TKP)</label>
                        <input type="text" name="incidentLocation" id="incidentLocation" value={formData.incidentLocation} onChange={handleChange} className={inputClass} required />
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="locationType" className="block mb-2 text-sm font-medium">Lokasi Kejadian</label>
                         <select name="locationType" id="locationType" value={formData.locationType} onChange={handleChange} className={inputClass} required>
                             {Object.values(LocationType).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className={gridItemClass}>
                        <label htmlFor="district" className="block mb-2 text-sm font-medium">Distrik</label>
                         <select name="district" id="district" value={formData.district} onChange={handleChange} className={inputClass} required>
                            {Object.keys(DISTRICT_SUBDISTRICT_MAP).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="subDistrict" className="block mb-2 text-sm font-medium">Kelurahan</label>
                        <select name="subDistrict" id="subDistrict" value={formData.subDistrict} onChange={handleChange} className={inputClass} required>
                            {DISTRICT_SUBDISTRICT_MAP[formData.district]?.map(sd => <option key={sd} value={sd}>{sd}</option>)}
                        </select>
                    </div>
                     <div className={gridItemClass}>
                        <label htmlFor="lossAmount" className="block mb-2 text-sm font-medium">Kerugian (Rp)</label>
                        <input type="number" name="lossAmount" id="lossAmount" value={formData.lossAmount} onChange={handleChange} className={inputClass} />
                    </div>

                    <h3 className={sectionTitleClass}>Data Kendaraan</h3>
                    <div className="col-span-12 space-y-4">
                        {vehicles.map((vehicle, index) => (
                            <div key={vehicle.id} className="grid grid-cols-12 gap-x-4 gap-y-2 p-3 border rounded-lg dark:border-dark-700 relative">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="block text-xs font-medium mb-1">Jenis Kendaraan</label>
                                    <input type="text" value={vehicle.vehicleType} onChange={(e) => handleVehicleChange(index, 'vehicleType', e.target.value)} className={inputClass} placeholder="cth. Honda Beat" required/>
                                </div>
                                    <div className="col-span-12 sm:col-span-4">
                                    <label className="block text-xs font-medium mb-1">No. Rangka</label>
                                    <input type="text" value={vehicle.frameNumber} onChange={(e) => handleVehicleChange(index, 'frameNumber', e.target.value)} className={inputClass} required/>
                                </div>
                                    <div className="col-span-12 sm:col-span-4">
                                    <label className="block text-xs font-medium mb-1">No. Mesin</label>
                                    <input type="text" value={vehicle.engineNumber} onChange={(e) => handleVehicleChange(index, 'engineNumber', e.target.value)} className={inputClass} required/>
                                </div>
                                <button type="button" onClick={() => handleRemoveVehicle(vehicle.id)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                    <XIcon width="12" height="12" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddVehicle} className="flex items-center text-sm py-2 px-3 rounded bg-green-600 text-white hover:bg-green-700">
                            <PlusIcon width="16" height="16" />
                            <span className="ml-2">Tambah Kendaraan</span>
                        </button>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-dark-700 mt-6">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-gray-200 hover:bg-gray-300 dark:bg-dark-700 dark:hover:bg-dark-800" disabled={isSaving}>Batal</button>
                    <button type="submit" className="py-2 px-4 rounded bg-primary text-white hover:bg-blue-700 disabled:bg-blue-300" disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : (reportToEdit ? 'Simpan Perubahan' : 'Tambah Laporan')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReportFormModal;
