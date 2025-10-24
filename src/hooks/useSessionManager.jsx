// src/hooks/useSessionManager.jsx
import { useState } from 'react';
import useUndo from './useUndo.jsx';

export default function useSessionManager(sessionExercises, setSessionExercises) {
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [replacementTarget, setReplacementTarget] = useState(null); // Guarda el ID del ejercicio a reemplazar
    
    const { startUndo, onUndo, undoState } = useUndo(5000);
    
    const handleAddOrReplaceExercise = (exercise) => { // 'exercise' es el NUEVO ejercicio seleccionado
        const newExerciseData = {
            ...exercise,
            sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({ id: `${exercise.id}-${i + 1}`, setNumber: i + 1 }))
        };

        if (replacementTarget) {
            setSessionExercises(prev => prev.map(ex => {
                if (ex.id === replacementTarget) {
                    return { 
                        ...newExerciseData,
                        id: replacementTarget,
                        exerciseId: exercise.id,
                        addedAt: ex.addedAt,
                        supersetId: ex.supersetId,
                        supersetOrder: ex.supersetOrder
                    };
                }
                return ex;
            }));
            setReplacementTarget(null);
        } else {
            setSessionExercises(prev => [...prev, { ...newExerciseData, addedAt: { seconds: Date.now() / 1000 } }]);
        }
    };

    const openReplaceModal = (exerciseId) => {
        setReplacementTarget(exerciseId);
        setIsReplacementModalOpen(true);
    };

    const openAddModal = () => {
        setReplacementTarget(null);
        setIsAddExerciseModalOpen(true);
    };
    
    const handleShowCustomCreateFromReplacement = () => {
        setIsReplacementModalOpen(false);
        setIsAddExerciseModalOpen(true);
    };

    const handleAddSet = (exerciseId) => {
        setSessionExercises(prev => prev.map(ex => {
            if (ex.id === exerciseId) {
                const newSetNumber = ex.sets.length > 0 ? Math.max(...ex.sets.map(s => s.setNumber)) + 1 : 1;
                return { ...ex, sets: [...ex.sets, { id: `${ex.id}-${newSetNumber}`, setNumber: newSetNumber }] };
            }
            return ex;
        }));
    };

    // --- LÓGICA MODIFICADA ---
    const handleRemoveSet = (exerciseId, setId) => {
        // 1. Encontrar los datos para poder restaurarlos
        let exerciseToRestore;
        let setToRestore;
        let setIndex = -1;
        
        exerciseToRestore = sessionExercises.find(ex => ex.id === exerciseId);
        if (exerciseToRestore) {
            setToRestore = exerciseToRestore.sets.find(s => s.id === setId);
            setIndex = exerciseToRestore.sets.findIndex(s => s.id === setId);
        }

        if (!setToRestore || setIndex === -1) return; // No se encontró la serie

        // 2. Ejecutar la acción (Eliminar la serie) INMEDIATAMENTE
        setSessionExercises(prev => prev.map(ex => 
            ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex
        ));

        // 3. Definir el callback de "deshacer" (Restaurar la serie)
        const undoCallback = () => {
            setSessionExercises(prev => prev.map(ex => {
                if (ex.id === exerciseId) {
                    const newSets = [...ex.sets];
                    // Insertar la serie de vuelta en su posición original
                    newSets.splice(setIndex, 0, setToRestore);
                    return { ...ex, sets: newSets };
                }
                return ex;
            }));
        };

        // 4. Iniciar la barra de "deshacer" con el callback de RESTAURACIÓN
        startUndo('Serie eliminada', undoCallback);
    };
    
    // --- LÓGICA MODIFICADA ---
    const handleDeleteExercise = (exerciseId) => {
        // 1. Encontrar los datos para poder restaurarlos
        const exerciseToRestore = sessionExercises.find(ex => ex.id === exerciseId);
        const originalIndex = sessionExercises.findIndex(ex => ex.id === exerciseId);

        if (!exerciseToRestore || originalIndex === -1) return; // No se encontró el ejercicio

        // 2. Ejecutar la acción (Eliminar el ejercicio) INMEDIATAMENTE
        setSessionExercises(prev => prev.filter(ex => ex.id !== exerciseId));

        // 3. Definir el callback de "deshacer" (Restaurar el ejercicio)
        const undoCallback = () => {
            setSessionExercises(prev => {
                const newList = [...prev];
                // Insertar el ejercicio de vuelta en su posición original
                newList.splice(originalIndex, 0, exerciseToRestore);
                return newList;
            });
        };

        // 4. Iniciar la barra de "deshacer" con el callback de RESTAURACIÓN
        startUndo('Ejercicio eliminado', undoCallback);
    };
    
    return {
        isAddExerciseModalOpen, setIsAddExerciseModalOpen,
        isReplacementModalOpen, setIsReplacementModalOpen,
        handleAddSet,
        handleRemoveSet,
        handleDeleteExercise,
        handleAddOrReplaceExercise,
        openReplaceModal,
        openAddModal,
        handleShowCustomCreateFromReplacement,
        onUndo,
        undoState
    };
}