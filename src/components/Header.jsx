import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { UserCircle, Menu, Sun, Moon, LogOut, Settings } from 'lucide-react';

export default function Header({ onLogout }) {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { preferences } = usePreferences();
    const location = useLocation();
    const navigate = useNavigate();
    const profileMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navItems = useMemo(() => {
        const allItems = [
            { path: '/', label: 'Inicio' },
            { path: '/rutinas', label: 'Rutinas' },
            { path: '/ejercicios', label: 'Ejercicios' },
            { path: '/historial', label: 'Historial' },
            { path: '/analiticas', label: 'Analíticas', feature: 'analytics' },
            { path: '/planificacion', label: 'Planificación', feature: 'planning' },
            { path: '/mediciones', label: 'Mediciones', feature: 'measurements' },
        ];

        if (!preferences?.features) {
            return allItems.filter(item => !item.feature);
        }
        
        return allItems.filter(item => {
            if (!item.feature) return true;
            return preferences.features[item.feature];
        });
    }, [preferences]);

    const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo-dark.png';

    const NavLink = ({ path, label, isMobile = false }) => (
        <Link
            to={path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={ isMobile 
                ? `block px-3 py-2 rounded-md text-base font-medium ${location.pathname === path ? 'bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`
                : `px-3 py-2 rounded-md text-sm font-medium ${location.pathname === path ? 'bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`
            }
        >
            {label}
        </Link>
    );

    const handleNavigation = (path) => {
        navigate(path);
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
    };

    const handleThemeToggle = () => {
        toggleTheme();
        setIsProfileMenuOpen(false);
    };
    
    const handleLogout = () => {
        onLogout();
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <img className="h-12 w-auto" src={logoSrc} alt="Fit Tracker Logo" />
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {navItems.map(item => <NavLink key={item.path} {...item} />)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="hidden md:block">
                        <div className="ml-3 relative" ref={profileMenuRef}>
                            <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none">
                                <UserCircle size={28}/>
                            </button>
                            {isProfileMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-40">
                                    <button onClick={() => handleNavigation('/ajustes')} className="w-full text-left flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        Ajustes <Settings size={16} />
                                    </button>
                                    <button onClick={handleThemeToggle} className="w-full text-left flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                        Modo {theme === 'light' ? 'Oscuro' : 'Claro'}
                                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                                    </button>
                                    <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                                    <button onClick={handleLogout} className="w-full text-left flex justify-between items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800/50">
                                        Cerrar Sesión<LogOut size={16}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(prev => !prev)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Menu />
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden" ref={mobileMenuRef}>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map(item => <NavLink key={item.path} {...item} isMobile={true}/>)}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                             <button onClick={() => handleNavigation('/ajustes')} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                Ajustes
                            </button>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                             <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}