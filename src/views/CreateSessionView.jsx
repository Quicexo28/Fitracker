// src/views/CreateSessionView.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useSessionManager from '../hooks/useSessionManager.jsx';
import useLastPerformance from '../hooks/useLastPerformance.jsx';
import usePersonalRecords from '../hooks/usePersonalRecords.jsx';
import { saveWorkoutSession } from '../firebase/sessionService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import RestTimer from '../components/RestTimer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { ArrowLeft, Loader, PlusCircle, Trash2, MoreVertical, RefreshCw, CheckCircle, Square, XCircle, MessageSquare, Award, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { UndoActionTypes } from '../hooks/useUndoManager.jsx'; // <-- Importar tipos de acción

// --- Componente SetRow (No changes needed from previous correct version) ---
const SetRow = React.memo(({
    setNumber, setData, exerciseId, setId, onSetChange, onCompleteSet,
    lastPerformanceSet, targetReps, preferences, onRemoveSet, onCopyLastPerformance
}) => {
    const [isCompleted, setIsCompleted] = useState(setData.completed || false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);

    useEffect(() => { setIsCompleted(setData.completed || false); }, [setData.completed]);

    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];

    const handleChange = (field, value) => onSetChange(exerciseId, setNumber, field, value);
    const toggleComplete = () => onCompleteSet(exerciseId, setNumber, !isCompleted);
    const toggleNoteInput = () => setIsNoteOpen(prev => !prev);

    const currentRepsValue = setData.reps !== undefined ? String(setData.reps) : '';
    const placeholderReps = targetReps !== undefined && targetReps !== '' ? String(targetReps)
                         : (lastPerformanceSet?.reps !== undefined ? String(lastPerformanceSet.reps) : '-');
    const placeholderIsRange = useMemo(() => /\d+-\d+/.test(placeholderReps), [placeholderReps]);
    const isShowingPlaceholderRange = currentRepsValue === '' && placeholderIsRange;

    const repsInputClass = `w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center ${
        isShowingPlaceholderRange ? 'text-gray-400 dark:text-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                                  : 'text-gray-900 dark:text-white'
    }`;

    return (
        <div className={`p-2 rounded-lg ${setData.completed ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
            <div className={`grid grid-cols-[auto,auto,1fr,1fr,1fr,auto,auto,auto] items-center gap-2`}>
                <div className="w-6 h-6 flex items-center justify-center">
                    {setData.isPR && <Award size={18} className="text-yellow-500" title="¡Nuevo PR!" />}
                </div>
                <span className="font-bold text-center pr-2">{setNumber}</span>
                <input type="number" step="any" value={setData.weight || ''} placeholder={lastPerformanceSet?.weight ?? '-'} onChange={(e) => handleChange('weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-gray-900 dark:text-white" />
                <input type="text" value={currentRepsValue} placeholder={placeholderReps} onChange={(e) => handleChange('reps', e.target.value)} className={repsInputClass} inputMode="numeric" />
                <select value={setData.effort || ''} onChange={(e) => handleChange('effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-gray-900 dark:text-white">
                    <option value="">{preferences?.effortMetric?.toUpperCase() || 'RIR/RPE'}</option>
                    {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button onClick={() => onCopyLastPerformance(exerciseId, setNumber, lastPerformanceSet)} className="flex justify-center p-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" title="Copiar datos de la última sesión" disabled={!lastPerformanceSet || (lastPerformanceSet.weight === undefined && lastPerformanceSet.reps === undefined)}>
                     <History size={16} />
                </button>
                <button onClick={toggleNoteInput} className="flex justify-center p-1 text-gray-500 hover:text-blue-500 relative">
                     <MessageSquare size={16} />
                     {setData.note && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-700"></span>}
                </button>
                <div className="flex items-center justify-center gap-1">
                    <button onClick={toggleComplete} className="p-1">{setData.completed ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>}</button>
                    {/* Ensure setId is passed correctly */}
                    <button onClick={() => onRemoveSet(exerciseId, setData.id || setId)} className="p-1 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
            </div>
            {isNoteOpen && (
                <div className="mt-2 pl-[calc(theme(space.6)+theme(space.2)+theme(space.8))]"> {/* Adjust left padding if needed */}
                    <input type="text" value={setData.note || ''} onChange={(e) => handleChange('note', e.target.value)} placeholder="Añadir nota..." className="w-full p-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white" autoFocus />
                </div>
            )}
        </div>
    );
});


// --- Componente ExerciseCard (No changes needed from previous correct version) ---
const ExerciseCard = React.memo(({ exercise, exerciseWorkoutData, preferences, onSetChange, onCompleteSet, onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise, lastPerformanceSets, onCopyLastPerformance }) => {
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
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{exercise.exerciseName}</h3>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><MoreVertical size={20} /></button>
                    {isMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                <button onClick={() => { onReplaceExercise(exercise.exerciseId); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={16}/> Reemplazar</button>
                                <button onClick={() => { onDeleteExercise(exercise.exerciseId); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"><Trash2 size={16}/> Eliminar</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-[auto,auto,1fr,1fr,1fr,auto,auto,auto] gap-2 text-xs font-semibold text-center mb-2 px-1 text-gray-500 dark:text-gray-400">
                <span></span><span>#</span><span>Peso ({preferences?.weightUnit?.toUpperCase() || 'KG'})</span><span>Reps</span><span className="uppercase">{preferences?.effortMetric || 'RIR'}</span><span></span><span>Nota</span><span></span>
            </div>
            <div className="space-y-2">
                {exercise.sets.map((setInfo, index) => {
                    const currentSetData = exerciseWorkoutData?.[setInfo.setNumber] || { id: setInfo.id, setNumber: setInfo.setNumber };
                    return ( <SetRow key={setInfo.id} setId={setInfo.id} setNumber={setInfo.setNumber} setData={currentSetData} exerciseId={exercise.exerciseId} onSetChange={onSetChange} onCompleteSet={onCompleteSet} lastPerformanceSet={lastPerformanceSets[index]} targetReps={setInfo.reps} preferences={preferences} onRemoveSet={onRemoveSet} onCopyLastPerformance={onCopyLastPerformance} /> );
                })}
            </div>
            <div className="mt-4"> <button onClick={() => onAddSet(exercise.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"> <PlusCircle size={16} /> Agregar Serie </button> </div>
        </div>
    );
});


// --- Main View Component ---
export default function CreateSessionView({ user, addUndoAction }) {
    const { routineId } = useParams();
    const navigate = useNavigate();
    const { preferences } = usePreferences();
    const [workoutData, setWorkoutData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFinishConfirmationOpen, setIsFinishConfirmationOpen] = useState(false);
    const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false);
    const [isDeleteExerciseConfirmationOpen, setIsDeleteExerciseConfirmationOpen] = useState(false);
    const [exerciseIdToDelete, setExerciseIdToDelete] = useState(null);

    const routinePath = useMemo(() => user ? `users/${user.uid}/routines/${routineId}` : null, [user, routineId]);
    const { document: routineDoc, loading: routineLoading } = useFirestoreDocument(routinePath);
    const { getLastPerformance, isLoading: isLastPerformanceLoading } = useLastPerformance();
    const { checkIsPR, trackNewPR, resetSessionPRs, isLoading: isPRLoading } = usePersonalRecords();

    const {
        sessionExercises, setSessionExercises, loading: managerLoading, error: managerError,
        isAddExerciseModalOpen, setIsAddExerciseModalOpen,
        handleAddSet: addSetToSessionExercises,
        handleRemoveSet: removeSetFromSessionExercises,
        handleDeleteExercise: deleteExerciseFromSessionExercises,
        handleAddOrReplaceExercise, openReplaceModal, openAddModal
    } = useSessionManager(routineId);

    // useEffect for initializing workoutData (remains the same)
     useEffect(() => {
        if (!managerLoading && sessionExercises.length > 0) {
            setWorkoutData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData || {}));
                let needsUpdate = false;
                sessionExercises.forEach(ex => {
                    if (!newData[ex.exerciseId]) { newData[ex.exerciseId] = {}; needsUpdate = true; }
                    ex.sets.forEach(set => {
                        const currentSetId = set.id || uuidv4();
                        if (!newData[ex.exerciseId][set.setNumber] || newData[ex.exerciseId][set.setNumber].id !== currentSetId) {
                            newData[ex.exerciseId][set.setNumber] = {
                                id: currentSetId, setNumber: set.setNumber, weight: '', reps: '',
                                effort: '', completed: false, note: '', isPR: false
                            };
                            needsUpdate = true;
                        }
                        if (newData[ex.exerciseId][set.setNumber].reps === undefined || newData[ex.exerciseId][set.setNumber].reps === null) {
                            newData[ex.exerciseId][set.setNumber].reps = '';
                            needsUpdate = true;
                        }
                    });
                    Object.keys(newData[ex.exerciseId] || {}).forEach(setNumStr => {
                        const setNum = parseInt(setNumStr, 10);
                        if (!ex.sets.some(s => s.setNumber === setNum)) {
                            delete newData[ex.exerciseId][setNumStr];
                            needsUpdate = true;
                        }
                    });
                });
                Object.keys(newData).forEach(exId => {
                    if (!sessionExercises.some(ex => ex.exerciseId === exId)) {
                        delete newData[exId];
                        needsUpdate = true;
                    }
                });
                return needsUpdate ? newData : prevData;
            });
            if (typeof resetSessionPRs === 'function') { resetSessionPRs(); }
        }
    }, [sessionExercises, managerLoading, resetSessionPRs]);

    // handleSetChange, handleCompleteSet, handleCopyLastPerformance, handleAddSet (remain the same)
    const handleSetChange = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(prevData => {
            const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
            const newData = { ...prevData, [exerciseId]: { ...prevData[exerciseId], [setNumber]: { ...currentSetData, [field]: value } } };
            if ((field === 'weight' || field === 'reps')) {
                 const updatedSetData = newData[exerciseId][setNumber];
                 const weight = parseFloat(updatedSetData.weight);
                 const repsValue = String(updatedSetData.reps);
                 const repsMatch = repsValue.match(/^\d+/);
                 const reps = repsMatch ? parseInt(repsMatch[0], 10) : NaN;

                 const isNewPR = !isNaN(reps) && typeof checkIsPR === 'function' ? checkIsPR(exerciseId, reps, weight) : false;
                 newData[exerciseId][setNumber].isPR = isNewPR;
                 if (isNewPR && typeof trackNewPR === 'function') trackNewPR(exerciseId, reps, weight);
            }
            return newData;
        });
    }, [checkIsPR, trackNewPR]);

    const handleCompleteSet = useCallback((exerciseId, setNumber, isCompleted) => {
        setWorkoutData(prevData => { const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber }; return { ...prevData, [exerciseId]: { ...prevData[exerciseId], [setNumber]: { ...currentSetData, completed: isCompleted } } }; });
    }, []);

    const handleCopyLastPerformance = useCallback((exerciseId, setNumber, lastPerfSet) => {
         if (!lastPerfSet) return;
         setWorkoutData(prevData => {
             const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
             const updatedSet = {
                ...currentSetData,
                weight: lastPerfSet.weight !== undefined ? String(lastPerfSet.weight) : '',
                reps: lastPerfSet.reps !== undefined ? String(lastPerfSet.reps) : '',
                completed: false, effort: '', note: '', isPR: false
            };
             const weight = parseFloat(updatedSet.weight);
             const repsValue = String(updatedSet.reps);
             const repsMatch = repsValue.match(/^\d+/);
             const reps = repsMatch ? parseInt(repsMatch[0], 10) : NaN;
             const isNewPR = !isNaN(reps) && typeof checkIsPR === 'function' ? checkIsPR(exerciseId, reps, weight) : false;
             updatedSet.isPR = isNewPR;
             if (isNewPR && typeof trackNewPR === 'function') { trackNewPR(exerciseId, reps, weight); }
             return { ...prevData, [exerciseId]: { ...prevData[exerciseId], [setNumber]: updatedSet } };
         });
     }, [checkIsPR, trackNewPR]);

     const handleAddSet = useCallback((exerciseId) => { addSetToSessionExercises(exerciseId); }, [addSetToSessionExercises]);


    // --- REFINED handleRemoveSet with Undo ---
    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        const exercisesBeforeCapture = JSON.parse(JSON.stringify(sessionExercises));
        const workoutDataBeforeCapture = JSON.parse(JSON.stringify(workoutData));
        let basePayload = null;
        const targetExerciseIndex = exercisesBeforeCapture.findIndex(ex => ex.exerciseId === exerciseId);

        if (targetExerciseIndex !== -1) {
            const setIndexToRemove = exercisesBeforeCapture[targetExerciseIndex].sets.findIndex(set => set.id === setIdToRemove);
            if (setIndexToRemove !== -1) {
                basePayload = { exerciseId, setInfo: { ...exercisesBeforeCapture[targetExerciseIndex].sets[setIndexToRemove] }, exerciseIndex: targetExerciseIndex, setIndex: setIndexToRemove, workoutDataBefore: workoutDataBeforeCapture };
            }
        }
        if (!basePayload) { console.warn("Could not create undo payload for set removal."); return; }
        removeSetFromSessionExercises(exerciseId, setIdToRemove);
        setWorkoutData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            if (newData[exerciseId]) {
                const setNumberKey = Object.keys(newData[exerciseId]).find(key => newData[exerciseId][key]?.id === setIdToRemove);
                if (setNumberKey) {
                    delete newData[exerciseId][setNumberKey];
                    if (Object.keys(newData[exerciseId]).length === 0) delete newData[exerciseId];
                } else { console.warn(`Set ID ${setIdToRemove} not found in workoutData for exercise ${exerciseId} during removal update.`); }
            }
            return newData;
        });
        addUndoAction(UndoActionTypes.DELETE_SET, "Serie eliminada.", { ...basePayload, setSessionExercises, setWorkoutData });
    }, [sessionExercises, workoutData, removeSetFromSessionExercises, setSessionExercises, setWorkoutData, addUndoAction]);


    // --- REFINED handleDeleteExercise and confirmDeleteExercise with Undo ---
    // Opens the confirmation modal
    const handleDeleteExercise = useCallback((exerciseId) => {
        setExerciseIdToDelete(exerciseId);
        setIsDeleteExerciseConfirmationOpen(true);
    }, []); // No dependencies needed here

    // Actually performs deletion after confirmation
    const confirmDeleteExercise = useCallback(() => {
        if (!exerciseIdToDelete) return;
        const exercisesBeforeCapture = JSON.parse(JSON.stringify(sessionExercises));
        const workoutDataBeforeCapture = JSON.parse(JSON.stringify(workoutData));
        let basePayload = null;
        const exerciseIndex = exercisesBeforeCapture.findIndex(ex => ex.exerciseId === exerciseIdToDelete);

        if (exerciseIndex !== -1) {
            basePayload = { exerciseInfo: { ...exercisesBeforeCapture[exerciseIndex] }, index: exerciseIndex, workoutDataBefore: workoutDataBeforeCapture };
        }
        if (!basePayload) { /* ... handle error, close modal, return ... */ console.warn("Could not create undo payload for exercise deletion."); setIsDeleteExerciseConfirmationOpen(false); setExerciseIdToDelete(null); return; }

        const deletedExerciseId = exerciseIdToDelete;
        deleteExerciseFromSessionExercises(deletedExerciseId);
        setWorkoutData(prevData => { const newData = { ...prevData }; delete newData[deletedExerciseId]; return newData; });
        setIsDeleteExerciseConfirmationOpen(false);
        setExerciseIdToDelete(null);
        addUndoAction(UndoActionTypes.DELETE_EXERCISE, "Ejercicio eliminado.", { ...basePayload, setSessionExercises, setWorkoutData });
    }, [exerciseIdToDelete, sessionExercises, workoutData, deleteExerciseFromSessionExercises, setSessionExercises, setWorkoutData, addUndoAction, setIsDeleteExerciseConfirmationOpen]);


    // handleFinishWorkout, handleCancelWorkout (remain the same)
    const handleFinishWorkout = useCallback(async () => {
        if (!user) { alert("Error: Usuario no autenticado."); return; }
        setIsFinishConfirmationOpen(false); setIsSaving(true);
        try {
            const prSetsToSave = new Set();
            Object.entries(workoutData).forEach(([exId, sets]) => Object.entries(sets).forEach(([sNum, sData]) => { if (sData?.isPR) prSetsToSave.add(`${exId}-${sNum}`); }));
            const savedRef = await saveWorkoutSession(user.uid, routineId, workoutData, sessionExercises, prSetsToSave);
            if (savedRef?.id) navigate(`/historial/${savedRef.id}`);
            else throw new Error("No se pudo obtener el ID de la sesión guardada.");
        } catch (error) { console.error("Error al guardar:", error); alert(`Error: ${error.message}`); setIsSaving(false); }
    }, [user, routineId, workoutData, sessionExercises, navigate, saveWorkoutSession]);
    const handleCancelWorkout = () => { setIsCancelConfirmationOpen(false); navigate('/rutinas'); };

    // Loading/Error checks (remain the same)
    const isLoading = routineLoading || managerLoading || isLastPerformanceLoading || isPRLoading;
    const hasError = managerError;
    if (!user && !isLoading) { return <ThemedLoader />; }
    if (isLoading) return <ThemedLoader />;
    if (hasError) return <Card><p className="text-red-500">{hasError.message || String(hasError)}</p></Card>;


    // --- RENDERIZADO ---
    return (
        <div className="relative min-h-screen pb-20">
            {/* Modals */}
             <AddExerciseToRoutineModal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} user={user} onExerciseAdded={handleAddOrReplaceExercise} routineId={routineId}/>
             <ConfirmationModal isOpen={isFinishConfirmationOpen} onClose={() => setIsFinishConfirmationOpen(false)} title="Finalizar Entrenamiento" message="¿Estás seguro de que quieres finalizar y guardar esta sesión?" onConfirm={handleFinishWorkout} confirmText="Sí, Finalizar" />
             <ConfirmationModal isOpen={isCancelConfirmationOpen} onClose={() => setIsCancelConfirmationOpen(false)} title="Cancelar Entrenamiento" message="¿Estás seguro de que quieres cancelar? El progreso no guardado se perderá." onConfirm={handleCancelWorkout} confirmText="Sí, Cancelar" cancelText="No, Continuar" />
             {/* Assign confirmDeleteExercise to onConfirm here */}
             <ConfirmationModal isOpen={isDeleteExerciseConfirmationOpen} onClose={() => setIsDeleteExerciseConfirmationOpen(false)} title="Eliminar Ejercicio" message="¿Estás seguro de que quieres eliminar este ejercicio de la sesión actual?" onConfirm={confirmDeleteExercise} confirmText="Sí, Eliminar"/>
            <Card>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                         <button onClick={() => setIsCancelConfirmationOpen(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 mb-2"> <XCircle size={16}/> Cancelar Sesión </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{routineDoc?.name || 'Entrenamiento'}</h2>
                    </div>
                    <button onClick={() => setIsFinishConfirmationOpen(true)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow bg-green-600 hover:bg-green-500 disabled:bg-opacity-50 disabled:cursor-not-allowed" > {isSaving ? <Loader className="animate-spin" size={20} /> : "Finalizar"} </button>
                </div>
                {/* Rest Timer */}
                <RestTimer />
                {/* Exercise List */}
                <div className="space-y-6">
                     {sessionExercises.length > 0 ? (
                        sessionExercises.map((ex) => {
                            const lastPerfSets = typeof getLastPerformance === 'function' ? getLastPerformance(ex.exerciseId) : [];
                            return (
                                <ExerciseCard
                                    key={ex.exerciseId}
                                    exercise={ex}
                                    exerciseWorkoutData={workoutData[ex.exerciseId] || {}}
                                    preferences={preferences}
                                    onSetChange={handleSetChange}
                                    onCompleteSet={handleCompleteSet}
                                    onAddSet={handleAddSet}
                                    onRemoveSet={handleRemoveSet}
                                    // *** Pass handleDeleteExercise (the one opening the modal) ***
                                    onDeleteExercise={handleDeleteExercise}
                                    onReplaceExercise={openReplaceModal}
                                    lastPerformanceSets={lastPerfSets}
                                    onCopyLastPerformance={handleCopyLastPerformance}
                                />
                             );
                        })
                    ) : ( <p className="text-center text-gray-500 py-8">Cargando ejercicios o la rutina está vacía...</p> )}
                </div>
                {/* Add Exercise Button */}
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"> <button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline" > <PlusCircle size={18} /> Agregar Ejercicio a la Sesión </button> </div>
            </Card>
            {/* Undo Toast handled globally */}
        </div>
    );
}