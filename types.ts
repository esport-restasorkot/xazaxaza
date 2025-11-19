
// types.ts

export enum UserRole {
  ADMIN = 'Admin',
  OPERATOR = 'Operator',
}

export enum ReportType {
  LAPORAN_POLISI = 'Laporan Polisi',
  PENGADUAN_MASYARAKAT = 'Pengaduan Masyarakat',
}

export enum PoliceModel {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum SPKT {
  POLRESTA_SORONG_KOTA = 'Polresta Sorong Kota',
  POLSEK_SORONG_KOTA = 'Polsek Sorong Kota',
  POLSEK_SORONG_MANOI = 'Polsek Sorong Manoi',
  POLSEK_SORONG_TIMUR = 'Polsek Sorong Timur',
  POLSEK_SORONG_BARAT = 'Polsek Sorong Barat',
  POLSEK_KP3_LAUT = 'Polsek KP3 Laut',
}

export enum LocationType {
    JALAN_RAYA = 'Jalan Raya',
    PEMUKIMAN = 'Pemukiman',
    PERKANTORAN = 'Perkantoran',
    PUSAT_PERBELANJAAN = 'Pusat Perbelanjaan',
    TEMPAT_IBADAH = 'Tempat Ibadah',
    SEKOLAH = 'Sekolah',
    LAINNYA = 'Lainnya',
}

export enum ReportStatus {
  PROSES = 'Proses',
  SELESAI = 'Selesai',
  DIHAPUS = 'Dihapus',
}

export enum StatusDetail {
  LIDIK = 'Lidik',
  SIDIK = 'Sidik',
  P21 = 'P21',
  DIVERSI = 'Diversi',
  RJ = 'Restorative Justice',
  SP3 = 'SP3',
  DIHAPUS = 'Data Dihapus',
}

export interface Unit {
  id: string;
  name: string;
}

export interface Personnel {
  id: string;
  name: string;
  rank: string;
  unitId: string;
  userId?: string | null;
  userEmail?: string | null;
}

export interface VehicleDetail {
    id?: string | number;
    vehicleType: string;
    frameNumber: string;
    engineNumber: string;
}

export interface StolenVehicle extends VehicleDetail {
    id: string;
    reportId: string;
}

export interface StatusUpdate {
    status: ReportStatus;
    statusDetail: StatusDetail;
    description: string;
    updatedAt: string;
    updatedBy: string;
}

export interface Report {
  id: string;
  reportType: ReportType;
  reportYear: number;
  reportNumber: string;
  policeModel?: PoliceModel;
  spkt: SPKT;
  reportDate: string;
  reporterName: string;
  caseType: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  locationType: LocationType;
  district: string;
  subDistrict: string;
  lossAmount?: number;
  status: ReportStatus;
  statusDetail?: StatusDetail;
  assignedUnitId?: string;
  assignedPersonnelIds: string[];
  stolenVehicles?: VehicleDetail[];
  statusHistory: StatusUpdate[];
}