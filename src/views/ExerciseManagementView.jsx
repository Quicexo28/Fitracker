import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
// import { exerciseDatabase } from '../exercises.js'; // <-- CAMBIO: Eliminado
import { useExercises } from '../hooks/useExercises.jsx'; // <-- CAMBIO: Importar hook
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import AddExerciseModal from '../components/AddExerciseModal.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { PlusCircle, Search, Trash2, BarChart2, ChevronDown, SlidersHorizontal } from 'lucide-react';

const normalizeText = (text = '') => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function ExerciseManagementView({ user }) {
    // ... (tus estados no cambian) ...
    const [searchTerm, setSearchTerm] = useState('');
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const exercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading: customLoading } = useFirestoreCollection(exercisesPath, { orderBy: 'name', direction: 'asc' });
    
    // --- INICIO DE CAMBIOS ---
    const { allExercises: defaultExercises, allMuscleGroups, loading: defaultLoading } = useExercises();
    const combinedLoading = customLoading || defaultLoading;
    
    // CAMBIO: Usar allMuscleGroups del hook
    const muscleGroups = useMemo(() => allMuscleGroups, [allMuscleGroups]);
    // --- FIN DE CAMBIOS ---

    const filteredExercises = useMemo(() => {
        // CAMBIO: Usar defaultExercises (del hook) en lugar de exerciseDatabase
        const flatDefaultExercises = defaultExercises.flatMap(item => {
            // Esta lógica anidada es para expandir todas las variaciones,
            // subvariaciones y tipos de ejecución en una lista plana.
            const base = {
                id: item.id,
                name: item.name,
                group: item.groupName, // CAMBIO: group a groupName
                isCustom: false,
                imageUrl: item.imageUrl
            };

            if (!item.variations || item.variations.length === 0) {
                return [base];
            }

            return item.variations.flatMap(variation => {
                const variationBase = {
                    ...variation,
                    name: `${item.name}: ${variation.name}`,
                    group: item.groupName,
                    isCustom: false,
                };

                if (!variation.subvariations || variation.subvariations.length === 0) {
                    return [variationBase];
                }

                return variation.subvariations.flatMap(subVar => {
                    const subVariationBase = {
                        ...subVar,
                        name: `${item.name}: ${variation.name} (${subVar.name})`,
                        group: item.groupName,
                        isCustom: false,
                    };

                    if (!subVar.executionTypes || subVar.executionTypes.length === 0) {
                        return [subVariationBase];
                    }

                    return subVar.executionTypes.map(execType => ({
                        ...execType,
                        name: `${item.name}: ${subVar.name} (${execType.name})`,
                        group: item.groupName,
                        isCustom: false,
                    }));
                });
            });
        });

        const formattedCustomExercises = customExercises.map(ex => ({ ...ex, isCustom: true, variationName: '(Personalizado)' }));
        
        let all = [...flatDefaultExercises, ...formattedCustomExercises].sort((a, b) => normalizeText(a.name).localeCompare(normalizeText(b.name)));
        
        // ... (Tu lógica de filtrado no cambia) ...
        if (sourceFilter !== 'all') {
            all = all.filter(ex => sourceFilter === 'custom' ? ex.isCustom : !ex.isCustom);
        }
        if (muscleGroupFilter !== 'all') {
            all = all.filter(ex => ex.group === muscleGroupFilter);
        }
        if (searchTerm) {
            const normalizedSearchTerm = normalizeText(searchTerm);
            all = all.filter(ex => normalizeText(ex.name).includes(normalizedSearchTerm));
        }

        return all;
    }, [searchTerm, muscleGroupFilter, sourceFilter, customExercises, defaultExercises]); // CAMBIO: Añadir defaultExercises

    // ... (Tu función deleteCustomExercise no cambia) ...
    const deleteCustomExercise = async (exerciseId) => {
        if (window.confirm("¿Seguro que quieres eliminar este ejercicio personalizado? Esta acción es permanente.")) {
            try {
                await deleteDoc(doc(db, exercisesPath, exerciseId));
            } catch (error) {
                console.error("Error al eliminar ejercicio:", error);
                alert("No se pudo eliminar el ejercicio.");
            }
        }
    };

    return (
        <>
            <AddExerciseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} />
            <Card>
                {/* ... (Tu JSX de encabezado y filtros no cambia) ... */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h2 className="text-3xl font-bold">Biblioteca de Ejercicios</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg">
                        <PlusCircle size={20} /> Crear Ejercicio
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="relative md:col-span-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar ejercicio por nombre..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Grupo Muscular</label>
                        <select
                            value={muscleGroupFilter}
                            onChange={e => setMuscleGroupFilter(e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                        >
                            <option value="all">Todos</option>
                            {muscleGroups.map(group => <option key={group} value={group}>{group}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Origen</label>
                        <select
                            value={sourceFilter}
                            onChange={e => setSourceFilter(e.target.value)}
                            className="w-full p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                        >
                            <option value="all">Todos</option>
                            <option value="default">Por Defecto</option>
                            <option value="custom">Personalizados</option>
                        </select>
                    </div>
                </div>
                
                {/* --- LISTA DE EJERCICIOS --- */}
                <div className="h-[55vh] overflow-y-auto pr-2">
                    {/* CAMBIO: Usar combinedLoading */}
                    {combinedLoading ? <ThemedLoader /> : (
                        <ul className="space-y-2">
                            {filteredExercises.map((exercise) => (
                                <li key={exercise.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between p-3">
                                        <div>
                                            <span className="font-medium">{exercise.name}</span>
                                            {exercise.isCustom && <span className="ml-2 text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Personalizado</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link to={`/ejercicios/${exercise.id}`} className="p-2 text-gray-500 hover:text-blue-500">
                                                <BarChart2 size={18} />
                                            </Link>
                                            {exercise.isCustom && (
                                                <button onClick={() => deleteCustomExercise(exercise.id)} className="p-2 text-gray-500 hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Card>
        </>
    );
}