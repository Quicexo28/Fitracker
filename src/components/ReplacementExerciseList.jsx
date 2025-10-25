import React, { useState, useMemo } from 'react';
// import { exerciseDatabase } from '../exercises.js'; // <-- CAMBIO: Elimina esta línea
import { useExercises } from '../hooks/useExercises.jsx'; // <-- CAMBIO: Importa el hook
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import ThemedLoader from './ThemedLoader.jsx'; // <-- CAMBIO: Importa Loader
import { Search, ChevronRight, PlusCircle } from 'lucide-react';

const normalizeText = (text = '') => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// CAMBIO: Renombra el componente para que empiece con mayúscula (convención de React)
export default function ReplacementExerciseList({ user, onSelectExercise, onAddNewExercise }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all'); // Inicia mostrando todos

    const customExercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading: customLoading } = useFirestoreCollection(customExercisesPath, { orderBy: 'name', direction: 'asc' });

    // --- INICIO DE CAMBIOS ---
    const { allExercises: defaultMovements, allMuscleGroups, loading: defaultLoading, error: defaultError } = useExercises();
    const combinedLoading = customLoading || defaultLoading;
    const muscleGroups = useMemo(() => allMuscleGroups, [allMuscleGroups]);
    // --- FIN DE CAMBIOS ---

    const filteredExercises = useMemo(() => {
        // CAMBIO: Usa defaultMovements del hook
        const allBaseExercises = [...defaultMovements, ...customExercises.map(ex => ({ ...ex, isCustom: true, id: ex.id }))];
        
        let filtered = allBaseExercises;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(ex => (ex.groupName || ex.group) === selectedCategory); // CAMBIO: groupName o group
        }

        if (searchTerm) {
            const normalizedSearchTerm = normalizeText(searchTerm);
            filtered = filtered.filter(ex => normalizeText(ex.name).includes(normalizedSearchTerm));
        }
        
        // Simplemente lista los ejercicios base para reemplazo
        return filtered.map(ex => ({
             id: ex.id,
             name: ex.name,
             group: ex.groupName || ex.group, // CAMBIO: groupName o group
             isCustom: ex.isCustom || false,
             isUnilateral: ex.isUnilateral || false, // Asegura que esta propiedad exista
             // Puedes añadir imageUrl si lo necesitas
        }));

    }, [customExercises, searchTerm, selectedCategory, defaultMovements]); // CAMBIO: Añadir defaultMovements

    // --- INICIO DE CAMBIOS ---
    // Manejo de carga y error
    if (combinedLoading) {
        return <ThemedLoader />;
    }
    if (defaultError) {
        return <p className="text-red-500">Error al cargar ejercicios.</p>;
    }
    // --- FIN DE CAMBIOS ---

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Selecciona Ejercicio de Reemplazo</h3>
            <div className="flex gap-4 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar ejercicio..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                    <option value="all">Todos los Grupos</option>
                    <option value="custom">Mis Ejercicios</option>
                    {muscleGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={onAddNewExercise}
                className="w-full flex items-center justify-center gap-2 p-2 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900"
            >
                <PlusCircle size={18} /> Crear Nuevo Ejercicio Personalizado
            </button>

            <ul className="space-y-1 h-[40vh] overflow-y-auto pr-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                {filteredExercises.map(exercise => (
                    <li
                        key={exercise.id}
                        onClick={() => onSelectExercise(exercise)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                        <span>{exercise.name} {exercise.isCustom && <span className="text-xs text-blue-500">(Custom)</span>}</span>
                        <ChevronRight size={20} />
                    </li>
                ))}
                {filteredExercises.length === 0 && (
                    <p className="text-center text-gray-500 pt-4">No se encontraron ejercicios.</p>
                )}
            </ul>
        </div>
    );
}