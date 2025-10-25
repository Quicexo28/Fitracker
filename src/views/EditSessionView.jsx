import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { updateWorkoutSession } from '../firebase/sessionService.js';
import useSessionManager from '../hooks/useSessionManager.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { ArrowLeft, Loader, PlusCircle, Trash2, MoreVertical, RefreshCw, CheckCircle, Square, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { UndoActionTypes } from '../hooks/useUndoManager'; // <-- Importar tipos de acción

// --- Componente SetRow (Idéntico a CreateSessionView) ---
const SetRow = ({ setInfo, exerciseId, onSetChange, onCompleteSet, initialData, preferences, onRemoveSet }) => {
    const [isCompleted, setIsCompleted] = useState(initialData.completed || false);
    useEffect(() => { setIsCompleted(initialData.completed || false); }, [initialData.completed]);
    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
    const toggleComplete = () => {
        const newStatus = !isCompleted;
        setIsCompleted(newStatus);
        onCompleteSet(exerciseId, setInfo.setNumber, newStatus);
    };
    const handleChange = (field, value) => onSetChange(exerciseId, setInfo.setNumber, field, value);

    return (
         <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
             <div className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] items-center gap-2`}>
                <span className="font-bold text-center pr-2">{setInfo.setNumber}</span>
                <input type="number" step="any" name="weight" defaultValue={initialData.weight} onChange={(e) => handleChange('weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <input type="number" name="reps" defaultValue={initialData.reps} onChange={(e) => handleChange('reps', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <select name="effort" defaultValue={initialData.effort} onChange={(e) => handleChange('effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center">
                    <option value="">{preferences?.effortMetric?.toUpperCase() || '...'}</option>
                    {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button onClick={toggleComplete} className="flex justify-center p-1">{isCompleted ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>}</button>
                <button onClick={() => onRemoveSet(exerciseId, setInfo.id)} className="flex justify-center p-1 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
            {/* Input de Nota podría añadirse aquí si es necesario */}
        </div>
    );
};

// --- Componente ExerciseCard (Idéntico a CreateSessionView) ---
const ExerciseCard = ({ exercise, preferences, workoutData, onSetChange, onCompleteSet, onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{exercise.name || exercise.exerciseName}</h3>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><MoreVertical size={20} /></button>
                    {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                <button onClick={() => { onReplaceExercise(exercise.id || exercise.exerciseId); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={16}/> Reemplazar</button>
                                <button onClick={() => { onDeleteExercise(exercise.id || exercise.exerciseId); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"><Trash2 size={16}/> Eliminar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-2 text-sm font-semibold text-center mb-2">
                <span>Serie</span><span>Peso ({preferences?.weightUnit?.toUpperCase() || '...'})</span><span>Reps</span><span className="uppercase">{preferences?.effortMetric || '...'}</span><span colSpan={2}></span>
            </div>
            <div className="space-y-2">
                {exercise.sets.map((setInfo) => {
                    const initialDataForSet = workoutData[exercise.id || exercise.exerciseId]?.[setInfo.setNumber] || {};
                    return (<SetRow key={setInfo.id} setInfo={setInfo} exerciseId={exercise.id || exercise.exerciseId} onSetChange={onSetChange} onCompleteSet={onCompleteSet} initialData={initialDataForSet} preferences={preferences} onRemoveSet={onRemoveSet}/>);
                })}
            </div>
            <div className="mt-4"><button onClick={() => onAddSet(exercise.id || exercise.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"><PlusCircle size={16} /> Agregar Serie</button></div>
        </div>
    );
};

// --- Vista Principal (con addUndoAction como prop) ---
export default function EditSessionView({ user, addUndoAction }) { // <-- Recibe addUndoAction
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { preferences } = usePreferences();
    const [workoutData, setWorkoutData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFinishConfirmationOpen, setIsFinishConfirmationOpen] = useState(false);
    const [isDeleteExerciseConfirmationOpen, setIsDeleteExerciseConfirmationOpen] = useState(false);
    const [exerciseIdToDelete, setExerciseIdToDelete] = useState(null);

    const sessionPath = useMemo(() => user ? `users/${user.uid}/sessions/${sessionId}` : null, [user, sessionId]);
    const { document: existingSession, loading: sessionLoading } = useFirestoreDocument(sessionPath);

    const {
        sessionExercises, setSessionExercises, loading: managerLoading, error: managerError,
        isAddExerciseModalOpen, setIsAddExerciseModalOpen,
        handleAddSet,
        handleRemoveSet: removeSetFromState,
        handleDeleteExercise: deleteExerciseFromState,
        handleAddOrReplaceExercise, openReplaceModal, openAddModal
    } = useSessionManager(null, existingSession, true);

    // useEffect para poblar workoutData (sin cambios)
    useEffect(() => {
        if (existingSession?.exercises) {
            const initialData = {};
            existingSession.exercises.forEach(ex => {
                initialData[ex.exerciseId] = {};
                ex.sets.forEach(set => {
                    initialData[ex.exerciseId][set.set] = {
                        id: set.id || uuidv4(), setNumber: set.set,
                        weight: set.weight !== undefined ? String(set.weight) : '',
                        reps: set.reps !== undefined ? String(set.reps) : '',
                        effort: set.effort || '', completed: set.completed || false,
                        note: set.note || '', isPR: set.isPR || false
                     };
                });
            });
            setWorkoutData(initialData);
        }
    }, [existingSession]);

    // Handlers para cambios en inputs (sin cambios)
    const handleSetChange = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(p => { const current = p[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber }; return { ...p, [exerciseId]: { ...p[exerciseId], [setNumber]: { ...current, [field]: value } } }; });
    }, []);
    const handleCompleteSet = useCallback((exerciseId, setNumber, isCompleted) => {
        setWorkoutData(p => { const current = p[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber }; return { ...p, [exerciseId]: { ...p[exerciseId], [setNumber]: { ...current, completed: isCompleted } } }; });
    }, []);

    // --- MODIFICADO: handleRemoveSet con Undo ---
    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        let undoPayload = null;
        const exercisesBefore = [...sessionExercises];
        const workoutDataBefore = JSON.parse(JSON.stringify(workoutData));
        const targetExerciseIndex = exercisesBefore.findIndex(ex => (ex.id || ex.exerciseId) === exerciseId);
        if (targetExerciseIndex !== -1) {
            const setIndexToRemove = exercisesBefore[targetExerciseIndex].sets.findIndex(set => set.id === setIdToRemove);
            if (setIndexToRemove !== -1) {
                undoPayload = { exerciseId, setInfo: { ...exercisesBefore[targetExerciseIndex].sets[setIndexToRemove] }, exerciseIndex: targetExerciseIndex, setIndex: setIndexToRemove, workoutDataBefore: workoutDataBefore };
            }
        }
        if (!undoPayload) return;
        removeSetFromState(exerciseId, setIdToRemove);
        setWorkoutData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const exerciseSets = newData[exerciseId] || {};
            const setNumberKey = Object.keys(exerciseSets).find(key => exerciseSets[key]?.id === setIdToRemove);
            if (setNumberKey) delete exerciseSets[setNumberKey];
            if (Object.keys(exerciseSets).length === 0) delete newData[exerciseId]; else newData[exerciseId] = exerciseSets;
            return newData;
        });
        addUndoAction(UndoActionTypes.DELETE_SET, "Serie eliminada.", undoPayload);
    }, [sessionExercises, workoutData, removeSetFromState, setSessionExercises, setWorkoutData, addUndoAction]);

    // --- MODIFICADO: handleDeleteExercise y confirmDeleteExercise con Undo ---
    const handleDeleteExercise = useCallback((exerciseId) => {
        setExerciseIdToDelete(exerciseId);
        setIsDeleteExerciseConfirmationOpen(true);
    }, []);

    const confirmDeleteExercise = useCallback(() => {
        if (!exerciseIdToDelete) return;
        let undoPayload = null;
        const exercisesBefore = [...sessionExercises];
        const workoutDataBefore = JSON.parse(JSON.stringify(workoutData));
        const exerciseIndex = exercisesBefore.findIndex(ex => (ex.id || ex.exerciseId) === exerciseIdToDelete);
        if (exerciseIndex !== -1) {
            undoPayload = { exerciseInfo: { ...exercisesBefore[exerciseIndex] }, index: exerciseIndex, workoutDataBefore: workoutDataBefore };
        }
        if(!undoPayload) return;
        const deletedExerciseId = exerciseIdToDelete;
        deleteExerciseFromState(deletedExerciseId);
        setWorkoutData(prevData => { const d = {...prevData}; delete d[deletedExerciseId]; return d; });
        setIsDeleteExerciseConfirmationOpen(false);
        setExerciseIdToDelete(null);
        addUndoAction(UndoActionTypes.DELETE_EXERCISE, "Ejercicio eliminado.", undoPayload);
    }, [exerciseIdToDelete, sessionExercises, workoutData, deleteExerciseFromState, setSessionExercises, setWorkoutData, addUndoAction, setIsDeleteExerciseConfirmationOpen]);


    // Handler para guardar cambios (sin cambios)
    const handleSaveChanges = useCallback(async () => {
        setIsFinishConfirmationOpen(false);
        setIsSaving(true);
        try {
            // Asegúrate que updateWorkoutSession espera workoutData y sessionExercises
            await updateWorkoutSession(user.uid, sessionId, workoutData, sessionExercises);
            alert("¡Sesión actualizada!");
            navigate(`/historial/${sessionId}`);
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("Hubo un error al actualizar.");
        } finally {
            setIsSaving(false);
        }
    }, [user, sessionId, workoutData, sessionExercises, navigate, updateWorkoutSession]);

    // Loading combinado (sin cambios)
    const isLoading = sessionLoading || managerLoading;
    if (isLoading) return <ThemedLoader />;
    if (managerError) return <Card><p className="text-red-500">{managerError}</p></Card>;

    // --- RENDERIZADO (sin cambios visibles aquí) ---
    return (
        <div className="relative min-h-screen pb-16">
            {/* Modales */}
            <AddExerciseToRoutineModal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} user={user} onExerciseAdded={handleAddOrReplaceExercise} />
            <ConfirmationModal isOpen={isFinishConfirmationOpen} onClose={() => setIsFinishConfirmationOpen(false)} title="¿Guardar cambios?" message="¿Deseas guardar los cambios realizados en esta sesión?" onConfirm={handleSaveChanges} />
            <ConfirmationModal isOpen={isDeleteExerciseConfirmationOpen} onClose={() => setIsDeleteExerciseConfirmationOpen(false)} title="Eliminar Ejercicio" message="¿Estás seguro de que quieres eliminar este ejercicio de la sesión?" onConfirm={confirmDeleteExercise} />
            <Card>
                {/* Encabezado */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Link to={`/historial/${sessionId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 mb-2"><XCircle size={16}/> Cancelar Edición</Link>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Sesión</h2>
                    </div>
                    <button onClick={() => setIsFinishConfirmationOpen(true)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow bg-green-600 hover:bg-green-500 disabled:bg-opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <Loader className="animate-spin" size={20} /> : "Guardar Cambios"}
                    </button>
                </div>
                {/* Lista de Ejercicios */}
                <div className="space-y-6">
                    {sessionExercises.length > 0 ? sessionExercises.map((ex) => (
                         <ExerciseCard key={ex.id || ex.exerciseId} exercise={ex} preferences={preferences} workoutData={workoutData} onSetChange={handleSetChange} onCompleteSet={handleCompleteSet} onAddSet={handleAddSet} onRemoveSet={handleRemoveSet} onDeleteExercise={handleDeleteExercise} onReplaceExercise={openReplaceModal} />
                    )) : <p className="text-center text-gray-500 py-8">No se encontraron ejercicios en esta sesión.</p>}
                </div>
                 {/* Botón Añadir Ejercicio */}
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"><button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline"><PlusCircle size={18} /> Agregar Ejercicio a la Sesión</button></div>
            </Card>
            {/* El UndoNotification se renderiza globalmente */}
        </div>
    );
}