import { useMemo, useCallback } from 'react';
import { useSessions } from '../context/SessionContext.jsx';

/**
 * Este hook procesa el historial de sesiones para encontrar la última vez que se
 * realizó cada ejercicio.
 */
export default function useLastPerformance() {
    const { sessions, loading } = useSessions();

    // Procesamos las sesiones una vez para crear un mapa de fácil acceso
    // con la última actuación de cada ejercicio.
    const lastPerformances = useMemo(() => {
        if (loading || sessions.length === 0) {
            return new Map();
        }

        const performanceMap = new Map();

        // Las sesiones ya vienen ordenadas de la más nueva a la más vieja.
        // Iteramos y, si un ejercicio no está en el mapa, lo añadimos.
        // Así nos aseguramos de que solo guardamos la más reciente.
        sessions.forEach(session => {
            session.exercises?.forEach(exercise => {
                if (!performanceMap.has(exercise.exerciseId)) {
                    performanceMap.set(exercise.exerciseId, exercise.sets);
                }
            });
        });

        return performanceMap;
    }, [sessions, loading]);

    // Creamos una función simple para obtener los datos de un ejercicio
    const getLastPerformance = useCallback((exerciseId) => {
        return lastPerformances.get(exerciseId) || [];
    }, [lastPerformances]);

    return { getLastPerformance, isLoading: loading };
}