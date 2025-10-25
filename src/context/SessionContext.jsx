import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'; // <--- ADD useMemo HERE
import { collection, query, /* where, */ orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const SessionContext = createContext();

export function useSessions() {
    return useContext(SessionContext);
}

// El Provider ahora necesita recibir el objeto `user` como prop
export default function SessionProvider({ children, user }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para recargar manualmente
    const refetchSessions = useCallback(async () => {
        if (!user) {
            setSessions([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const sessionsRef = collection(db, `users/${user.uid}/sessions`);
            const q = query(sessionsRef, orderBy('completedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedSessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSessions(fetchedSessions);
        } catch (err) {
            console.error("Error fetching sessions manually:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);


    useEffect(() => {
        if (!user) {
            setSessions([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const sessionsRef = collection(db, `users/${user.uid}/sessions`);
        const q = query(sessionsRef, orderBy('completedAt', 'desc'));

        // Suscripción en tiempo real
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedSessions = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(fetchedSessions);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error("Error listening to session changes:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();

    }, [user]);

    // El valor que provee el contexto, envuelto en useMemo
    const value = useMemo(() => ({
        sessions,
        loading,
        error,
        refetchSessions,
        setSessions // Exponer setSessions
    }), [sessions, loading, error, refetchSessions]); // Incluir refetchSessions si puede cambiar

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}