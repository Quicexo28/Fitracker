import React, { createContext, useContext, useMemo } from 'react';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';

const SessionContext = createContext();

export const useSessions = () => {
    return useContext(SessionContext);
};

// LA CORRECCIÓN: Usamos "export default" para que App.jsx pueda encontrarlo.
export default function SessionProvider({ children, user }) {
    const sessionsPath = useMemo(() => user ? `users/${user.uid}/sessions` : null, [user]);
    const { data: sessions, loading: sessionsLoading } = useFirestoreCollection(sessionsPath, {
        orderBy: 'completedAt',
        direction: 'desc'
    });

    const routinesPath = useMemo(() => user ? `users/${user.uid}/routines` : null, [user]);
    const { data: routines, loading: routinesLoading } = useFirestoreCollection(routinesPath);

    const routinesMap = useMemo(() => {
        if (!routines) return new Map();
        return new Map(routines.map(routine => [routine.id, routine.name]));
    }, [routines]);

    const enrichedSessions = useMemo(() => {
        return sessions.map(session => ({
            ...session,
            routineName: routinesMap.get(session.routineId) || 'Rutina Eliminada'
        }));
    }, [sessions, routinesMap]);

    const isLoading = sessionsLoading || routinesLoading;

    const value = {
        sessions: enrichedSessions,
        loading: isLoading
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}