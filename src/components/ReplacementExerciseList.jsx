import React, { useState, useMemo } from 'react';
import { exerciseDatabase } from '../exercises.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import { Search, ChevronRight, PlusCircle } from 'lucide-react';

const normalizeText = (text = '') => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function ReplacementExerciseList({ user, onSelect, onShowCustomCreate }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
    
    const [expandedExerciseId, setExpandedExerciseId] = useState(null);
    const [expandedVariationId, setExpandedVariationId] = useState(null);
    const [expandedSubVariationId, setExpandedSubVariationId] = useState(null);

    const customExercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading } = useFirestoreCollection(customExercisesPath);
    
    const muscleGroups = useMemo(() => [...new Set(exerciseDatabase.map(group => group.group))].sort(), []);

    const filteredExercises = useMemo(() => {
        const defaultMovements = exerciseDatabase.flatMap(group => group.items.map(item => ({ ...item, group: group.group, isCustom: false })));
        const allExercises = [...defaultMovements, ...customExercises.map(ex => ({...ex, isCustom: true, id: ex.id}))];
        
        let filtered = allExercises;
        if (muscleGroupFilter === 'custom') { filtered = customExercises.map(ex => ({...ex, variations: []})); }
        else if (muscleGroupFilter !== 'all') { filtered = filtered.filter(ex => ex.group === muscleGroupFilter); }
        
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
    }, [customExercises, searchTerm, muscleGroupFilter]);

    const selectExercise = (exerciseData) => onSelect(exerciseData);
    const handleExecutionTypeClick = (base, variation, subVar, execType) => selectExercise({ ...execType, name: `${base.name}: ${subVar.name} (${execType.name})`, group: base.group });
    const handleSubVariationClick = (base, variation, subVar) => !subVar.executionTypes || subVar.executionTypes.length === 0 ? selectExercise({ ...subVar, name: `${base.name}: ${variation.name} (${subVar.name})`, group: base.group }) : setExpandedSubVariationId(subVar.id === expandedSubVariationId ? null : subVar.id);
    const handleVariationClick = (base, variation) => !variation.subVariations || variation.subVariations.length === 0 ? selectExercise({ ...variation, name: `${base.name}: ${variation.name}`, group: base.group }) : setExpandedVariationId(variation.id === expandedVariationId ? null : variation.id);
    const handleExerciseClick = (exercise) => !exercise.variations || exercise.variations.length === 0 ? selectExercise(exercise) : setExpandedExerciseId(exercise.id === expandedExerciseId ? null : exercise.id);

    return (
        <div className="w-80 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                </div>
                 <select value={muscleGroupFilter} onChange={e => setMuscleGroupFilter(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg col-span-2">
                    <option value="all">Todos los Grupos Musculares</option>
                    {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="custom" className="font-bold">Mis Ejercicios</option>
                </select>
            </div>
            
            <button 
                onClick={onShowCustomCreate} 
                className="w-full flex items-center justify-center gap-2 p-3 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900"
            >
                <PlusCircle size={18}/>
                Crear Ejercicio Personalizado
            </button>

            <ul className="space-y-1 h-[50vh] overflow-y-auto pr-2">
                {loading ? <p className="text-center text-sm p-4">Cargando...</p> : filteredExercises.map(exercise => (
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
        </div>
    );
}