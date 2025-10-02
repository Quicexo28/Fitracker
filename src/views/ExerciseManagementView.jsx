import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { exerciseDatabase } from '../exercises.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import AddExerciseModal from '../components/AddExerciseModal.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { PlusCircle, Search, Trash2, BarChart2, ChevronDown } from 'lucide-react';

const normalizeText = (text = '') => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function ExerciseManagementView({ user }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    const exercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);
    const { data: customExercises, loading } = useFirestoreCollection(exercisesPath, { orderBy: 'name', direction: 'asc' });
    
    // ... (resto de funciones sin cambios)

    const filteredExercises = useMemo(() => {
        const flatDefaultExercises = exerciseDatabase.flatMap(group =>
            group.items.map(item => ({ ...item, group: group.group, isCustom: false }))
        );
        const formattedCustomExercises = customExercises.map(ex => ({ ...ex, isCustom: true, variations: [] }));
        
        let all = [...flatDefaultExercises, ...formattedCustomExercises].sort((a, b) => a.name.localeCompare(b.name));
        
        // ... (resto de la lógica de filtrado sin cambios)

        return all;
    }, [searchTerm, muscleGroupFilter, sourceFilter, customExercises]);

    return (
        <>
            <AddExerciseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} />
            <Card>
                {/* ... (código del encabezado y filtros sin cambios) */}

                {loading && (sourceFilter === 'custom' || sourceFilter === 'all') ? <ThemedLoader /> : (
                    <ul className="space-y-2 h-[55vh] overflow-y-auto pr-2">
                        {filteredExercises.map((exercise) => {
                            const hasVariations = exercise.variations && exercise.variations.length > 0;
                            const isExpanded = expandedId === exercise.id;

                            return (
                                <li key={exercise.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => hasVariations && setExpandedId(isExpanded ? null : exercise.id)}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{exercise.name}</span>
                                            {exercise.isCustom && <span className="text-xs text-blue-500">(Custom)</span>}
                                            {exercise.isUnilateral && !hasVariations && <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Unilateral</span>}
                                        </div>
                                        {/* ... */}
                                    </div>
                                    {isExpanded && hasVariations && (
                                        <ul className="pl-8 pr-4 pb-3 border-t">
                                            {exercise.variations.map(variation => (
                                                <li key={variation.id} className="mt-2">
                                                    <Link to={`/ejercicios/${variation.id}`} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-blue-100">
                                                        <div className="flex items-center gap-2">
                                                            <span>{variation.name}</span>
                                                            {variation.isUnilateral && <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">Unilateral</span>}
                                                        </div>
                                                        <BarChart2 size={16} className="text-blue-500" />
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </>
    );
}