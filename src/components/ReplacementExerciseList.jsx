import React, { useState, useMemo } from 'react';
import { exerciseDatabase } from '../exercises.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import { Search, ChevronRight, PlusCircle } from 'lucide-react';

const normalizeText = (text = '') => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function ReplacementExerciseList({ user, onSelect, onShowCustomCreate }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
    const [expandedExerciseId, setExpandedExerciseId] = useState(null);

    const customExercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading } = useFirestoreCollection(customExercisesPath);

    const filteredExercises = useMemo(() => {
        const defaultMovements = exerciseDatabase.flatMap(group => group.items.map(item => ({ ...item, group: group.group, isCustom: false })));
        const allExercises = [...defaultMovements, ...customExercises.map(ex => ({...ex, isCustom: true, id: ex.id}))];
        let filtered = allExercises;
        if (muscleGroupFilter === 'custom') { filtered = customExercises.map(ex => ({...ex, variations: []})); }
        else if (muscleGroupFilter !== 'all') { filtered = filtered.filter(ex => ex.group === muscleGroupFilter); }
        if (searchTerm) { filtered = filtered.filter(ex => 
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.variations && ex.variations.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())))
        ); }
        return filtered;
    }, [customExercises, searchTerm, muscleGroupFilter]);

    const handleSelectVariation = (baseExercise, variation) => {
        const finalExercise = {
            group: baseExercise.group,
            id: variation.id,
            name: `${baseExercise.name} ${variation.name}`,
            baseName: baseExercise.name,
            variationName: variation.name,
            imageUrl: variation.imageUrl,
            isUnilateral: variation.isUnilateral || false
        };
        onSelect(finalExercise);
    };

    return (
        <div className="w-80 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg"/>
                </div>
                 <select value={muscleGroupFilter} onChange={e => setMuscleGroupFilter(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <option value="all">Todos los Grupos</option>
                    {[...new Set(exerciseDatabase.map(g => g.group))].sort().map(g => <option key={g} value={g}>{g}</option>)}
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
                {loading && <p className="text-center text-sm p-4">Cargando...</p>}
                {filteredExercises.map(exercise => (
                    <li key={exercise.id}>
                        <div 
                            onClick={() => exercise.variations && exercise.variations.length > 0 ? setExpandedExerciseId(exercise.id === expandedExerciseId ? null : exercise.id) : onSelect(exercise)} 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                        >
                            <span>{exercise.name} {exercise.isCustom && '(Custom)'}</span>
                            {exercise.variations && exercise.variations.length > 0 && <ChevronRight size={20} className={`transition-transform ${expandedExerciseId === exercise.id ? 'rotate-90' : ''}`} />}
                        </div>
                        {exercise.variations && expandedExerciseId === exercise.id && (
                            <ul className="pl-6 py-1 space-y-1">
                                {exercise.variations.map(variation => (
                                    <li 
                                        key={variation.id} 
                                        onClick={() => handleSelectVariation(exercise, variation)}
                                        className="p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 cursor-pointer"
                                    >
                                        {variation.name}
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