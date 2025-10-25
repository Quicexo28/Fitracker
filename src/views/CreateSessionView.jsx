import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useSessionManager from '../hooks/useSessionManager.jsx';
import useLastPerformance from '../hooks/useLastPerformance.jsx';
import usePersonalRecords from '../hooks/usePersonalRecords.jsx';
//import { useUndoContext } from '../context/UndoContext.jsx';
import { saveWorkoutSession } from '../firebase/sessionService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import RestTimer from '../components/RestTimer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
// Importa los iconos necesarios
import { ArrowLeft, Loader, PlusCircle, Trash2, MoreVertical, RefreshCw, CheckCircle, Square, XCircle, MessageSquare, Award, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- Componente SetRow (Con todas las mejoras UI/UX) ---
const SetRow = React.memo(({
    setNumber,
    setData, // Objeto con { weight, reps, effort, note, completed, isPR }
    exerciseId,
    setId,
    onSetChange,
    onCompleteSet,
    lastPerformanceSet, // { weight, reps } de la última vez
    targetReps, // Reps objetivo de la rutina (puede ser "5-12")
    preferences,
    onRemoveSet,
    onCopyLastPerformance // Nueva prop para copiar datos
}) => {
    const [isCompleted, setIsCompleted] = useState(setData.completed || false);
    const [isNoteOpen, setIsNoteOpen] = useState(false); // Estado para mostrar input de nota

    useEffect(() => { setIsCompleted(setData.completed || false); }, [setData.completed]);

    const rirOptions = [4, 3, 2, 1, 0];
    const rpeOptions = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];

    // Llama al callback principal con el campo específico que cambió
    const handleChange = (field, value) => {
        onSetChange(exerciseId, setNumber, field, value);
    };

    const toggleComplete = () => {
        onCompleteSet(exerciseId, setNumber, !isCompleted);
    };

    // Abre/cierra el input de nota
    const toggleNoteInput = () => {
        setIsNoteOpen(prev => !prev);
    };

    // --- Lógica para Placeholder Gris en Reps ---
    const currentRepsValue = setData.reps !== undefined ? String(setData.reps) : '';
    // Placeholder prioritario: reps objetivo de la rutina
    const placeholderReps = targetReps !== undefined && targetReps !== '' ? String(targetReps)
                         : (lastPerformanceSet?.reps !== undefined ? String(lastPerformanceSet.reps) : '-');
    // Es un rango si contiene un guión
    const placeholderIsRange = useMemo(() => /\d+-\d+/.test(placeholderReps), [placeholderReps]);
    // Está mostrando el placeholder si el valor actual está vacío Y el placeholder es un rango
    const isShowingPlaceholderRange = currentRepsValue === '' && placeholderIsRange;

    const repsInputClass = `w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center ${
        isShowingPlaceholderRange ? 'text-gray-400 dark:text-gray-500 placeholder:text-gray-400 dark:placeholder:text-gray-500' // Aplica gris si muestra placeholder de rango
                                  : 'text-gray-900 dark:text-white' // Color normal si hay valor o placeholder no es rango
    }`;
    // --- Fin Placeholder Gris ---

    return (
        // Div contenedor para la fila y la nota expandible
        <div className={`p-2 rounded-lg ${setData.completed ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
            {/* Fila principal de datos (8 columnas ahora) */}
            <div className={`grid grid-cols-[auto,auto,1fr,1fr,1fr,auto,auto,auto] items-center gap-2`}>
                {/* 1. Medalla PR (más grande, antes del número) */}
                <div className="w-6 h-6 flex items-center justify-center">
                    {setData.isPR && <Award size={18} className="text-yellow-500" title="¡Nuevo PR!" />}
                </div>
                {/* 2. Número de Serie */}
                <span className="font-bold text-center pr-2">{setNumber}</span>

                {/* 3. Input Peso */}
                <input
                    type="number"
                    step="any"
                    value={setData.weight || ''} // Controlado por workoutData
                    placeholder={lastPerformanceSet?.weight ?? '-'}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-gray-900 dark:text-white"
                />

                {/* 4. Input Reps (tipo texto, value de workoutData, placeholder de rutina/última vez) */}
                <input
                    type="text" // Para aceptar números o rangos al escribir
                    value={currentRepsValue} // Usa el valor actual (string)
                    placeholder={placeholderReps} // Muestra objetivo (ej "5-12") o última vez
                    onChange={(e) => handleChange('reps', e.target.value)}
                    className={repsInputClass} // Aplica clase calculada para color
                    inputMode="numeric" // Sugiere teclado numérico
                />

                {/* 5. Select Esfuerzo */}
                <select
                    value={setData.effort || ''} // Controlado por workoutData
                    onChange={(e) => handleChange('effort', e.target.value)}
                    className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center text-gray-900 dark:text-white"
                >
                    <option value="">{preferences?.effortMetric?.toUpperCase() || 'RIR/RPE'}</option>
                    {preferences?.effortMetric === 'rir' ?
                        rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) :
                        rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>

                {/* 6. Botón Copiar Última Vez */}
                <button
                    onClick={() => onCopyLastPerformance(exerciseId, setNumber, lastPerformanceSet)}
                    className="flex justify-center p-1 text-gray-500 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copiar datos de la última sesión"
                    disabled={!lastPerformanceSet || (lastPerformanceSet.weight === undefined && lastPerformanceSet.reps === undefined)}
                >
                     <History size={16} />
                </button>

                {/* 7. Botón Nota (Nuevo icono) */}
                <button onClick={toggleNoteInput} className="flex justify-center p-1 text-gray-500 hover:text-blue-500 relative">
                     <MessageSquare size={16} />
                     {setData.note && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-700"></span>}
                </button>

                {/* 8. Botones Completar y Eliminar (Juntos) */}
                <div className="flex items-center justify-center gap-1">
                    <button onClick={toggleComplete} className="p-1">
                        {setData.completed ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>}
                    </button>
                    <button onClick={() => onRemoveSet(exerciseId, setId)} className="p-1 text-red-500 hover:text-red-400">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Input de Nota Condicional (debajo de la fila) */}
            {isNoteOpen && (
                // Ajusta el padding izquierdo según el ancho de PR + #
                <div className="mt-2 pl-[calc(theme(space.6)+theme(space.2)+theme(space.8))]"> {/* Ajusta theme(space.X) según necesites */}
                    <input
                        type="text"
                        value={setData.note || ''} // Controlado por workoutData
                        onChange={(e) => handleChange('note', e.target.value)}
                        placeholder="Añadir nota..."
                        className="w-full p-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                        autoFocus // Enfocar al abrir
                    />
                </div>
            )}
        </div>
    );
});


// --- Componente ExerciseCard (Modificado para pasar targetReps) ---
const ExerciseCard = React.memo(({
    exercise, exerciseWorkoutData, preferences, onSetChange, onCompleteSet,
    onAddSet, onRemoveSet, onDeleteExercise, onReplaceExercise, lastPerformanceSets,
    onCopyLastPerformance
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
            {/* Encabezado */}
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
            {/* Cabecera de Sets (8 columnas) */}
            <div className="grid grid-cols-[auto,auto,1fr,1fr,1fr,auto,auto,auto] gap-2 text-xs font-semibold text-center mb-2 px-1 text-gray-500 dark:text-gray-400">
                <span></span><span>#</span><span>Peso ({preferences?.weightUnit?.toUpperCase() || 'KG'})</span><span>Reps</span><span className="uppercase">{preferences?.effortMetric || 'RIR'}</span><span></span><span>Nota</span><span></span>
            </div>
            {/* Lista de Sets */}
            <div className="space-y-2">
                {exercise.sets.map((setInfo, index) => { // setInfo viene de sessionExercises
                    const currentSetData = exerciseWorkoutData?.[setInfo.setNumber] || { id: setInfo.id, setNumber: setInfo.setNumber };
                    return (
                        <SetRow
                            key={setInfo.id}
                            setId={setInfo.id}
                            setNumber={setInfo.setNumber}
                            setData={currentSetData} // Datos introducidos
                            exerciseId={exercise.exerciseId}
                            onSetChange={onSetChange}
                            onCompleteSet={onCompleteSet}
                            lastPerformanceSet={lastPerformanceSets[index]}
                            targetReps={setInfo.reps} // <-- Pasa las reps de la rutina como target
                            preferences={preferences}
                            onRemoveSet={onRemoveSet}
                            onCopyLastPerformance={onCopyLastPerformance}
                        />
                    );
                })}
            </div>
            {/* Botón Añadir Serie */}
            <div className="mt-4"> <button onClick={() => onAddSet(exercise.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline"> <PlusCircle size={16} /> Agregar Serie </button> </div>
        </div>
    );
});


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
    //const { showUndoBar } = useUndoContext();

    const {
        sessionExercises, setSessionExercises, loading: managerLoading, error: managerError,
        isAddExerciseModalOpen, setIsAddExerciseModalOpen,
        handleAddSet: addSetToSessionExercises,
        handleRemoveSet: removeSetFromSessionExercises,
        handleDeleteExercise: deleteExerciseFromSessionExercises,
        handleAddOrReplaceExercise, openReplaceModal, openAddModal
    } = useSessionManager(routineId);

    // useEffect para inicializar workoutData (Asegura que 'reps' en workoutData sea '' inicialmente)
    useEffect(() => {
        if (!managerLoading && sessionExercises.length > 0) {
            setWorkoutData(prevData => {
                const newData = { ...prevData };
                let needsUpdate = false;
                sessionExercises.forEach(ex => {
                    if (!newData[ex.exerciseId]) { newData[ex.exerciseId] = {}; needsUpdate = true; }
                    ex.sets.forEach(set => {
                        if (!newData[ex.exerciseId][set.setNumber]) {
                            newData[ex.exerciseId][set.setNumber] = {
                                id: set.id, setNumber: set.setNumber, weight: '', reps: '', // <-- INICIA VACÍO
                                effort: '', completed: false, note: '', isPR: false
                            }; needsUpdate = true;
                        } else if (newData[ex.exerciseId][set.setNumber].id !== set.id) {
                             newData[ex.exerciseId][set.setNumber].id = set.id; needsUpdate = true;
                        }
                        // Aseguramos que 'reps' exista aunque sea vacío
                        if(newData[ex.exerciseId][set.setNumber].reps === undefined || newData[ex.exerciseId][set.setNumber].reps === null) {
                            newData[ex.exerciseId][set.setNumber].reps = '';
                            needsUpdate = true;
                        }
                    });
                     Object.keys(newData[ex.exerciseId] || {}).forEach(setNumStr => {
                         if (!ex.sets.some(s => s.setNumber === parseInt(setNumStr, 10))) { delete newData[ex.exerciseId][setNumStr]; needsUpdate = true; }
                     });
                });
                 Object.keys(newData).forEach(exId => {
                     if (!sessionExercises.some(ex => ex.exerciseId === exId)) { delete newData[exId]; needsUpdate = true; }
                 });
                const finalNeedsUpdate = JSON.stringify(newData) !== JSON.stringify(prevData);
                return finalNeedsUpdate ? newData : prevData;
            });
            if (typeof resetSessionPRs === 'function') { resetSessionPRs(); }
        }
    }, [sessionExercises, managerLoading, resetSessionPRs]);


    // Callbacks que modifican workoutData
    const handleSetChange = useCallback((exerciseId, setNumber, field, value) => {
        setWorkoutData(prevData => {
            const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber }; // Usa ID existente o genera si es nuevo
            const newData = {
                ...prevData,
                [exerciseId]: {
                    ...prevData[exerciseId],
                    [setNumber]: { ...currentSetData, [field]: value }
                }
            };
            // Lógica de PR
            if ((field === 'weight' || field === 'reps')) {
                 const updatedSetData = newData[exerciseId][setNumber];
                 const weight = parseFloat(updatedSetData.weight);
                 const repsValue = String(updatedSetData.reps);
                 const repsMatch = repsValue.match(/^\d+/);
                 const reps = repsMatch ? parseInt(repsMatch[0], 10) : NaN;
                 const isNewPR = !isNaN(reps) && typeof checkIsPR === 'function' ? checkIsPR(exerciseId, reps, weight) : false;
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

    // Callback para Copiar Última Performance
     const handleCopyLastPerformance = useCallback((exerciseId, setNumber, lastPerfSet) => {
         if (!lastPerfSet) return;
         setWorkoutData(prevData => {
             const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
             const updatedSet = {
                 ...currentSetData,
                 weight: lastPerfSet.weight !== undefined ? String(lastPerfSet.weight) : '',
                 reps: lastPerfSet.reps !== undefined ? String(lastPerfSet.reps) : '',
                 // Resetea otros campos al copiar
                 completed: false, effort: '', note: '', isPR: false,
             };
             // Recalcular PR
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


    // Callbacks que modifican sessionExercises Y activan Undo
    const handleAddSet = useCallback((exerciseId) => { addSetToSessionExercises(exerciseId); }, [addSetToSessionExercises]);

    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        const workoutDataBeforeDelete = { ...workoutData };
        const removedSetInfo = removeSetFromSessionExercises(exerciseId, setIdToRemove);
        if (removedSetInfo) {
            setWorkoutData(prevData => {
                const exerciseSets = { ...prevData[exerciseId] };
                if (removedSetInfo.set && removedSetInfo.set.setNumber !== undefined) { delete exerciseSets[removedSetInfo.set.setNumber]; }
                if (Object.keys(exerciseSets).length === 0) { const newData = { ...prevData }; delete newData[exerciseId]; return newData; }
                return { ...prevData, [exerciseId]: exerciseSets };
            });
            const restoreAction = () => {
                setSessionExercises(prevExercises =>
                    prevExercises.map(ex => {
                        if (ex.exerciseId === removedSetInfo.exerciseId) {
                            const newSets = [...ex.sets];
                            newSets.splice(removedSetInfo.index, 0, removedSetInfo.set);
                            const renumberedSets = newSets.map((set, index) => ({ ...set, setNumber: index + 1 }));
                            return { ...ex, sets: renumberedSets };
                        } return ex;
                    })
                );
                setWorkoutData(workoutDataBeforeDelete);
            };
            //showUndoBar("Serie eliminada.", restoreAction);
        }
    }, /*removeSetFromSessionExercises, showUndoBar, setSessionExercises, workoutData*/);


    const handleDeleteExercise = useCallback((exerciseId) => {
        setExerciseIdToDelete(exerciseId);
        setIsDeleteExerciseConfirmationOpen(true);
    }, []);

    const confirmDeleteExercise = useCallback(() => {
        const exercisesBeforeDelete = [...sessionExercises];
        const workoutDataBeforeDelete = { ...workoutData };
        deleteExerciseFromSessionExercises(exerciseIdToDelete);
        setWorkoutData(prevData => { const newData = { ...prevData }; delete newData[exerciseIdToDelete]; return newData; });
        setIsDeleteExerciseConfirmationOpen(false);
        const restoreExerciseAction = () => {
            setSessionExercises(exercisesBeforeDelete);
            setWorkoutData(workoutDataBeforeDelete);
        };
        //showUndoBar("Ejercicio eliminado.", restoreExerciseAction);
        setExerciseIdToDelete(null);
    }, [exerciseIdToDelete, deleteExerciseFromSessionExercises, /*showUndoBar*/, setSessionExercises, sessionExercises, workoutData]);


    // Finalizar/Cancelar
    const handleFinishWorkout = useCallback(async () => {
        if (!user) { alert("Error: Usuario no autenticado."); return; }
        setIsFinishConfirmationOpen(false);
        setIsSaving(true);
        try {
             const exercisesToSave = Object.entries(workoutData)
                 .map(([exerciseId, setsData]) => {
                     const baseExercise = sessionExercises.find(ex => ex.exerciseId === exerciseId);
                     if (!baseExercise) return null;
                     const validSets = Object.values(setsData)
                         .filter(setData => setData && (setData.weight || setData.reps || setData.effort || setData.completed || setData.note))
                         .map(setData => ({
                             set: setData.setNumber,
                             weight: parseFloat(setData.weight) || 0,
                             reps: /^\d+$/.test(String(setData.reps)) ? parseInt(setData.reps, 10) : String(setData.reps), // Guarda string si no es número
                             effort: setData.effort || '',
                             completed: setData.completed || false,
                             note: setData.note || '',
                             isPR: setData.isPR || false,
                         }))
                         .sort((a, b) => a.set - b.set);
                     if (validSets.length === 0) return null;
                     return {
                         exerciseId, exerciseName: baseExercise.exerciseName,
                         variationName: baseExercise.variationName, isUnilateral: baseExercise.isUnilateral,
                         supersetId: baseExercise.supersetId, supersetOrder: baseExercise.supersetOrder,
                         sets: validSets
                     };
                 })
                 .filter(ex => ex !== null);
            if (exercisesToSave.length === 0) {
                 alert("No has registrado ningún dato en esta sesión."); setIsSaving(false); return;
            }
            const sessionId = await saveWorkoutSession(user.uid, routineId, routineDoc?.name || 'Entrenamiento', exercisesToSave);
            navigate(`/historial/${sessionId}`);
        } catch (error) {
            console.error("Error al guardar sesión:", error);
            alert("Hubo un error al guardar la sesión.");
            setIsSaving(false);
        }
    }, [workoutData, sessionExercises, user, routineId, routineDoc?.name, navigate]);

    const handleCancelWorkout = () => {
        setIsCancelConfirmationOpen(false);
        navigate('/rutinas');
    };


    // Estados combinados de carga y error
    const isLoading = routineLoading || managerLoading || isLastPerformanceLoading || isPRLoading;
    const hasError = managerError;
    if (!user && !isLoading) { return <ThemedLoader />; }
    if (isLoading) return <ThemedLoader />;
    if (hasError) return <Card><p className="text-red-500">{hasError}</p></Card>;
    if (!sessionExercises) { return <ThemedLoader />; }


    // --- RENDERIZADO ---
    return (
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
                            const lastPerfSets = typeof getLastPerformance === 'function' ? getLastPerformance(ex.exerciseId) : [];
                            return (
                                <ExerciseCard
                                    key={ex.exerciseId}
                                    exercise={ex} // Datos base del ejercicio (incluye sets con target reps)
                                    exerciseWorkoutData={workoutData[ex.exerciseId] || {}} // Datos introducidos
                                    preferences={preferences}
                                    onSetChange={handleSetChange}
                                    onCompleteSet={handleCompleteSet}
                                    onAddSet={handleAddSet}
                                    onRemoveSet={handleRemoveSet}
                                    // onAddNote se maneja en SetRow
                                    onDeleteExercise={handleDeleteExercise}
                                    onReplaceExercise={openReplaceModal}
                                    lastPerformanceSets={lastPerfSets}
                                    onCopyLastPerformance={handleCopyLastPerformance} // Pasa nuevo callback
                                />
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-8">Cargando ejercicios o la rutina está vacía. Añade uno si es necesario.</p>
                    )}
                </div>
                {/* Botón Añadir Ejercicio */}
                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4"> <button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-2 text-blue-500 hover:underline" > <PlusCircle size={18} /> Agregar Ejercicio a la Sesión </button> </div>
            </Card>

            {/* La UndoBar se renderiza globalmente */}
        </div>
    );
}