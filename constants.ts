import { Unit, Personnel, Report, ReportStatus, ReportType, PoliceModel, SPKT, LocationType, StatusDetail } from './types';

export const UNITS: Unit[] = [];

export const PERSONNEL: Personnel[] = [];

export const DISTRICT_SUBDISTRICT_MAP: { [key: string]: string[] } = {
  'Sorong': ['Klademak', 'Kofkerbu', 'Remu', 'Remu Utara'],
  'Sorong Kota': ['Kampung Baru', 'Klabala', 'Klakublik', 'Klasuur'],
  'Sorong Manoi': ['Klaligi', 'Klasabi', 'Malabutor', 'Malawei', 'Remu Selatan'],
  'Sorong Timur': ['Kladufu', 'Klamana', 'Klawalu', 'Klawuyuk'],
  'Klaurung': ['Giwu', 'Klablim', 'Klasaman', 'Klasuat'],
  'Malaimsimsa': ['Klabulu', 'Klagete', 'Malaingkedi', 'Malamso'],
  'Sorong Utara': ['Matalamagi', 'Malasilen', 'Malanu', 'Sawagumu'],
  'Sorong Barat': ['Klawasi', 'Rufei', 'Pal Putih', 'Puncak Cendrawasih'],
  'Sorong Kepulauan': ['Dum Barat', 'Dum Timur', 'Raam', 'Soop'],
  'Maladum Mes': ['Saoka', 'Suprau', 'Tampa Garam', 'Tanjung Kasuari'],
};

export const REPORTS: Report[] = [];
