import { useState, useEffect } from 'react';
import useUndo from './useUndo.jsx'; // Ruta correcta

export default function useSessionManager(sessionExercises, setSessionExercises) {
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
    const [replacementTarget, setReplacementTarget] = useState(null);
    
    const { startUndo, onUndo, undoState } = useUndo(5000);
    
    const handleAddOrReplaceExercise = (exercise) => {
        const newExercise = {
            ...exercise,
            sets: Array.from({ length: exercise.sets || 1 }, (_, i) => ({ id: `${exercise.id}-${i + 1}`, setNumber: i + 1 }))
        };
        if (replacementTarget) {
            setSessionExercises(prev => prev.map(ex => ex.id === replacementTarget ? { ...newExercise, id: replacementTarget, sets: ex.sets } : ex));
            setReplacementTarget(null);
        } else {
            setSessionExercises(prev => [...prev, newExercise]);
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