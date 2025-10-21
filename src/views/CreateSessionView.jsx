import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useActiveSession } from '../context/ActiveSessionContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useSessionManager from '../hooks/useSessionManager.jsx';
import { saveWorkoutSession } from '../firebase/sessionService.js';
import { checkAndGrantAchievements } from '../firebase/achievementsService.js';
import usePersonalRecords from '../hooks/usePersonalRecords.jsx';
import useLastPerformance from '../hooks/useLastPerformance.jsx';
import UndoBar from '../components/UndoBar.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import GenericModal from '../components/GenericModal.jsx';
import AddExerciseModal from '../components/AddExerciseModal.jsx';
import ReplacementExerciseList from '../components/ReplacementExerciseList.jsx';
import RestTimer from '../components/RestTimer.jsx';
import { XCircle, Clock, CheckCircle, PlusCircle, Trash2, MoreVertical, RefreshCw, Loader, MessageSquarePlus, Link as LinkIcon, Award, History } from 'lucide-react';

const SetRow = ({ setInfo, exerciseId, isUnilateral, onSetChange, onCompleteSet, initialData, placeholderData, preferences, onRemoveSet, isPR }) => {
    const [leftCompleted, setLeftCompleted] = useState(initialData.completedLeft || false);
    const [rightCompleted, setRightCompleted] = useState(initialData.completedRight || false);
    const [showNote, setShowNote] = useState(!!initialData.note);
    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];

    useEffect(() => {
        setLeftCompleted(initialData.completedLeft || false);
        setRightCompleted(initialData.completedRight || false);
    }, [initialData]);

    const toggleComplete = (side) => {
        if (side === 'left') {
            const newStatus = !leftCompleted;
            setLeftCompleted(newStatus);
            onCompleteSet(exerciseId, setInfo.setNumber, 'left', newStatus);
        } else if (side === 'right') {
            const newStatus = !rightCompleted;
            setRightCompleted(newStatus);
            onCompleteSet(exerciseId, setInfo.setNumber, 'right', newStatus);
        } else {
            const newStatus = !leftCompleted;
            setLeftCompleted(newStatus);
            onCompleteSet(exerciseId, setInfo.setNumber, 'left', newStatus);
        }
    };
    
    const isFullyCompleted = isUnilateral ? (leftCompleted && rightCompleted) : leftCompleted;

    return (
        <div className={`p-3 rounded-lg ${isFullyCompleted ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-50 dark:bg-gray-900/30'}`}>
            <div className="flex flex-col gap-3 md:hidden">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">Serie {setInfo.setNumber}</span>
                    <div className="flex items-center gap-2">
                        {isPR && <Award className="text-yellow-500 animate-pulse" size={20} />}
                        <button onClick={() => setShowNote(!showNote)} className="p-1">
                            <MessageSquarePlus className={initialData.note ? "text-blue-500" : "text-gray-400"} size={20}/>
                        </button>
                        <button onClick={() => onRemoveSet(exerciseId, setInfo.id)} className="p-1 text-red-500">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Peso ({preferences?.weightUnit})</label>
                        <input type="number" name="weight" defaultValue={initialData.weight} placeholder={placeholderData?.weight || '0'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-lg" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Reps</label>
                        <input type="number" name="reps" defaultValue={initialData.reps} placeholder={placeholderData?.reps || '0'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'reps', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-lg" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{preferences?.effortMetric || 'RIR'}</label>
                        <select name="effort" defaultValue={initialData.effort} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-lg">
                            <option value="">-</option>
                            {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex justify-center gap-2 mt-2">
                     {isUnilateral ? (
                        <>
                            <button onClick={() => toggleComplete('left')} className={`flex-1 py-2 rounded-md font-semibold ${leftCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-500'}`}>Izquierda</button>
                            <button onClick={() => toggleComplete('right')} className={`flex-1 py-2 rounded-md font-semibold ${rightCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-500'}`}>Derecha</button>
                        </>
                    ) : (
                        <button onClick={() => toggleComplete('both')} className={`w-full py-2 rounded-md font-semibold ${leftCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-500'}`}>Marcar como Completada</button>
                    )}
                 </div>
            </div>
            <div className="hidden md:grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] items-center gap-2">
                <div className="flex items-center justify-center w-8">
                    {isPR && <Award className="text-yellow-500 animate-pulse" size={20} />}
                    <span className="font-bold text-center">{setInfo.setNumber}</span>
                </div>
                <input type="number" name="weight" defaultValue={initialData.weight} placeholder={placeholderData?.weight || '0'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <input type="number" name="reps" defaultValue={initialData.reps} placeholder={placeholderData?.reps || '0'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'reps', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
                <select name="effort" defaultValue={initialData.effort} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center">
                    <option value="">{preferences?.effortMetric?.toUpperCase() || '...'}</option>
                    {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button onClick={() => setShowNote(!showNote)} className="flex justify-center p-1"><MessageSquarePlus className={initialData.note ? "text-blue-500" : "text-gray-400"} /></button>
                <div className="flex justify-center gap-1 font-bold">
                    {isUnilateral ? (
                        <>
                            <button onClick={() => toggleComplete('left')} className={`px-2 py-1 rounded-md text-xs ${leftCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-500'}`}>I</button>
                            <button onClick={() => toggleComplete('right')} className={`px-2 py-1 rounded-md text-xs ${rightCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-500'}`}>D</button>
                        </>
                    ) : (
                        <button onClick={() => toggleComplete('both')} className="flex justify-center p-1"><CheckCircle className={leftCompleted ? "text-green-500" : "text-gray-400"}/></button>
                    )}
                </div>
                <button onClick={() => onRemoveSet(exerciseId, setInfo.id)} className="flex justify-center p-1 text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
            {placeholderData && ( <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600/50 mt-3"> <History size={12} /> <span>Última vez: {placeholderData.weight || '0'} {preferences.weightUnit} x {placeholderData.reps || '0'} reps</span> </div> )}
            {showNote && ( <div className="mt-3"><input type="text" name="note" defaultValue={initialData.note} placeholder="Añadir nota..." onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'note', e.target.value)} className="w-full p-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md"/></div>)}
        </div>
    );
};

const ExerciseCard = ({ exercise, preferences, workoutData, onSetChange, onCompleteSet, onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise, prs, lastPerformanceSets }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    
    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{exercise.baseName || exercise.name}</h3>
                    {exercise.variationName && <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">{exercise.variationName}</p>}
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><MoreVertical size={20} /></button>
                    {isMenuOpen && ( <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"><div className="py-1"><button onClick={() => { onReplaceExercise(exercise.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><RefreshCw size={16}/> Reemplazar</button><button onClick={() => { onDeleteExercise(exercise.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"><Trash2 size={16}/> Eliminar</button></div></div>)}
                </div>
            </div>
            <div className="hidden md:grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] gap-2 text-sm font-semibold text-center mb-2 px-2">
                <span></span><span>Peso ({preferences?.weightUnit?.toUpperCase() || '...'})</span><span>Reps</span><span className="uppercase">{preferences?.effortMetric || '...'}</span><span colSpan={3}></span>
            </div>
            <div className="space-y-2">
                {exercise.sets.map((setInfo, index) => {
                    const initialDataForSet = workoutData[exercise.id]?.[setInfo.setNumber] || {};
                    const isPR = prs.has(`${exercise.id}-${setInfo.setNumber}`);
                    const placeholderData = lastPerformanceSets[index];
                    return (<SetRow key={setInfo.id} setInfo={setInfo} exerciseId={exercise.id} isUnilateral={exercise.isUnilateral} onSetChange={onSetChange} onCompleteSet={onCompleteSet} initialData={initialDataForSet} placeholderData={placeholderData} preferences={preferences} onRemoveSet={onRemoveSet} isPR={isPR}/>);
                })}
            </div>
            <div className="mt-4"><button onClick={() => onAddSet(exercise.id)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"><PlusCircle size={16} /> Agregar Serie</button></div>
        </div>
    );
};

export default function CreateSessionView({ user }) {
    const { routineId } = useParams();
    const navigate = useNavigate();
    const { 
        sessionExercises, setSessionExercises, activeSession,
        startSession, endSession, elapsedTime, workoutData, updateWorkoutData, 
        restTimer, timeRemaining, startRestTimer, closeRestTimer
    } = useActiveSession();
    const { preferences } = usePreferences();
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados para los modales de confirmación
    const [isFinishConfirmationOpen, setIsFinishConfirmationOpen] = useState(false);
    const [isUncompletedWarningOpen, setIsUncompletedWarningOpen] = useState(false);
    
    const { checkIsPR, trackNewPR, resetSessionPRs } = usePersonalRecords();
    const [prSets, setPrSets] = useState(new Set());
    const { getLastPerformance } = useLastPerformance();

    const routinePath = useMemo(() => user ? `users/${user.uid}/routines/${routineId}` : null, [user, routineId]);
    const { document: routine, loading: routineLoading } = useFirestoreDocument(routinePath);
    const routineExercisesPath = useMemo(() => user && routineId ? `users/${user.uid}/routines/${routineId}/exercises` : null, [user, routineId]);
    const { data: routineExercises, loading: exercisesLoading } = useFirestoreCollection(routineExercisesPath, { orderBy: 'addedAt', direction: 'asc' });
    
    useEffect(() => {
        if (activeSession && routineExercises.length > 0 && sessionExercises.length === 0) {
            const initialSets = routineExercises.map(ex => ({
                ...ex,
                sets: Array.from({ length: ex.sets || 1 }, (_, i) => ({
                    id: `${ex.id}-${i + 1}`,
                    setNumber: i + 1,
                }))
            }));
            setSessionExercises(initialSets);
        }
    }, [activeSession, routineExercises, sessionExercises.length, setSessionExercises]);

    const {
        isAddExerciseModalOpen, setIsAddExerciseModalOpen,
        isReplacementModalOpen, setIsReplacementModalOpen,
        handleAddOrReplaceExercise,
        openReplaceModal,
        openAddModal,
        handleShowCustomCreateFromReplacement,
        handleAddSet,
        handleRemoveSet,
        handleDeleteExercise,
        onUndo,
        undoState,
    } = useSessionManager(sessionExercises, setSessionExercises);
    
    const groupedSessionExercises = useMemo(() => {
        if (!sessionExercises) return [];
        const groups = {};
        const singleExercises = [];
        sessionExercises.forEach(ex => {
            if (ex.supersetId) {
                if (!groups[ex.supersetId]) groups[ex.supersetId] = [];
                groups[ex.supersetId].push(ex);
            } else {
                singleExercises.push([ex]);
            }
        });
        Object.values(groups).forEach(group => group.sort((a, b) => a.supersetOrder - b.supersetOrder));
        return [...Object.values(groups), ...singleExercises].sort((a, b) => (a[0].addedAt?.seconds || a[0].addedAt || 0) - (b[0].addedAt?.seconds || b[0].addedAt || 0));
    }, [sessionExercises]);

    useEffect(() => {
        if (routine) {
            startSession(routineId, routine.name);
            resetSessionPRs();
        }
    }, [routine, routineId, startSession, resetSessionPRs]);

    const handleSetChange = (exerciseId, setNumber, field, value) => {
        updateWorkoutData(exerciseId, setNumber, field, value);
        if (field === 'weight' || field === 'reps') {
            const currentSetData = workoutData[exerciseId]?.[setNumber] || {};
            const weight = field === 'weight' ? value : currentSetData.weight;
            const reps = field === 'reps' ? value : currentSetData.reps;
            const isPR = checkIsPR(exerciseId, reps, weight);
            if (isPR) {
                trackNewPR(exerciseId, reps, weight);
                setPrSets(prev => new Set(prev).add(`${exerciseId}-${setNumber}`));
            } else {
                setPrSets(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(`${exerciseId}-${setNumber}`);
                    return newSet;
                });
            }
        }
    };
    
    const handleCompleteSet = (exerciseId, setNumber, side, newStatus) => {
        const fieldToUpdate = side === 'right' ? 'completedRight' : 'completedLeft';
        updateWorkoutData(exerciseId, setNumber, fieldToUpdate, newStatus);
    
        const exercise = sessionExercises.find(ex => ex.id === exerciseId);
        if (!exercise || !newStatus) return;
    
        const currentSetState = workoutData[exerciseId]?.[setNumber] || {};
        const isLeftDone = fieldToUpdate === 'completedLeft' ? newStatus : (currentSetState.completedLeft || false);
        const isRightDone = fieldToUpdate === 'completedRight' ? newStatus : (currentSetState.completedRight || false);
        
        const isSetFullyCompleted = exercise.isUnilateral ? (isLeftDone && isRightDone) : isLeftDone;
    
        if (exercise.isUnilateral && ((isLeftDone && !isRightDone) || (!isLeftDone && isRightDone))) {
            const sideRestMinutes = parseInt(exercise.restBetweenSidesMinutes, 10) || 0;
            const sideRestSeconds = parseInt(exercise.restBetweenSidesSeconds, 10) || 15;
            const sideRestDuration = (sideRestMinutes * 60) + sideRestSeconds;
            startRestTimer(sideRestDuration, "Cambia de lado", "Prepara el otro lado");
            return;
        }

        if (isSetFullyCompleted) {
            const group = groupedSessionExercises.find(g => g.some(e => e.id === exerciseId));
            const isLastInSuperset = group && group.length > 1 && group[group.length - 1].id === exerciseId;
            const isSingleExercise = !group || group.length === 1;
    
            if (isSingleExercise || isLastInSuperset) {
                const nextGroupIndex = groupedSessionExercises.findIndex(g => g.some(e => e.id === exerciseId)) + 1;
                const nextGroup = groupedSessionExercises[nextGroupIndex];
                const nextExerciseName = nextGroup ? nextGroup[0].name : 'Entrenamiento Finalizado';
                const duration = (parseInt(exercise.restMinutes, 10) || 0) * 60 + (parseInt(exercise.restSeconds, 10) || 0);
                startRestTimer(duration, nextExerciseName);
            }
        }
    };
    
    const handleFinishClick = () => {
        let allSetsCompleted = true;
        for (const exercise of sessionExercises) {
            for (const set of exercise.sets) {
                const setData = workoutData[exercise.id]?.[set.setNumber];
                const isSetCompleted = exercise.isUnilateral
                    ? setData?.completedLeft && setData?.completedRight
                    : setData?.completedLeft;

                if (!isSetCompleted) {
                    allSetsCompleted = false;
                    break;
                }
            }
            if (!allSetsCompleted) break;
        }

        if (allSetsCompleted) {
            setIsFinishConfirmationOpen(true);
        } else {
            setIsUncompletedWarningOpen(true);
        }
    };

    const handleFinishWorkout = useCallback(async () => {
        setIsFinishConfirmationOpen(false);
        setIsUncompletedWarningOpen(false); 
        setIsSaving(true);
        try {
            await saveWorkoutSession(user.uid, routineId, workoutData, sessionExercises, prSets);
            await checkAndGrantAchievements(user.uid); 
            endSession();
            navigate('/historial');
        } catch (error) {
            console.error("Error detallado capturado en la vista:", error);
            alert(`¡ERROR DETALLADO!\n\nOcurrió un problema al guardar la sesión. Por favor, comparte este mensaje completo para solucionarlo:\n\nNombre del Error: ${error.name}\nMensaje: ${error.message}\nCódigo: ${error.code}\n\nStack (Pila de llamadas): \n${error.stack}`);
        } finally {
            setIsSaving(false);
        }
    }, [user.uid, routineId, workoutData, sessionExercises, prSets, endSession, navigate]);
    
    const handleCancelWorkout = () => { endSession(); navigate(`/rutina/${routineId}`); };
    const formatTime = (seconds) => { const h = Math.floor(seconds / 3600).toString().padStart(2, '0'); const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0'); const s = Math.floor(seconds % 60).toString().padStart(2, '0'); return `${h}:${m}:${s}`; };
    
    if (routineLoading || exercisesLoading) return <ThemedLoader />;
    
    return (
        <div className="relative min-h-screen pb-16">
            <AddExerciseModal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} user={user} onExerciseCreated={handleAddOrReplaceExercise}/>
            <GenericModal isOpen={isReplacementModalOpen} onClose={() => setIsReplacementModalOpen(false)} title="Reemplazar Ejercicio"><ReplacementExerciseList user={user} onSelect={(exercise) => { handleAddOrReplaceExercise(exercise); setIsReplacementModalOpen(false); }} onShowCustomCreate={handleShowCustomCreateFromReplacement}/></GenericModal>
            
            <ConfirmationModal 
                isOpen={isFinishConfirmationOpen} 
                onClose={() => setIsFinishConfirmationOpen(false)} 
                title="¿Finalizar entrenamiento?" 
                message="Una vez finalizado, se guardará en tu historial. ¿Estás seguro?" 
                onConfirm={handleFinishWorkout} 
            />
            <ConfirmationModal 
                isOpen={isUncompletedWarningOpen} 
                onClose={() => setIsUncompletedWarningOpen(false)} 
                title="¡Atención!" 
                message="Tienes series sin marcar como completadas. ¿Deseas finalizar el entrenamiento de todas formas?" 
                onConfirm={handleFinishWorkout} 
            />

            <Card>
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                        <button onClick={handleCancelWorkout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 mb-2"><XCircle size={16}/> Cancelar</button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{routine?.name || 'Entrenamiento'}</h2>
                        <div className="flex items-center gap-2 mt-2 text-lg text-blue-500 font-semibold"><Clock size={20}/><span>{formatTime(elapsedTime)}</span></div>
                    </div>
                    <button onClick={handleFinishClick} disabled={isSaving} className="flex items-center gap-2 px-5 py-3 text-white font-semibold rounded-lg shadow bg-red-600 hover:bg-red-500 disabled:bg-opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? <Loader className="animate-spin" size={20} /> : "Finalizar"}
                    </button>
                </div>
                <div className="space-y-6">
                    {groupedSessionExercises.length > 0 ? groupedSessionExercises.map((group) => (
                        <div key={group[0].supersetId || group[0].id} className={`space-y-4 ${group.length > 1 ? 'p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30' : ''}`}>
                             {group.length > 1 && <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2"><LinkIcon size={16}/>Super-serie</h4>}
                             {group.map(ex => {
                                const lastPerformanceSets = getLastPerformance(ex.id);
                                return (<ExerciseCard key={ex.id} exercise={ex} preferences={preferences} workoutData={workoutData} onSetChange={handleSetChange} onCompleteSet={handleCompleteSet} onAddSet={handleAddSet} onRemoveSet={handleRemoveSet} onDeleteExercise={handleDeleteExercise} onReplaceExercise={openReplaceModal} prs={prSets} lastPerformanceSets={lastPerformanceSets}/>);
                             })}
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">Cargando ejercicios o esta rutina está vacía.</p>}
                </div>
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"><button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline"><PlusCircle size={18} /> Agregar Ejercicio sobre la marcha</button></div>
            </Card>
            <UndoBar isActive={undoState.isActive} onUndo={onUndo} message={undoState.message}/>
            <RestTimer />
        </div>
    );
}