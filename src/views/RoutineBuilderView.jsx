import React, { useState, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { doc, deleteDoc, writeBatch, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import EditExerciseInRoutineModal from '../components/EditExerciseInRoutineModal.jsx';
import { PlusCircle, Trash2, ArrowLeft, PlayCircle, Edit, Link, Link2Off, GripVertical, Share2, EyeOff, Loader } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableExerciseItem = ({ group, selectionMode, selectedIds, handleToggleSelection, openEditModal, deleteExercise, handleRemoveSuperset }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group[0].supersetId || group[0].id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <li ref={setNodeRef} style={style} className={`p-4 rounded-lg shadow ${group.length > 1 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <div className="flex items-start gap-2">
                {!selectionMode && (<div {...attributes} {...listeners} className="p-2 cursor-grab touch-none"><GripVertical size={20} className="text-gray-400" /></div>)}
                <div className="flex-grow">
                    {group.length > 1 && (<div className="flex justify-between items-center mb-3"><h4 className="font-bold text-blue-800 dark:text-blue-300">Super-serie</h4>{!selectionMode && <button onClick={() => handleRemoveSuperset(group[0].supersetId)} className="p-1 text-red-500 hover:text-red-400"><Link2Off size={18} /></button>}</div>)}
                    <div className="space-y-3">
                        {group.map(ex => (
                            <React.Fragment key={ex.id}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">{selectionMode && (<input type="checkbox" checked={selectedIds.has(ex.id)} onChange={() => handleToggleSelection(ex.id)} className="h-5 w-5 rounded" disabled={!!ex.supersetId} />)}<div><p className="font-bold text-lg">{ex.baseName || ex.name}</p>{ex.variationName && <p className="text-sm text-gray-500 -mt-1">{ex.variationName}</p>}</div></div>
                                    {!selectionMode && (<div className="flex items-center gap-2"><button onClick={() => openEditModal(ex)} className="p-2 text-blue-500"><Edit size={18} /></button><button onClick={() => deleteExercise(ex.id)} className="p-2 text-red-500"><Trash2 size={18} /></button></div>)}
                                </div>
                                <div className={`mt-1 flex items-center gap-x-6 text-sm ${selectionMode ? 'pl-8' : ''}`}><span><strong>Series:</strong> {ex.sets}</span><span><strong>Reps:</strong> {ex.reps}</span><span><strong>Descanso:</strong> {ex.restMinutes || '0'}m {ex.restSeconds || '0'}s</span></div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </li>
    );
};

export default function RoutineBuilderView({ user }) {
    const { routineId } = useParams();
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSharing, setIsSharing] = useState(false);

    const routinePath = useMemo(() => user ? `users/${user.uid}/routines/${routineId}` : null, [user, routineId]);
    const { document: routineDoc, loading: routineLoading, refetch: refetchRoutine } = useFirestoreDocument(routinePath);

    const routineExercisesPath = useMemo(() => user && routineId ? `users/${user.uid}/routines/${routineId}/exercises` : null, [user, routineId]);
    const { data: exercises, loading: exercisesLoading } = useFirestoreCollection(routineExercisesPath, { orderBy: 'addedAt', direction: 'asc' });
    
    const groupedExercises = useMemo(() => {
        if (!exercises) return [];
        const groups = {};
        const singleExercises = [];
        exercises.forEach(ex => {
            if (ex.supersetId) {
                if (!groups[ex.supersetId]) groups[ex.supersetId] = [];
                groups[ex.supersetId].push(ex);
            } else { singleExercises.push([ex]); }
        });
        Object.values(groups).forEach(group => group.sort((a, b) => a.supersetOrder - b.supersetOrder));
        return [...Object.values(groups), ...singleExercises].sort((a, b) => (a[0].addedAt?.seconds || a[0].addedAt || 0) - (b[0].addedAt?.seconds || b[0].addedAt || 0));
    }, [exercises]);

    const deleteExercise = async (exerciseId) => {
        if (window.confirm("¿Seguro que quieres quitar este ejercicio?")) {
            await deleteDoc(doc(db, routineExercisesPath, exerciseId));
        }
    };
    
    const openEditModal = (exercise) => {
        setSelectedExercise(exercise);
        setIsEditModalOpen(true);
    };

    const handleToggleSelection = (exerciseId) => {
        const newSelection = new Set(selectedIds);
        newSelection.has(exerciseId) ? newSelection.delete(exerciseId) : newSelection.add(exerciseId);
        setSelectedIds(newSelection);
    };

    const handleCreateSuperset = async () => {
        if (selectedIds.size < 2) {
            alert("Debes seleccionar al menos 2 ejercicios para crear una super-serie.");
            return;
        }
        const batch = writeBatch(db);
        const newSupersetId = doc(collection(db, 'tmp')).id;
        Array.from(selectedIds).forEach((id, index) => {
            const docRef = doc(db, routineExercisesPath, id);
            batch.update(docRef, { supersetId: newSupersetId, supersetOrder: index });
        });
        await batch.commit();
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleRemoveSuperset = async (supersetId) => {
        const batch = writeBatch(db);
        const exercisesInGroup = exercises.filter(ex => ex.supersetId === supersetId);
        exercisesInGroup.forEach(ex => {
            const docRef = doc(db, routineExercisesPath, ex.id);
            batch.update(docRef, { supersetId: null, supersetOrder: null });
        });
        await batch.commit();
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = groupedExercises.findIndex(g => (g[0].supersetId || g[0].id) === active.id);
            const newIndex = groupedExercises.findIndex(g => (g[0].supersetId || g[0].id) === over.id);
            const batch = writeBatch(db);
            arrayMove(groupedExercises, oldIndex, newIndex).flat().forEach((ex, index) => {
                const docRef = doc(db, routineExercisesPath, ex.id);
                batch.update(docRef, { addedAt: index });
            });
            await batch.commit();
        }
    };
    
    const handleToggleShare = async () => {
        const currentlyShared = routineDoc?.isShared || false;
        const actionText = currentlyShared ? "dejar de compartir" : "compartir";
        const confirmation = window.confirm(`¿Seguro que quieres ${actionText} esta rutina? ${currentlyShared ? "Tus amigos ya no podrán verla." : "Será visible para tus amigos."}`);
        
        if (confirmation) {
            setIsSharing(true);
            try {
                await updateDoc(doc(db, routinePath), { isShared: !currentlyShared });
                refetchRoutine();
            } catch (error) {
                console.error("Error al cambiar el estado de compartición:", error);
            } finally {
                setIsSharing(false);
            }
        }
    };

    const loading = routineLoading || exercisesLoading;
    if (loading) return <ThemedLoader />;

    return (
        <>
            <AddExerciseToRoutineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} routineId={routineId} />
            <EditExerciseInRoutineModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} exercise={selectedExercise} user={user} routineId={routineId} routineExercisesPath={routineExercisesPath} />
            
            <Card>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <div>
                        <RouterLink to="/rutinas" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-2"><ArrowLeft size={16}/> Volver a Mis Rutinas</RouterLink>
                        <h2 className="text-3xl font-bold">{routineDoc?.name || 'Diseñar Rutina'}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleToggleShare} disabled={isSharing} className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md ${routineDoc?.isShared ? 'bg-gray-500 hover:bg-gray-600' : 'bg-purple-600 hover:bg-purple-500'}`}>
                            {isSharing ? <Loader className="animate-spin" size={20}/> : (routineDoc?.isShared ? <EyeOff size={20}/> : <Share2 size={20}/>)}
                            {routineDoc?.isShared ? 'Dejar de Compartir' : 'Compartir'}
                        </button>
                        {!selectionMode ? (
                            <>
                                <button onClick={() => setSelectionMode(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md"><Link size={20}/> Agrupar</button>
                                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md"><PlusCircle size={20}/> Añadir Ejercicio</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Cancelar</button>
                                <button onClick={handleCreateSuperset} className="px-4 py-2 bg-green-600 text-white rounded-lg" disabled={selectedIds.size < 2}>Confirmar Grupo</button>
                            </>
                        )}
                    </div>
                </div>
                
                {routineDoc?.isShared && (
                    <div className="p-3 mb-6 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg text-center font-semibold">
                        Esta rutina está compartida con tus amigos.
                    </div>
                )}
                
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <RouterLink to={`/session/${routineId}`} className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-500"><PlayCircle size={24} /> Iniciar Rutina</RouterLink>
                </div>
                
                {groupedExercises.length === 0 && !loading && (<p className="text-center text-gray-500 py-8">Esta rutina está vacía. Añade tu primer ejercicio.</p>)}
                
                {groupedExercises.length > 0 && (
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={groupedExercises.map(g => g[0].supersetId || g[0].id)} strategy={verticalListSortingStrategy}>
                            <ul className="space-y-4 mt-6">
                                {groupedExercises.map((group) => (
                                    <SortableExerciseItem key={group[0].supersetId || group[0].id} group={group} selectionMode={selectionMode} selectedIds={selectedIds} handleToggleSelection={handleToggleSelection} openEditModal={openEditModal} deleteExercise={deleteExercise} handleRemoveSuperset={handleRemoveSuperset} />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </Card>
        </>
    );
}