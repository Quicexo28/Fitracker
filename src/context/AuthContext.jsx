import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.js';
import ThemedLoader from '../components/ThemedLoader.jsx';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        auth // Exportamos la instancia de auth para usarla en el logout
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <ThemedLoader /> : children}
        </AuthContext.Provider>
    );
};