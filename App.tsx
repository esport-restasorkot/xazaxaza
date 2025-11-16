import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Report, Unit, Personnel, UserRole } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportsView from './components/ReportsView';
import PersonnelView from './components/PersonnelView';
import UnitsView from './components/UnitsView';
import CrimeDataView from './components/CrimeDataView';
import VehiclesView from './components/VehiclesView';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [operatorUnitId, setOperatorUnitId] = useState<string>('');
    const [operatorUnitName, setOperatorUnitName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    const [reports, setReports] = useState<Report[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [personnel, setPersonnel] = useState<Personnel[]>([]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    useEffect(() => {
        const root = document.getElementById('root');
        if (root) {
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false); // Stop loading if there's no initial session
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchInitialData();
        }
    }, [session]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch user profile from the secure 'profiles' table
            const { data: profileList, error: profileError } = await supabase
              .from('profiles')
              .select('role, unit_id, units(name)')
              .eq('id', session!.user.id);

            if (profileError) throw new Error(`Gagal mengambil profil pengguna: ${profileError.message}`);
            if (!profileList || profileList.length === 0) {
                throw new Error('Profil pengguna tidak ditemukan. Penyebab paling umum adalah kebijakan Row Level Security (RLS) pada tabel \'profiles\' di Supabase yang tidak mengizinkan pengguna membaca data mereka sendiri. Silakan hubungi administrator untuk menambahkan kebijakan SELECT pada tabel \'profiles\' untuk pengguna yang terautentikasi.');
            }
            // If there are multiple profiles (which shouldn't happen but is the cause of the error),
            // we robustly take the first one to prevent the app from crashing.
            const profileData = profileList[0];
            
            // FIX: Cast to unknown first to resolve type incompatibility error.
            const profile = profileData as unknown as { role: UserRole; unit_id: string; units: { name: string } | null };
            setUserRole(profile.role);
            setOperatorUnitId(profile.unit_id);
            if (profile.role === UserRole.OPERATOR && profile.units) {
                setOperatorUnitName(profile.units.name);
            }

            // Fetch all other data in parallel
            const [
                { data: unitsData, error: unitsError },
                { data: personnelData, error: personnelError },
                { data: reportsData, error: reportsError },
                { data: userEmailsData, error: userEmailsError },
            ] = await Promise.all([
                supabase.from('units').select('*'),
                supabase.from('personnel').select('*'), // Query personnel separately
                supabase.from('reports')
                    .select(`*, stolen_vehicles(*), status_history(*)`)
                    .order('report_date', { ascending: false }),
                // FIX: Query the new 'user_emails' view to securely fetch emails for operators.
                // This requires a database view and RLS policy to be created first.
                supabase.from('user_emails').select('id, email'),
            ]);

            if (unitsError) throw unitsError;
            if (personnelError) throw personnelError;
            if (reportsError) throw reportsError;
            if (userEmailsError) throw userEmailsError;
            
            setUnits(unitsData || []);

            // Create a map for quick email lookup from all user emails
            const profileMap = new Map((userEmailsData || []).map(p => [p.id, p.email]));

            const formattedPersonnel = (personnelData || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                rank: p.rank,
                unitId: p.unit_id,
                userId: p.user_id,
                // Manually map the email using the profileMap
                userEmail: p.user_id ? profileMap.get(p.user_id) : null,
            }));
            setPersonnel(formattedPersonnel);
            
            const reportsWithAssignments = await Promise.all(
                (reportsData || []).map(async (r: any) => {
                    const { data: assignments, error } = await supabase
                        .from('assigned_personnel')
                        .select('personnel_id')
                        .eq('report_id', r.id);
                    
                    if (error) {
                        console.error('Error fetching assignments for report', r.id, error);
                        return { ...r, assignedPersonnelIds: [] };
                    }

                    return {
                        id: r.id,
                        reportType: r.report_type,
                        reportYear: r.report_year,
                        reportNumber: r.report_number,
                        policeModel: r.police_model,
                        spkt: r.spkt,
                        reportDate: r.report_date,
                        reporterName: r.reporter_name,
                        caseType: r.case_type,
                        incidentDate: r.incident_date,
                        incidentTime: r.incident_time,
                        incidentLocation: r.incident_location,
                        locationType: r.location_type,
                        district: r.district,
                        subDistrict: r.sub_district,
                        lossAmount: r.loss_amount,
                        status: r.status,
                        statusDetail: r.status_detail,
                        assignedUnitId: r.assigned_unit_id,
                        assignedPersonnelIds: (assignments || []).map((a: any) => a.personnel_id),
                        stolenVehicles: r.stolen_vehicles || [],
                        statusHistory: (r.status_history || []).map((h: any) => ({
                            status: h.status,
                            statusDetail: h.status_detail,
                            description: h.description,
                            updatedAt: h.updated_at,
                            updatedBy: h.updated_by,
                        })).sort((a: any, b: any) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
                    };
                })
            );

            setReports(reportsWithAssignments);
            
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            setSession(null);
            setUserRole(null);
            setOperatorUnitId('');
            setOperatorUnitName(null);
            setReports([]);
            setUnits([]);
            setPersonnel([]);
            setCurrentView('dashboard');
            setError(null);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-800 text-gray-800 dark:text-gray-200">Memuat data...</div>;
    }
    
    if (!session || !userRole) {
        return <Login />;
    }

    if (error) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-dark-800 text-red-500">
                <h2 className="text-xl font-bold mb-4">Gagal memuat data</h2>
                <p className="max-w-md text-center mb-6">{error}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Pastikan koneksi internet dan konfigurasi Supabase sudah benar. Coba logout dan login kembali.</p>
                <button onClick={handleLogout} className="bg-primary text-white font-bold py-2 px-4 rounded">
                    Logout
                </button>
            </div>
        );
    }
    
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard reports={reports} userRole={userRole} operatorUnitId={operatorUnitId} units={units} personnel={personnel} />;
            case 'reports':
                return <ReportsView reports={reports} setReports={setReports} personnel={personnel} units={units} userRole={userRole} operatorUnitId={operatorUnitId} />;
            case 'crime-data':
                return <CrimeDataView reports={reports} userRole={userRole} operatorUnitId={operatorUnitId} />;
            case 'vehicles':
                return <VehiclesView reports={reports} units={units} personnel={personnel} />;
            case 'personnel':
                return <PersonnelView personnel={personnel} setPersonnel={setPersonnel} units={units} />;
            case 'units':
                return <UnitsView units={units} setUnits={setUnits} />;
            default:
                return <Dashboard reports={reports} userRole={userRole} operatorUnitId={operatorUnitId} units={units} personnel={personnel} />;
        }
    };

    return (
        <Layout
            currentView={currentView}
            setCurrentView={setCurrentView}
            userRole={userRole}
            operatorUnitName={operatorUnitName}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
        >
            {renderView()}
        </Layout>
    );
};

export default App;