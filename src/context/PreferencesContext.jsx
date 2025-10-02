import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserPreferences } from '../firebase/settingsService.js';
import ThemedLoader from '../components/ThemedLoader.jsx';

const PreferencesContext = createContext();

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children, user }) => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setPreferences(null);
            setLoading(false);
            return;
        }

        const fetchPreferences = async () => {
            setLoading(true);
            const prefs = await getUserPreferences(user.uid);
            setPreferences(prefs);
            setLoading(false);
        };

        fetchPreferences();
    }, [user]);
    
    // --- CAMBIO AQUÍ: Función para actualizar las preferencias globalmente ---
    const updatePreferences = useCallback((newPrefs) => {
        setPreferences(newPrefs);
    }, []);

    // Añadimos la función de actualización al valor del contexto
    const value = { preferences, loading, updatePreferences };

    return (
        <PreferencesContext.Provider value={value}>
            {children}
        </PreferencesContext.Provider>
    );
};