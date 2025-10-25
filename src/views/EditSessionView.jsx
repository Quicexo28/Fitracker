import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth
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

// --- Componente SetRow (Simplified for brevity, ensure your full component is here) ---
const SetRow = React.memo(({ setInfo, exerciseId, onSetChange, onCompleteSet, initialData, preferences, onRemoveSet }) => {
    // ... (Your full SetRow implementation) ...
    const [isCompleted, setIsCompleted] = useState(initialData?.completed || false);
    useEffect(() => { setIsCompleted(initialData?.completed || false); }, [initialData?.completed]);
    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
    const toggleComplete = () => { /* ... */ };
    const handleChange = (field, value) => onSetChange(exerciseId, setInfo.setNumber, field, value);

    return (
         <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
             <div className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] items-center gap-2`}>
                <span className="font-bold text-center pr-2">{setInfo.setNumber}</span>
                <input type="number" step="any" name="weight" defaultValue={initialData?.weight || ''} onChange={(e) => handleChange('weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <input type="number" name="reps" defaultValue={initialData?.reps || ''} onChange={(e) => handleChange('reps', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <select name="effort" defaultValue={initialData?.effort || ''} onChange={(e) => handleChange('effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center">
                    <option value="">{preferences?.effortMetric?.toUpperCase() || '...'}</option>
                    {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button onClick={toggleComplete} className="flex justify-center p-1">{isCompleted ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>}</button>
                <button onClick={() => onRemoveSet(exerciseId, setInfo.id || initialData?.id)} className="flex justify-center p-1 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
             {/* Optional Note Input */}
             {/* <input type="text" name="note" defaultValue={initialData?.note || ''} onChange={(e) => handleChange('note', e.target.value)} placeholder="Nota..." className="mt-1 w-full p-1 text-xs ..." /> */}
        </div>
    );
});


// --- Componente ExerciseCard (Simplified for brevity) ---
const ExerciseCard = React.memo(({ exercise, preferences, workoutData, onSetChange, onCompleteSet, onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise }) => {
    // ... (Your full ExerciseCard implementation) ...
     const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { /* ... click outside handler ... */ }, []);
    const sets = Array.isArray(exercise?.sets) ? exercise.sets : [];


    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{exercise?.exerciseName || 'Ejercicio'}</h3>
                {/* ... (Menu button and dropdown) ... */}
            </div>
             <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto] gap-2 text-sm font-semibold text-center mb-2">
                {/* ... (Column headers) ... */}
            </div>
            <div className="space-y-2">
                {sets.map((setInfo) => {
                    const initialDataForSet = workoutData[exercise?.exerciseId]?.[setInfo.setNumber] || {};
                    const setId = setInfo.id || initialDataForSet.id || uuidv4(); // Ensure a key
                    return (<SetRow key={setId} setInfo={{...setInfo, id: setId}} exerciseId={exercise?.exerciseId} onSetChange={onSetChange} onCompleteSet={onCompleteSet} initialData={initialDataForSet} preferences={preferences} onRemoveSet={onRemoveSet}/>);
                })}
            </div>
            <div className="mt-4"><button onClick={() => onAddSet(exercise?.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"><PlusCircle size={16} /> Agregar Serie</button></div>
        </div>
    );
});


// --- Main View Component ---
export default function EditSessionView({ user, addUndoAction }) {
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
        handleAddSet: addSetToSessionExercises,
        handleRemoveSet: removeSetFromSessionExercises,
        handleDeleteExercise: deleteExerciseFromSessionExercises,
        handleAddOrReplaceExercise, openReplaceModal, openAddModal
    } = useSessionManager(null, existingSession, true);

    // useEffect to populate workoutData from existingSession
    useEffect(() => {
        if (existingSession?.exercises && sessionExercises.length > 0) {
            const initialData = {};
            existingSession.exercises.forEach(ex => {
                const sessionEx = sessionExercises.find(se => se.exerciseId === ex.exerciseId);
                if (!sessionEx) return;

                initialData[ex.exerciseId] = {};
                ex.sets.forEach(set => {
                    const sessionSet = sessionEx.sets.find(ss => ss.setNumber === set.set);
                    const setId = sessionSet?.id || uuidv4(); // Ensure ID exists

                    initialData[ex.exerciseId][set.set] = {
                        id: setId,
                        setNumber: set.set,
                        weight: set.weight !== undefined ? String(set.weight) : '',
                        reps: set.reps !== undefined ? String(set.reps) : '',
                        effort: set.effort || '',
                        completed: set.completed === true, // Ensure boolean
                        completedLeft: set.completedLeft === true,
                        completedRight: set.completedRight === true,
                        note: set.note || '',
                        isPR: set.isPR === true // Ensure boolean
                     };
                });
            });
            setWorkoutData(initialData);
        }
        // If existingSession is loaded but sessionExercises isn't yet, workoutData remains {}
        // If existingSession becomes null/undefined after being loaded, clear workoutData?
        else if (!existingSession?.exercises && !sessionLoading) {
             setWorkoutData({}); // Clear if session data disappears
        }
    }, [existingSession, sessionExercises, sessionLoading]); // Added sessionLoading


    // handleSetChange, handleCompleteSet, handleAddSet (remain the same)
    const handleSetChange = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(p => {
            const currentSet = p[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
            return { ...p, [exerciseId]: { ...p[exerciseId], [setNumber]: { ...currentSet, [field]: value } } };
        });
    }, []);

    const handleCompleteSet = useCallback((exerciseId, setNumber, isCompleted) => {
        setWorkoutData(p => {
             const currentSet = p[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
             const exerciseDetails = sessionExercises.find(ex => ex.exerciseId === exerciseId);
             let update = {};
             if (exerciseDetails?.isUnilateral) {
                  // Simplistic: assume clicking complete toggles both sides if unilateral
                 update = { completed: isCompleted, completedLeft: isCompleted, completedRight: isCompleted };
             } else {
                 update = { completed: isCompleted, completedLeft: isCompleted }; // Assume left for bilateral
             }
             return { ...p, [exerciseId]: { ...p[exerciseId], [setNumber]: { ...currentSet, ...update } } };
        });
     }, [sessionExercises]);

     const handleAddSet = useCallback((exerciseId) => { addSetToSessionExercises(exerciseId); }, [addSetToSessionExercises]);


    // --- REFINED handleRemoveSet with Undo ---
    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        // CAPTURE STATE IMMEDIATELY
        const exercisesBeforeCapture = JSON.parse(JSON.stringify(sessionExercises));
        const workoutDataBeforeCapture = JSON.parse(JSON.stringify(workoutData));

        let basePayload = null;
        const targetExerciseIndex = exercisesBeforeCapture.findIndex(ex => ex.exerciseId === exerciseId);

        if (targetExerciseIndex !== -1) {
            const setIndexToRemove = exercisesBeforeCapture[targetExerciseIndex].sets.findIndex(set => set.id === setIdToRemove);
            if (setIndexToRemove !== -1) {
                basePayload = {
                    exerciseId,
                    setInfo: { ...exercisesBeforeCapture[targetExerciseIndex].sets[setIndexToRemove] },
                    exerciseIndex: targetExerciseIndex,
                    setIndex: setIndexToRemove,
                    workoutDataBefore: workoutDataBeforeCapture
                };
            } else {
                 console.warn(`Set ID ${setIdToRemove} not found in sessionExercises capture.`);
            }
        } else {
            console.warn(`Exercise ID ${exerciseId} not found in sessionExercises capture.`);
        }

        if (!basePayload) { /* ... handle error, return ... */ }

        removeSetFromSessionExercises(exerciseId, setIdToRemove); // Update sessionExercises state

        setWorkoutData(prevData => { // Update workoutData state
            const newData = JSON.parse(JSON.stringify(prevData));
            if (newData[exerciseId]) {
                const setNumberKey = Object.keys(newData[exerciseId]).find(key => newData[exerciseId][key]?.id === setIdToRemove);
                if (setNumberKey) {
                    delete newData[exerciseId][setNumberKey];
                    if (Object.keys(newData[exerciseId]).length === 0) delete newData[exerciseId];
                } else {
                     console.warn(`Set ID ${setIdToRemove} not found in workoutData during update.`);
                }
            }
            return newData;
        });

        addUndoAction(UndoActionTypes.DELETE_SET, "Serie eliminada.", {
            ...basePayload, setSessionExercises, setWorkoutData
        });

    }, [sessionExercises, workoutData, removeSetFromSessionExercises, setSessionExercises, setWorkoutData, addUndoAction]);


    // --- REFINED confirmDeleteExercise with Undo ---
    const confirmDeleteExercise = useCallback(() => {
        if (!exerciseIdToDelete) return;

        const exercisesBeforeCapture = JSON.parse(JSON.stringify(sessionExercises));
        const workoutDataBeforeCapture = JSON.parse(JSON.stringify(workoutData));
        let basePayload = null;
        const exerciseIndex = exercisesBeforeCapture.findIndex(ex => ex.exerciseId === exerciseIdToDelete);

        if (exerciseIndex !== -1) { /* ... create basePayload ... */
             basePayload = {
                exerciseInfo: { ...exercisesBeforeCapture[exerciseIndex] },
                index: exerciseIndex,
                workoutDataBefore: workoutDataBeforeCapture
            };
        }

        if (!basePayload) { /* ... handle error, return ... */ }

        const deletedExerciseId = exerciseIdToDelete;
        deleteExerciseFromSessionExercises(deletedExerciseId); // Update sessionExercises state

        setWorkoutData(prevData => { // Update workoutData state
            const newData = { ...prevData };
            delete newData[deletedExerciseId];
            return newData;
        });

        setIsDeleteExerciseConfirmationOpen(false);
        setExerciseIdToDelete(null);

        addUndoAction(UndoActionTypes.DELETE_EXERCISE, "Ejercicio eliminado.", {
            ...basePayload, setSessionExercises, setWorkoutData
        });

    }, [exerciseIdToDelete, sessionExercises, workoutData, deleteExerciseFromSessionExercises, setSessionExercises, setWorkoutData, addUndoAction, setIsDeleteExerciseConfirmationOpen]);


    // handleSaveChanges (remains the same)
    const handleSaveChanges = useCallback(async () => {
        if (!user || !sessionId) { /* ... error handling ... */ return; }
        setIsFinishConfirmationOpen(false);
        setIsSaving(true);
        try {
            await updateWorkoutSession(user.uid, sessionId, workoutData, sessionExercises);
            navigate(`/historial/${sessionId}`);
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("Hubo un error al actualizar.");
            setIsSaving(false);
        }
    }, [user, sessionId, workoutData, sessionExercises, navigate, updateWorkoutSession]);


    // Loading/Error checks (remain the same)
    const isLoading = sessionLoading || managerLoading;
    if (!user && !isLoading) return <ThemedLoader />;
    if (isLoading) return <ThemedLoader />;
    if (managerError) return <Card><p className="text-red-500">{managerError.message || String(managerError)}</p></Card>;


    // --- RENDERIZADO (remains the same) ---
    return (
        // ... (JSX structure remains the same) ...
        <div className="relative min-h-screen pb-16">
            {/* Modals */}
            <AddExerciseToRoutineModal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} user={user} onExerciseAdded={handleAddOrReplaceExercise} />
            <ConfirmationModal isOpen={isFinishConfirmationOpen} onClose={() => setIsFinishConfirmationOpen(false)} title="¿Guardar cambios?" message="¿Deseas guardar los cambios realizados en esta sesión?" onConfirm={handleSaveChanges} confirmText="Sí, Guardar" />
            <ConfirmationModal isOpen={isDeleteExerciseConfirmationOpen} onClose={() => setIsDeleteExerciseConfirmationOpen(false)} title="Eliminar Ejercicio" message="¿Estás seguro de que quieres eliminar este ejercicio de la sesión?" onConfirm={confirmDeleteExercise} confirmText="Sí, Eliminar" />
            <Card>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Link to={`/historial/${sessionId}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 mb-2"><XCircle size={16}/> Cancelar Edición</Link>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Sesión</h2>
                    </div>
                    <button onClick={() => setIsFinishConfirmationOpen(true)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow bg-green-600 hover:bg-green-500 disabled:bg-opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <Loader className="animate-spin" size={20} /> : "Guardar Cambios"}
                    </button>
                </div>
                {/* Exercise List */}
                <div className="space-y-6">
                    {sessionExercises.length > 0 ? sessionExercises.map((ex) => (
                         <ExerciseCard
                            key={ex.exerciseId}
                            exercise={ex}
                            preferences={preferences}
                            workoutData={workoutData} // Pass the whole workoutData
                            onSetChange={handleSetChange}
                            onCompleteSet={handleCompleteSet}
                            onAddSet={addSetToSessionExercises} // Use alias directly
                            onRemoveSet={handleRemoveSet} // Use refined handler
                            onDeleteExercise={handleDeleteExercise} // Use refined handler
                            onReplaceExercise={openReplaceModal}
                         />
                    )) : <p className="text-center text-gray-500 py-8">No se encontraron ejercicios en esta sesión.</p>}
                </div>
                 {/* Add Exercise Button */}
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"><button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline"><PlusCircle size={18} /> Agregar Ejercicio a la Sesión</button></div>
            </Card>
            {/* Undo Toast is handled globally */}
        </div>
    );
}