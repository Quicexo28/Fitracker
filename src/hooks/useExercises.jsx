// src/hooks/useExercises.jsx
import { useMemo, useCallback } from 'react';
// import { collection } from 'firebase/firestore'; // Ya no necesitamos 'collection' aquí
// import { db } from '../firebase/config';         // Ni 'db' aquí
import useFirestoreCollection from './useFirestoreCollection.jsx'; // Tu hook existente

// Helper recursivo para encontrar el nombre de un ejercicio por ID (incluyendo variaciones)
// (Esta función auxiliar no cambia)
const findExerciseDetails = (items, id) => {
    if (!items) return null;
    for (const item of items) {
        if (item.id === id) return { name: item.name, group: item.groupName }; // Ejercicio base

        if (item.variations) {
            for (const variation of item.variations) {
                if (variation.id === id) return { name: `${item.name}: ${variation.name}`, group: item.groupName };
                
                if (variation.subvariations) { // Corregido: 'subvariations' en lugar de 'subVariations' si así está en tus datos
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
    // --- INICIO DE LA CORRECCIÓN ---
    // 1. Pasa el STRING de la ruta de la colección a tu hook
    const { data: exercises, loading, error } = useFirestoreCollection('exercises'); // <-- ¡AQUÍ ESTÁ EL CAMBIO!
    // --- FIN DE LA CORRECCIÓN ---

    // 2. Procesa la lista de grupos musculares (sin cambios)
    const allMuscleGroups = useMemo(() => {
        if (!exercises) return [];
        return [...new Set(exercises.map(ex => ex.groupName))].sort();
    }, [exercises]);

    // 3. Crea una función 'getter' optimizada (sin cambios)
    const getExerciseNameById = useCallback((id) => {
        if (loading) return 'Cargando...'; // Mejor manejo de carga aquí
        if (!exercises) return 'Error al cargar';
        
        const details = findExerciseDetails(exercises, id);
        return details ? details.name : 'Ejercicio Desconocido';
        
    }, [exercises, loading]); // Añadir loading a dependencias

    // 4. Retorna los datos procesados y el estado de carga/error (sin cambios)
    return {
        allExercises: exercises || [],
        allMuscleGroups,
        getExerciseNameById,
        loading,
        error,
    };
};