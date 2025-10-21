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
                    // Mantenemos el ID original (replacementTarget) y las propiedades de orden
                    // pero actualizamos el resto de los datos con los del nuevo ejercicio
                    return { 
                        ...newExerciseData, // Nuevos datos (nombre, grupo, isUnilateral, etc.)
                        id: replacementTarget, // Mantenemos el ID original para DND y referencias
                        exerciseId: exercise.id, // Guardamos el ID real del ejercicio base por si acaso
                        addedAt: ex.addedAt, // Mantenemos posición
                        supersetId: ex.supersetId, // Mantenemos superset
                        supersetOrder: ex.supersetOrder // Mantenemos orden en superset
                    };
                }
                return ex;
            }));
            setReplacementTarget(null);
        } else {
            // Añadir nuevo
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

    const handleRemoveSet = (exerciseId, setId) => {
        const callback = () => {
            setSessionExercises(prev => prev.map(ex => 
                ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex
            ));
        };
        startUndo('Serie eliminada', callback);
    };
    
    const handleDeleteExercise = (exerciseId) => {
        const callback = () => {
            setSessionExercises(prev => prev.filter(ex => ex.id !== exerciseId));
        };
        startUndo('Ejercicio eliminado', callback);
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