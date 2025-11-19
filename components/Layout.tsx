
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: UserRole;
  operatorUnitName: string | null;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setCurrentView, userRole, operatorUnitName, onLogout, theme, toggleTheme }) => {
  
  const getPageTitle = (view: string) => {
      switch (view) {
          case 'dashboard': return 'Dashboard';
          case 'reports': return 'Daftar Laporan';
          case 'crime-data': return 'Data Gangguan Kamtibmas';
          case 'vehicles': return 'Data Kendaraan Hilang';
          case 'personnel': return 'Manajemen Personil';
          case 'units': return 'Manajemen Unit';
          default: return 'Satreskrim Polresta Sorong Kota';
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-800 font-sans text-gray-900 dark:text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            userRole={userRole} 
            operatorUnitName={operatorUnitName} 
            onLogout={onLogout} 
            theme={theme} 
            toggleTheme={toggleTheme}
            title={getPageTitle(currentView)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-dark-800 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;