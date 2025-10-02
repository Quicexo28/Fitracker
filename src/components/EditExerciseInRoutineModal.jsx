import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import Card from './Card.jsx';
import { Loader, Save, X, ChevronDown } from 'lucide-react';
import ReplacementExerciseList from './ReplacementExerciseList.jsx';
import ExerciseDetailForm from './ExerciseDetailForm.jsx'; // Importamos el formulario

export default function EditExerciseInRoutineModal({ isOpen, onClose, exercise, user, routineExercisesPath, onExerciseUpdated }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReplaceListOpen, setIsReplaceListOpen] = useState(false);
    const replaceContainerRef = useRef(null);
    const [currentExercise, setCurrentExercise] = useState(exercise);

    useEffect(() => {
        setCurrentExercise(exercise);
    }, [exercise]);

    useEffect(() => {
        const handleClickOutside = (event) => { if (replaceContainerRef.current && !replaceContainerRef.current.contains(event.target)) { setIsReplaceListOpen(false); } };
        if (isReplaceListOpen) { document.addEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isReplaceListOpen]);

    const handleSave = async (exerciseData) => {
        if (!currentExercise) return;
        setIsSubmitting(true);
        try {
            // Los detalles ya vienen procesados desde ExerciseDetailForm
            const { id, name, group, imageUrl, isUnilateral, ...details } = exerciseData;

            if (exercise.id !== currentExercise.id) {
                // Si el ejercicio se reemplazó, borramos el viejo y creamos el nuevo
                await deleteDoc(doc(db, routineExercisesPath, exercise.id));
                await setDoc(doc(db, routineExercisesPath, currentExercise.id), {
                    ...currentExercise,
                    ...details,
                    addedAt: serverTimestamp(),
                });
            } else {
                // Si solo se editaron los detalles, actualizamos
                const exerciseDocRef = doc(db, routineExercisesPath, currentExercise.id);
                await updateDoc(exerciseDocRef, details);
            }
            onClose();
            if (onExerciseUpdated) { onExerciseUpdated(); }
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReplaceExercise = (newExercise) => {
        setCurrentExercise(newExercise);
        setIsReplaceListOpen(false);
    };

    if (!isOpen || !currentExercise) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative" ref={replaceContainerRef}>
                        <button type="button" onClick={() => setIsReplaceListOpen(prev => !prev)} className="flex items-center gap-2 text-xl font-semibold hover:text-blue-500">
                            {currentExercise?.name || 'Seleccionar Ejercicio'}
                            <ChevronDown size={20} className={`transition-transform ${isReplaceListOpen ? 'rotate-180' : ''}`}/>
                        </button>
                        {isReplaceListOpen && (
                            <div className="absolute top-full left-0 mt-2 z-10"><ReplacementExerciseList user={user} onSelect={handleReplaceExercise} onClose={() => setIsReplaceListOpen(false)}/></div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X /></button>
                </div>
                <ExerciseDetailForm 
                    exercise={currentExercise}
                    onSave={handleSave}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                    mode="edit"
                />
            </Card>
        </div>
    );
}