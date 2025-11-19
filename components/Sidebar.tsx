
import React from 'react';
import { HomeIcon, FileTextIcon, UsersIcon, ShieldIcon, BarChartIcon, MotorcycleIcon } from './icons';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, userRole }) => {
  const navItems = [
    { name: 'Dashboard', icon: <HomeIcon />, view: 'dashboard', roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { name: 'Laporan', icon: <FileTextIcon />, view: 'reports', roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { name: 'Data GK', icon: <BarChartIcon />, view: 'crime-data', roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { name: 'Kendaraan', icon: <MotorcycleIcon />, view: 'vehicles', roles: [UserRole.ADMIN] },
    { name: 'Manajemen Personil', icon: <UsersIcon />, view: 'personnel', roles: [UserRole.ADMIN] },
    { name: 'Manajemen Unit', icon: <ShieldIcon />, view: 'units', roles: [UserRole.ADMIN] },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-dark-900 text-gray-700 dark:text-gray-200 flex-shrink-0 hidden md:flex md:flex-col shadow-r">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-transparent bg-white dark:bg-dark-950">
        <img src="https://raw.githubusercontent.com/esport-restasorkot/gmbrax/main/reskrim.png" alt="Crime Track Logo" className="h-10 w-10 object-contain"/>
        <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">CrimeTrack</span>
      </div>
      <nav className="mt-4 flex-1 overflow-y-auto">
        <ul>
          {navItems.filter(item => item.roles.includes(userRole)).map(item => (
            <li key={item.name} className="px-4 py-1">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentView(item.view); }}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                  currentView === item.view ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-dark-700 mt-auto">
         <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
            Satreskrim Polresta Sorong Kota
         </p>
      </div>
    </aside>
  );
};

export default Sidebar;