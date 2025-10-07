import React, { useState, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { exerciseDatabase } from '../exercises.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from './Card.jsx';
import ExerciseDetailForm from './ExerciseDetailForm.jsx';
import AddExerciseModal from './AddExerciseModal.jsx';
import { X, Search, ChevronRight, ArrowLeft, PlusCircle } from 'lucide-react';

const normalizeText = (text = '') => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function AddExerciseToRoutineModal({ isOpen, onClose, user, routineId, onExerciseAdded }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [expandedExerciseId, setExpandedExerciseId] = useState(null);
    const [expandedVariationId, setExpandedVariationId] = useState(null);
    const [expandedSubVariationId, setExpandedSubVariationId] = useState(null);

    const customExercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading } = useFirestoreCollection(customExercisesPath, { orderBy: 'name', direction: 'asc' });

    const filteredExercises = useMemo(() => {
        if (!selectedCategory) return [];
        const defaultMovements = exerciseDatabase.flatMap(group => group.items.map(item => ({ ...item, group: group.group, isCustom: false })));
        const allExercises = [...defaultMovements, ...customExercises.map(ex => ({ ...ex, isCustom: true, id: ex.id }))];
        
        let filtered = allExercises;
        if (selectedCategory === 'custom') { filtered = customExercises; }
        else if (selectedCategory !== 'all') { filtered = filtered.filter(ex => ex.group === selectedCategory); }
        
        if (searchTerm) {
            const normalizedSearchTerm = normalizeText(searchTerm);
            filtered = filtered.filter(ex => 
                normalizeText(ex.name).includes(normalizedSearchTerm) ||
                ex.variations?.some(v => 
                    normalizeText(v.name).includes(normalizedSearchTerm) ||
                    v.subVariations?.some(sv => 
                        normalizeText(sv.name).includes(normalizedSearchTerm) ||
                        sv.executionTypes?.some(et => normalizeText(et.name).includes(normalizedSearchTerm))
                    )
                )
            );
        }
        return filtered;
    }, [customExercises, searchTerm, selectedCategory]);
    
    const routineExercisesPath = useMemo(() => user && routineId ? `users/${user.uid}/routines/${routineId}/exercises` : null, [user, routineId]);

    const selectExercise = (exerciseData) => {
        setSelectedExercise({
            id: exerciseData.id,
            name: exerciseData.name,
            baseName: exerciseData.baseName || exerciseData.name,
            variationName: exerciseData.variationName || '',
            group: exerciseData.group,
            imageUrl: exerciseData.imageUrl,
            isUnilateral: !!exerciseData.isUnilateral
        });
    };
    
    const handleAddExercise = async (fullExerciseData) => {
        if (!routineExercisesPath) return;
        setIsSubmitting(true);
        try {
            const exerciseId = fullExerciseData.id;
            const newExerciseRef = doc(db, routineExercisesPath, exerciseId);
            await setDoc(newExerciseRef, { ...fullExerciseData, addedAt: serverTimestamp() });
            handleClose();
            if (onExerciseAdded) onExerciseAdded();
        } catch (error) {
            console.error("Error al añadir ejercicio:", error);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleExerciseCreated = (newExercise) => {
        setIsCreatingNew(false);
        setSelectedExercise(newExercise);
    };

    const handleExecutionTypeClick = (base, variation, subVar, execType) => {
        selectExercise({ ...execType, name: `${base.name}: ${subVar.name} (${execType.name})`, group: base.group });
    };
    const handleSubVariationClick = (base, variation, subVar) => {
        if (!subVar.executionTypes || subVar.executionTypes.length === 0) {
            selectExercise({ ...subVar, name: `${base.name}: ${variation.name} (${subVar.name})`, group: base.group });
        } else {
            setExpandedSubVariationId(subVar.id === expandedSubVariationId ? null : subVar.id);
        }
    };
    const handleVariationClick = (base, variation) => {
        if (!variation.subVariations || variation.subVariations.length === 0) {
            selectExercise({ ...variation, name: `${base.name}: ${variation.name}`, group: base.group });
        } else {
            setExpandedVariationId(variation.id === expandedVariationId ? null : variation.id);
        }
    };
    const handleExerciseClick = (exercise) => {
        if (!exercise.variations || exercise.variations.length === 0) {
            selectExercise(exercise);
        } else {
            setExpandedExerciseId(exercise.id === expandedExerciseId ? null : exercise.id);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedCategory(null);
        setSelectedExercise(null);
        setIsCreatingNew(false);
        setExpandedExerciseId(null);
        setExpandedVariationId(null);
        setExpandedSubVariationId(null);
        onClose();
    };
    
    const muscleGroups = useMemo(() => [...new Set(exerciseDatabase.map(group => group.group))], []);

    if (!isOpen) return null;

    if (isCreatingNew) {
        return <AddExerciseModal isOpen={true} onClose={() => setIsCreatingNew(false)} user={user} onExerciseCreated={handleExerciseCreated} />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                        {selectedExercise ? 'Detalles del Ejercicio' : selectedCategory ? `Ejercicios de ${selectedCategory}` : 'Añadir Ejercicio'}
                    </h3>
                    <button onClick={handleClose} className="p-1"><X /></button>
                </div>
                
                {!selectedCategory && !selectedExercise && (
                    <>
                        <button onClick={() => setIsCreatingNew(true)} className="w-full flex items-center justify-center gap-2 p-3 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900">
                            <PlusCircle size={18}/>Crear Ejercicio Personalizado
                        </button>
                        <ul className="space-y-2 h-[50vh] overflow-y-auto border-t border-gray-200 dark:border-gray-700 pt-4">
                            <li onClick={() => setSelectedCategory('all')} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer font-semibold"><span>Todos</span><ChevronRight /></li>
                            <li onClick={() => setSelectedCategory('custom')} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer font-semibold"><span>Mis Ejercicios</span><ChevronRight /></li>
                            {muscleGroups.map(group => (
                                <li key={group} onClick={() => setSelectedCategory(group)} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"><span>{group}</span><ChevronRight /></li>
                            ))}
                        </ul>
                    </>
                )}
                
                {selectedCategory && !selectedExercise && (
                    <>
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><ArrowLeft /></button>
                            <div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder={`Buscar en ${selectedCategory}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg"/></div>
                        </div>
                        <ul className="space-y-1 h-[50vh] overflow-y-auto pr-2">
                            {loading ? <p>Cargando...</p> : filteredExercises.map(exercise => (
                                <li key={exercise.id}>
                                    <div onClick={() => handleExerciseClick(exercise)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        <span>{exercise.name} {exercise.isCustom && '(Custom)'}</span>
                                        {exercise.variations && exercise.variations.length > 0 && <ChevronRight size={20} className={`transition-transform ${expandedExerciseId === exercise.id ? 'rotate-90' : ''}`} />}
                                    </div>
                                    
                                    {exercise.variations && expandedExerciseId === exercise.id && (
                                        <ul className="pl-4 py-1 space-y-1">
                                            {exercise.variations.map(variation => (
                                                <li key={variation.id}>
                                                    <div onClick={() => handleVariationClick(exercise, variation)} className="flex items-center justify-between p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer">
                                                        <span>{variation.name}</span>
                                                        {variation.subVariations && variation.subVariations.length > 0 && <ChevronRight size={18} className={`transition-transform ${expandedVariationId === variation.id ? 'rotate-90' : ''}`} />}
                                                    </div>
                                                    
                                                    {variation.subVariations && expandedVariationId === variation.id && (
                                                        <ul className="pl-4 py-1 space-y-1">
                                                            {variation.subVariations.map(subVar => (
                                                                <li key={subVar.id}>
                                                                    <div onClick={() => handleSubVariationClick(exercise, variation, subVar)} className="flex items-center justify-between p-2 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer text-sm">
                                                                        <span>{subVar.name}</span>
                                                                        {subVar.executionTypes && subVar.executionTypes.length > 0 && <ChevronRight size={16} className={`transition-transform ${expandedSubVariationId === subVar.id ? 'rotate-90' : ''}`} />}
                                                                    </div>
                                                                    {subVar.executionTypes && expandedSubVariationId === subVar.id && (
                                                                        <ul className="pl-4 py-1 space-y-1">
                                                                            {subVar.executionTypes.map(execType => (
                                                                                <li key={execType.id} onClick={() => handleExecutionTypeClick(exercise, variation, subVar, execType)} className="p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 cursor-pointer text-xs">
                                                                                    {execType.name}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {selectedExercise && (
                    <ExerciseDetailForm exercise={selectedExercise} onSave={handleAddExercise} onCancel={() => setSelectedExercise(null)} isSubmitting={isSubmitting} mode="add" />
                )}
            </Card>
        </div>
    );
}