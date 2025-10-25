import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useSessionManager from '../hooks/useSessionManager.jsx';
import useLastPerformance from '../hooks/useLastPerformance.jsx'; // Hook para última performance
import usePersonalRecords from '../hooks/usePersonalRecords.jsx'; // Hook para PRs
import { useUndoContext } from '../context/UndoContext.jsx'; // <-- IMPORTA el hook del contexto
import { saveWorkoutSession } from '../firebase/sessionService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import RestTimer from '../components/RestTimer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
// Se elimina la importación de UndoBar, ya que ahora es global
import { ArrowLeft, Loader, PlusCircle, Trash2, MoreVertical, RefreshCw, CheckCircle, Square, XCircle, Info, Award } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Para IDs únicos de set

// --- Componente SetRow ---
const SetRow = ({ setInfo, exerciseId, onSetChange, onCompleteSet, lastPerformanceSet, prInfo, preferences, onRemoveSet, onAddNote, onTogglePR, isCurrentPR }) => {
    const [isCompleted, setIsCompleted] = useState(setInfo.completed || false);
    useEffect(() => { setIsCompleted(setInfo.completed || false); }, [setInfo.completed]);
    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
    const toggleComplete = () => {
        const newStatus = !isCompleted;
        setIsCompleted(newStatus);
        onCompleteSet(exerciseId, setInfo.setNumber, newStatus);
    };
    const handleNoteClick = () => {
        const note = prompt("Añadir nota para esta serie:", setInfo.note || "");
        if (note !== null) { onAddNote(exerciseId, setInfo.setNumber, note); }
    };
    return (
        <div className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] items-center gap-2 p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
            <span className="font-bold text-center pr-2 relative">
                {setInfo.setNumber}
                {isCurrentPR && <Award size={14} className="absolute -top-1 -right-1 text-yellow-500" title="¡Nuevo PR!" />}
            </span>
            <input type="number" name="weight" value={setInfo.weight} placeholder={lastPerformanceSet?.weight ?? '-'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'weight', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
            <input type="number" name="reps" value={setInfo.reps} placeholder={lastPerformanceSet?.reps ?? '-'} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'reps', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" />
            <select name="effort" value={setInfo.effort} onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'effort', e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center" >
                <option value="">{preferences?.effortMetric?.toUpperCase() || 'RIR/RPE'}</option>
                {preferences?.effortMetric === 'rir' ? rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) : rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
             <button onClick={handleNoteClick} className="flex justify-center p-1 text-gray-500 hover:text-blue-500 relative">
                 <Info size={16} />
                 {setInfo.note && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-700"></span>}
            </button>
            <button onClick={toggleComplete} className="flex justify-center p-1"> {isCompleted ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>} </button>
            <button onClick={() => onRemoveSet(exerciseId, setInfo.id)} className="flex justify-center p-1 text-red-500 hover:text-red-400"> <Trash2 size={16} /> </button>
        </div>
    );
};

// --- Componente ExerciseCard ---
const ExerciseCard = ({ exercise, preferences, workoutData, onSetChange, onCompleteSet, onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise, lastPerformanceSets, prInfo, onAddNote, onTogglePR }) => {
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
            <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] gap-2 text-xs font-semibold text-center mb-2 px-1 text-gray-500 dark:text-gray-400">
                <span>#</span><span>Peso ({preferences?.weightUnit?.toUpperCase() || 'KG'})</span><span>Reps</span><span className="uppercase">{preferences?.effortMetric || 'RIR'}</span><span>Nota</span><span></span><span></span>
            </div>
            <div className="space-y-2">
                {exercise.sets.map((setInfo, index) => (
                    <SetRow key={setInfo.id} setInfo={setInfo} exerciseId={exercise.exerciseId} onSetChange={onSetChange} onCompleteSet={onCompleteSet} lastPerformanceSet={lastPerformanceSets[index]} prInfo={prInfo} preferences={preferences} onRemoveSet={onRemoveSet} onAddNote={onAddNote} onTogglePR={onTogglePR} isCurrentPR={setInfo.isPR} />
                ))}
            </div>
            <div className="mt-4"> <button onClick={() => onAddSet(exercise.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"> <PlusCircle size={16} /> Agregar Serie </button> </div>
        </div>
    );
};


// --- Vista Principal ---
export default function CreateSessionView() {
    const { routineId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
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
        sessionExercises,
        setSessionExercises, // Necesario para restaurar en Undo
        loading: managerLoading,
        error: managerError,
        isAddExerciseModalOpen,
        setIsAddExerciseModalOpen,
        handleAddSet,
        handleRemoveSet: removeSetFromState, // Función del manager
        handleDeleteExercise: deleteExerciseFromState,
        handleAddOrReplaceExercise,
        openReplaceModal,
        openAddModal
    } = useSessionManager(routineId);

    // Usa el hook del contexto para mostrar la barra
    const { showUndoBar } = useUndoContext();

    // useEffect para inicializar workoutData
    useEffect(() => {
        if (!managerLoading && sessionExercises.length > 0) {
            const initialData = {};
            sessionExercises.forEach(ex => {
                initialData[ex.exerciseId] = {};
                ex.sets.forEach(set => {
                    if (!workoutData[ex.exerciseId]?.[set.setNumber]) {
                         initialData[ex.exerciseId][set.setNumber] = { ...set, completed: false, note: '', isPR: false };
                    } else {
                         initialData[ex.exerciseId][set.setNumber] = workoutData[ex.exerciseId][set.setNumber];
                    }
                });
            });
            if (JSON.stringify(initialData) !== JSON.stringify(workoutData)) {
                 setWorkoutData(initialData);
            }
            if (typeof resetSessionPRs === 'function') {
                resetSessionPRs();
            }
        }
    }, [sessionExercises, managerLoading, resetSessionPRs, workoutData]);


    // Callbacks para SetRow y ExerciseCard
    const handleSetChange = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(prevData => {
            const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
            const newData = {
                ...prevData,
                [exerciseId]: {
                    ...prevData[exerciseId],
                    [setNumber]: { ...currentSetData, [field]: value }
                }
            };
            if ((field === 'weight' || field === 'reps')) {
                 const updatedSetData = newData[exerciseId][setNumber];
                 const weight = parseFloat(updatedSetData.weight);
                 const reps = parseInt(updatedSetData.reps, 10);
                 const isNewPR = typeof checkIsPR === 'function' ? checkIsPR(exerciseId, reps, weight) : false;
                 if (isNewPR) {
                     newData[exerciseId][setNumber].isPR = true;
                      if (typeof trackNewPR === 'function') trackNewPR(exerciseId, reps, weight);
                 } else {
                     newData[exerciseId][setNumber].isPR = false;
                 }
            }
            return newData;
        });
    }, [checkIsPR, trackNewPR]);

    const handleCompleteSet = useCallback((exerciseId, setNumber, isCompleted) => {
        setWorkoutData(prevData => {
            const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
            return {
                ...prevData,
                [exerciseId]: { ...prevData[exerciseId], [setNumber]: { ...currentSetData, completed: isCompleted } }
            };
        });
    }, []);

    const handleAddNote = useCallback((exerciseId, setNumber, note) => {
         setWorkoutData(prevData => {
             const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
             return {
                ...prevData,
                [exerciseId]: { ...prevData[exerciseId], [setNumber]: { ...currentSetData, note: note } }
             };
         });
    }, []);

    const handleTogglePR = useCallback((exerciseId, setNumber) => {
         setWorkoutData(prevData => {
             const currentSet = prevData[exerciseId]?.[setNumber];
             if (!currentSet) return prevData;
             return {
                ...prevData,
                [exerciseId]: { ...prevData[exerciseId], [setNumber]: { ...currentSet, isPR: !currentSet.isPR } }
             };
         });
    }, []);

    // --- MODIFICADO: handleRemoveSet usa showUndoBar ---
    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        const removedSetInfo = removeSetFromState(exerciseId, setIdToRemove); // Llama al manager

        if (removedSetInfo) {
            // Limpia workoutData
            setWorkoutData(prevData => {
                const exerciseSets = { ...prevData[exerciseId] };
                if (removedSetInfo.set && removedSetInfo.set.setNumber !== undefined) {
                     delete exerciseSets[removedSetInfo.set.setNumber];
                }
                return { ...prevData, [exerciseId]: exerciseSets };
            });

            // Define la acción de restauración
            const restoreAction = () => {
                // Restaura el estado en sessionExercises
                setSessionExercises(prevExercises =>
                    prevExercises.map(ex => {
                        if (ex.exerciseId === removedSetInfo.exerciseId) {
                            const newSets = [...ex.sets];
                            newSets.splice(removedSetInfo.index, 0, removedSetInfo.set);
                            const renumberedSets = newSets.map((set, index) => ({ ...set, setNumber: index + 1 }));
                            return { ...ex, sets: renumberedSets };
                        }
                        return ex;
                    })
                );
                // Restaura workoutData
                setWorkoutData(prevData => ({
                     ...prevData,
                     [removedSetInfo.exerciseId]: {
                         ...prevData[removedSetInfo.exerciseId],
                         [removedSetInfo.set.setNumber]: { ...removedSetInfo.set }
                     }
                 }));
            };

            // Muestra la barra usando el contexto
            showUndoBar("Serie eliminada.", restoreAction);
        }
    }, [removeSetFromState, showUndoBar, setSessionExercises]); // Dependencias actualizadas

    const handleDeleteExercise = useCallback((exerciseId) => {
        setExerciseIdToDelete(exerciseId);
        setIsDeleteExerciseConfirmationOpen(true);
    }, []);

    const confirmDeleteExercise = useCallback(() => {
        // Guarda el estado actual por si se quiere deshacer
        const exercisesBeforeDelete = [...sessionExercises];
        const workoutDataBeforeDelete = { ...workoutData };
        const deletedExerciseIndex = exercisesBeforeDelete.findIndex(ex => ex.exerciseId === exerciseIdToDelete);
        const deletedExercise = exercisesBeforeDelete[deletedExerciseIndex];

        // Elimina el ejercicio
        deleteExerciseFromState(exerciseIdToDelete);
        setWorkoutData(prevData => {
            const newData = { ...prevData };
            delete newData[exerciseIdToDelete];
            return newData;
        });
        setIsDeleteExerciseConfirmationOpen(false);

        // Define la acción de restauración para eliminar ejercicio
        const restoreExerciseAction = () => {
            setSessionExercises(exercisesBeforeDelete); // Restaura la lista completa
            setWorkoutData(workoutDataBeforeDelete); // Restaura los datos del workout
        };

        // Muestra la barra de deshacer para eliminar ejercicio
        showUndoBar("Ejercicio eliminado.", restoreExerciseAction);
        setExerciseIdToDelete(null); // Limpia después de configurar el undo

    }, [exerciseIdToDelete, deleteExerciseFromState, showUndoBar, setSessionExercises, sessionExercises, workoutData]);


    // Finalizar/Cancelar (con guardia para 'user')
    const handleFinishWorkout = useCallback(async () => {
        if (!user) {
            console.error("Intento de guardar sesión sin usuario autenticado.");
            alert("Error: Debes estar conectado para guardar la sesión.");
            return;
        }
        setIsFinishConfirmationOpen(false);
        setIsSaving(true);
        try {
             const exercisesToSave = sessionExercises.map(ex => ({
                 exerciseId: ex.exerciseId,
                 exerciseName: ex.exerciseName,
                 variationName: ex.variationName,
                 isUnilateral: ex.isUnilateral,
                 supersetId: ex.supersetId,
                 supersetOrder: ex.supersetOrder,
                 sets: ex.sets
                     .map(setInfo => workoutData[ex.exerciseId]?.[setInfo.setNumber])
                     .filter(setData => setData && (setData.weight || setData.reps || setData.effort || setData.completed || setData.note))
                     .map(setData => ({
                         set: setData.setNumber,
                         weight: parseFloat(setData.weight) || 0,
                         reps: parseInt(setData.reps, 10) || 0,
                         effort: setData.effort || '',
                         completed: setData.completed || false,
                         note: setData.note || '',
                         isPR: setData.isPR || false,
                     }))
             })).filter(ex => ex.sets.length > 0);

            if (exercisesToSave.length === 0) {
                 alert("No has registrado ningún dato en esta sesión.");
                 setIsSaving(false);
                 return;
            }

            const sessionId = await saveWorkoutSession(user.uid, routineId, routineDoc?.name || 'Entrenamiento', exercisesToSave);
            navigate(`/historial/${sessionId}`);

        } catch (error) {
            console.error("Error al guardar sesión:", error);
            alert("Hubo un error al guardar la sesión.");
            setIsSaving(false);
        }
    }, [sessionExercises, workoutData, user, routineId, routineDoc?.name, navigate]);

    const handleCancelWorkout = () => {
        setIsCancelConfirmationOpen(false);
        navigate('/rutinas');
    };


    // Estados combinados de carga y error
    const isLoading = routineLoading || managerLoading || isLastPerformanceLoading || isPRLoading;
    const hasError = managerError;

    // Guardia para usuario no cargado
    if (!user && !isLoading) { return <ThemedLoader />; }
    if (isLoading) return <ThemedLoader />;
    if (hasError) return <Card><p className="text-red-500">{hasError}</p></Card>;

    // --- RENDERIZADO ---
    return (
        // Contenedor principal con padding-bottom para que la barra no tape contenido
        <div className="relative min-h-screen pb-20">
            {/* Modales */}
             <AddExerciseToRoutineModal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} user={user} onAddExercise={handleAddOrReplaceExercise} />
             <ConfirmationModal isOpen={isFinishConfirmationOpen} onClose={() => setIsFinishConfirmationOpen(false)} title="Finalizar Entrenamiento" message="¿Estás seguro de que quieres finalizar y guardar esta sesión?" onConfirm={handleFinishWorkout} />
             <ConfirmationModal isOpen={isCancelConfirmationOpen} onClose={() => setIsCancelConfirmationOpen(false)} title="Cancelar Entrenamiento" message="¿Estás seguro de que quieres cancelar? El progreso no guardado se perderá." onConfirm={handleCancelWorkout} confirmText="Sí, Cancelar" cancelText="No, Continuar" />
             <ConfirmationModal isOpen={isDeleteExerciseConfirmationOpen} onClose={() => setIsDeleteExerciseConfirmationOpen(false)} title="Eliminar Ejercicio" message="¿Estás seguro de que quieres eliminar este ejercicio de la sesión actual?" onConfirm={confirmDeleteExercise} />

            <Card>
                {/* Encabezado */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                         <button onClick={() => setIsCancelConfirmationOpen(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 mb-2"> <XCircle size={16}/> Cancelar Sesión </button>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{routineDoc?.name || 'Entrenamiento'}</h2>
                    </div>
                    <button onClick={() => setIsFinishConfirmationOpen(true)} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow bg-green-600 hover:bg-green-500 disabled:bg-opacity-50 disabled:cursor-not-allowed" > {isSaving ? <Loader className="animate-spin" size={20} /> : "Finalizar"} </button>
                </div>
                {/* Rest Timer */}
                <RestTimer />
                {/* Lista de Ejercicios */}
                <div className="space-y-6">
                     {sessionExercises.length > 0 ? (
                        sessionExercises.map((ex) => {
                            // Verifica que getLastPerformance sea una función antes de llamarla
                            const lastPerfSets = typeof getLastPerformance === 'function'
                                ? getLastPerformance(ex.exerciseId)
                                : []; // Fallback a array vacío
                            return (
                                <ExerciseCard
                                    key={ex.exerciseId}
                                    exercise={ex}
                                    preferences={preferences}
                                    workoutData={workoutData[ex.exerciseId] || {}}
                                    onSetChange={handleSetChange}
                                    onCompleteSet={handleCompleteSet}
                                    onAddSet={handleAddSet}
                                    onRemoveSet={handleRemoveSet} // Pasa la función modificada
                                    onDeleteExercise={handleDeleteExercise}
                                    onReplaceExercise={openReplaceModal}
                                    lastPerformanceSets={lastPerfSets} // Pasa el resultado (o fallback)
                                    prInfo={{ checkIsPR, trackNewPR }}
                                    onAddNote={handleAddNote}
                                    onTogglePR={handleTogglePR}
                                />
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">No hay ejercicios en esta sesión. ¡Añade uno!</p>
                    )}
                </div>
                {/* Botón Añadir Ejercicio */}
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"> <button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline" > <PlusCircle size={18} /> Agregar Ejercicio a la Sesión </button> </div>
            </Card>

            {/* La UndoBar ya no se renderiza aquí, es manejada globalmente */}

        </div> // Fin del div principal
    );
}