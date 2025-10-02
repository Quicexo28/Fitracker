import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Home, Dumbbell, History, BookOpen, MoreHorizontal, BarChart3, Calendar, Target, Settings, Moon, Sun, LogOut, X, User, Users } from 'lucide-react';

const MoreMenu = ({ onClose }) => {
    const { preferences } = usePreferences();
    const { theme, toggleTheme } = useTheme();
    const { auth } = useAuth();
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        onClose();
        if (auth) auth.signOut();
    };

    const menuItems = useMemo(() => {
        const allItems = [
            { path: '/perfil', label: 'Mi Perfil', icon: User },
            { path: '/amigos', label: 'Amigos', icon: Users },
            { path: '/analiticas', label: 'Analíticas', icon: BarChart3, feature: 'analytics' },
            { path: '/planificacion', label: 'Planificación', icon: Calendar, feature: 'planning' },
            { path: '/mediciones', label: 'Mediciones', icon: Target, feature: 'measurements' },
            { path: '/ajustes', label: 'Ajustes', icon: Settings },
        ];
        
        if (!preferences?.features) return allItems.filter(item => !item.feature);
        return allItems.filter(item => !item.feature || preferences.features[item.feature]);
    }, [preferences]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 w-full max-w-xs p-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="self-end p-2 text-gray-500 dark:text-gray-400"><X /></button>
                {menuItems.map(item => (
                    <button key={item.path} onClick={() => handleNavigation(item.path)} className="flex items-center gap-4 p-3 text-left w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <item.icon size={22} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <button onClick={toggleTheme} className="flex items-center gap-4 p-3 text-left w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
                    <span className="font-medium">Modo {theme === 'light' ? 'Oscuro' : 'Claro'}</span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-4 p-3 text-left w-full rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                    <LogOut size={22} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default function Navigation() {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    
    const navItems = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/rutinas', label: 'Rutinas', icon: Dumbbell },
        { path: '/ejercicios', label: 'Ejercicios', icon: BookOpen },
        { path: '/historial', label: 'Historial', icon: History },
    ];

    const activeLinkStyle = "text-blue-600 dark:text-blue-400";
    const inactiveLinkStyle = "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400";

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-200 dark:border-gray-700 z-50">
                <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex justify-around h-16">
                        {navItems.map(({ path, label, icon: Icon }) => (
                            <NavLink key={path} to={path} end className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium transition-colors ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
                                <Icon size={24} strokeWidth={2.5} />
                                <span className="mt-1">{label}</span>
                            </NavLink>
                        ))}
                        <button onClick={() => setIsMoreMenuOpen(true)} className={`flex flex-col items-center justify-center w-full text-xs font-medium transition-colors ${inactiveLinkStyle}`}>
                            <MoreHorizontal size={24} strokeWidth={2.5} />
                            <span className="mt-1">Más</span>
                        </button>
                    </div>
                </div>
            </nav>
            {isMoreMenuOpen && <MoreMenu onClose={() => setIsMoreMenuOpen(false)} />}
        </>
    );
} 