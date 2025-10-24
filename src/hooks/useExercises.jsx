// src/hooks/useExercises.jsx
import { useMemo, useCallback } from 'react';
import { collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import useFirestoreCollection from './useFirestoreCollection.jsx'; // Tu hook existente

// Referencia a la nueva colección de Firestore
const exercisesCollection = collection(db, 'exercises');

// Helper recursivo para encontrar el nombre de un ejercicio por ID (incluyendo variaciones)
const findExerciseDetails = (items, id) => {
    if (!items) return null;
    for (const item of items) {
        if (item.id === id) return { name: item.name, group: item.groupName }; // Ejercicio base

        if (item.variations) {
            for (const variation of item.variations) {
                if (variation.id === id) return { name: `${item.name}: ${variation.name}`, group: item.groupName };
                
                if (variation.subvariations) {
                    for (const subVar of variation.subvariations) {
                        if (subVar.id === id) return { name: `${item.name}: ${variation.name} (${subVar.name})`, group: item.groupName };
                        
                        if (subVar.executionTypes) {
                            for (const execType of subVar.executionTypes) {
                                if (execType.id === id) return { name: `${item.name}: ${subVar.name} (${execType.name})`, group: item.groupName };
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
};

export const useExercises = () => {
    // 1. Usa tu hook existente para obtener los datos de la colección
    const { data: exercises, loading, error } = useFirestoreCollection(exercisesCollection);

    // 2. Procesa la lista de grupos musculares
    const allMuscleGroups = useMemo(() => {
        if (!exercises) return [];
        return [...new Set(exercises.map(ex => ex.groupName))].sort();
    }, [exercises]);

    // 3. Crea una función 'getter' optimizada
    const getExerciseNameById = useCallback((id) => {
        if (!exercises) return 'Cargando...';
        
        const details = findExerciseDetails(exercises, id);
        return details ? details.name : 'Ejercicio Desconocido';
        
    }, [exercises]);

    // 4. Retorna los datos procesados y el estado de carga/error
    return {
        allExercises: exercises || [], // La lista de ejercicios BASE (con variaciones anidadas)
        allMuscleGroups,
        getExerciseNameById, // Función para obtener el nombre completo por ID
        loading,
        error,
    };
};