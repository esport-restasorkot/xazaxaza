
import React from 'react';
import { UserRole } from '../types';
import { SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    userRole: UserRole;
    operatorUnitName: string | null;
    onLogout: () => void;
    theme: string;
    toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, operatorUnitName, onLogout, theme, toggleTheme }) => {
    const displayName = userRole === UserRole.OPERATOR && operatorUnitName
        ? `${userRole} - ${operatorUnitName}`
        : userRole;

    return (
        <header className="bg-white dark:bg-dark-900 shadow-md h-16 flex items-center justify-between px-6 flex-shrink-0">
            <div className="text-gray-800 dark:text-gray-200">
                <h1 className="text-xl font-semibold">Satreskrim Polresta Sorong Kota</h1>
            </div>
            <div className="flex items-center space-x-4">
                 <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-dark-900"
                    title="Ganti tema"
                 >
                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
                 <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{displayName}</p>
                    <p className="text-xs text-green-500">Online</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    {userRole === UserRole.ADMIN ? 'A' : 'O'}
                </div>
                <button 
                    onClick={onLogout}
                    className="bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors duration-200"
                    title="Logout"
                >
                    Keluar
                </button>
            </div>
        </header>
    );
};

export default Header;