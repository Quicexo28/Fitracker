import { useMemo, useState, useCallback } from 'react';
import { useSessions } from '../context/SessionContext.jsx';

/**
 * Este hook procesa el historial de sesiones para encontrar los récords personales (PRs)
 * para cada ejercicio. Un PR se define como el máximo peso levantado para un número
 * de repeticiones específico. También mantiene un estado de los PRs logrados en la sesión actual.
 */
export default function usePersonalRecords() {
    const { sessions, loading } = useSessions();

    // 1. Mantenemos el mapa de récords históricos como base
    const historicalRecords = useMemo(() => {
        if (loading || sessions.length === 0) return {};
        const allRecords = {};
        sessions.forEach(session => {
            session.exercises?.forEach(exercise => {
                const exerciseId = exercise.exerciseId;
                if (!allRecords[exerciseId]) allRecords[exerciseId] = new Map();
                exercise.sets?.forEach(set => {
                    const reps = parseInt(set.reps, 10);
                    const weight = parseFloat(set.weight);
                    if (!isNaN(reps) && !isNaN(weight)) {
                        const currentBestWeight = allRecords[exerciseId].get(reps) || 0;
                        if (weight > currentBestWeight) {
                            allRecords[exerciseId].set(reps, weight);
                        }
                    }
                });
            });
        });
        return allRecords;
    }, [sessions, loading]);

    // 2. Añadimos un estado INTERNO para los PRs de la sesión actual
    const [sessionPRs, setSessionPRs] = useState({});

    // 3. Función para registrar un nuevo PR logrado en la sesión actual
    const trackNewPR = useCallback((exerciseId, reps, weight) => {
        const repsInt = parseInt(reps, 10);
        const weightFloat = parseFloat(weight);

        setSessionPRs(prev => {
            const exerciseRecords = prev[exerciseId] ? new Map(prev[exerciseId]) : new Map();
            exerciseRecords.set(repsInt, weightFloat);
            return { ...prev, [exerciseId]: exerciseRecords };
        });
    }, []);

    // 4. La función de comprobación ahora considera AMBOS historiales
    const checkIsPR = useCallback((exerciseId, reps, weight) => {
        const repsInt = parseInt(reps, 10);
        const weightFloat = parseFloat(weight);

        if (isNaN(repsInt) || isNaN(weightFloat) || weightFloat <= 0) return false;

        // Obtiene el mejor peso del historial Y de la sesión actual
        const historicalBest = historicalRecords[exerciseId]?.get(repsInt) || 0;
        const sessionBest = sessionPRs[exerciseId]?.get(repsInt) || 0;
        
        // El récord a batir es el mayor de los dos
        const currentRecordToBeat = Math.max(historicalBest, sessionBest);
        
        return weightFloat > currentRecordToBeat;
    }, [historicalRecords, sessionPRs]);

    // 5. Función para limpiar los PRs de la sesión cuando se inicia un nuevo entreno
    const resetSessionPRs = useCallback(() => {
        setSessionPRs({});
    }, []);


    return { 
        checkIsPR, 
        trackNewPR, // Exportamos la nueva función
        resetSessionPRs, // Exportamos la función de reseteo
        isLoading: loading 
    };
}