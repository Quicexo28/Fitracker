import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePreferences } from '../context/PreferencesContext.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useSessionManager from '../hooks/useSessionManager.jsx';
import useLastPerformance from '../hooks/useLastPerformance.jsx'; // Hook para última performance
import usePersonalRecords from '../hooks/usePersonalRecords.jsx'; // Hook para PRs
import useUndo from '../hooks/useUndo.jsx';
import { saveWorkoutSession } from '../firebase/sessionService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import AddExerciseToRoutineModal from '../components/AddExerciseToRoutineModal.jsx';
import RestTimer from '../components/RestTimer.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import UndoBar from '../components/UndoBar.jsx';
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
        if (note !== null) { // Si el usuario no cancela
            onAddNote(exerciseId, setInfo.setNumber, note);
        }
    };

    return (
        <div className={`grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] items-center gap-2 p-2 rounded-lg ${isCompleted ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
            {/* Número de Serie */}
            <span className="font-bold text-center pr-2 relative">
                {setInfo.setNumber}
                {isCurrentPR && <Award size={14} className="absolute -top-1 -right-1 text-yellow-500" title="¡Nuevo PR!" />}
            </span>

            {/* Input Peso */}
            <input
                type="number"
                name="weight"
                value={setInfo.weight} // Controlado
                placeholder={lastPerformanceSet?.weight ?? '-'}
                onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'weight', e.target.value)}
                className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center"
            />

            {/* Input Reps */}
            <input
                type="number"
                name="reps"
                value={setInfo.reps} // Controlado
                placeholder={lastPerformanceSet?.reps ?? '-'}
                onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'reps', e.target.value)}
                className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center"
            />

            {/* Select Esfuerzo */}
            <select
                name="effort"
                value={setInfo.effort} // Controlado
                onChange={(e) => onSetChange(exerciseId, setInfo.setNumber, 'effort', e.target.value)}
                className="w-full p-2 bg-gray-200 dark:bg-gray-600 rounded-md text-center"
            >
                <option value="">{preferences?.effortMetric?.toUpperCase() || 'RIR/RPE'}</option>
                {preferences?.effortMetric === 'rir' ?
                    rirOptions.map(opt => <option key={opt} value={opt}>{opt}</option>) :
                    rpeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            {/* Botón Nota */}
            <button onClick={handleNoteClick} className="flex justify-center p-1 text-gray-500 hover:text-blue-500 relative">
                 <Info size={16} />
                 {setInfo.note && <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-700"></span>}
            </button>

            {/* Botón Completar */}
            <button onClick={toggleComplete} className="flex justify-center p-1">
                {isCompleted ? <CheckCircle className="text-green-500"/> : <Square className="text-gray-400"/>}
            </button>

            {/* Botón Eliminar Serie */}
            <button onClick={() => onRemoveSet(exerciseId, setInfo.id)} className="flex justify-center p-1 text-red-500 hover:text-red-400">
                <Trash2 size={16} />
            </button>
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

            {/* Cabecera de Sets */}
            <div className="grid grid-cols-[auto,1fr,1fr,1fr,auto,auto,auto] gap-2 text-xs font-semibold text-center mb-2 px-1 text-gray-500 dark:text-gray-400">
                <span>#</span>
                <span>Peso ({preferences?.weightUnit?.toUpperCase() || 'KG'})</span>
                <span>Reps</span>
                <span className="uppercase">{preferences?.effortMetric || 'RIR'}</span>
                <span>Nota</span>
                <span></span>{/* Completado */}
                <span></span>{/* Borrar */}
            </div>

            {/* Lista de Sets */}
            <div className="space-y-2">
                {exercise.sets.map((setInfo, index) => (
                    <SetRow
                        key={setInfo.id}
                        setInfo={setInfo}
                        exerciseId={exercise.exerciseId}
                        onSetChange={onSetChange}
                        onCompleteSet={onCompleteSet}
                        lastPerformanceSet={lastPerformanceSets[index]} // Pasa la última performance para este set
                        prInfo={prInfo} // Pasa info de PRs
                        preferences={preferences}
                        onRemoveSet={onRemoveSet}
                        onAddNote={onAddNote}
                        onTogglePR={onTogglePR} // Pasar función para marcar/desmarcar PR
                        isCurrentPR={setInfo.isPR} // Pasar si el set actual es un PR
                    />
                ))}
            </div>

            {/* Botón Añadir Serie */}
            <div className="mt-4">
                <button onClick={() => onAddSet(exercise.exerciseId)} className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                    <PlusCircle size={16} /> Agregar Serie
                </button>
            </div>
        </div>
    );
};


// --- Vista Principal ---
export default function CreateSessionView() {
    const { routineId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Obtener user del contexto
    const { preferences } = usePreferences();
    const [workoutData, setWorkoutData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFinishConfirmationOpen, setIsFinishConfirmationOpen] = useState(false);
    const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] = useState(false);
    const [isDeleteExerciseConfirmationOpen, setIsDeleteExerciseConfirmationOpen] = useState(false);
    const [exerciseIdToDelete, setExerciseIdToDelete] = useState(null);

    // Asegúrate de que routinePath solo se calcule si 'user' existe
    const routinePath = useMemo(() => user ? `users/${user.uid}/routines/${routineId}` : null, [user, routineId]);

    const { document: routineDoc, loading: routineLoading } = useFirestoreDocument(routinePath);

    // --- CORRECCIÓN CLAVE ---
    // Desestructurar correctamente el resultado de useLastPerformance
    const { getLastPerformance, isLoading: isLastPerformanceLoading } = useLastPerformance();
    // --- FIN CORRECCIÓN CLAVE ---

    const { checkIsPR, trackNewPR, resetSessionPRs, isLoading: isPRLoading } = usePersonalRecords();

    const {
        sessionExercises,
        setSessionExercises,
        loading: managerLoading,
        error: managerError,
        isAddExerciseModalOpen,
        setIsAddExerciseModalOpen,
        handleAddSet,
        handleRemoveSet: removeSetFromState,
        handleDeleteExercise: deleteExerciseFromState,
        handleAddOrReplaceExercise,
        openReplaceModal,
        openAddModal
    } = useSessionManager(routineId);

    const { isActive: showUndo, startUndo, undo } = useUndo();

    // useEffect para inicializar workoutData
    useEffect(() => {
        if (!managerLoading && sessionExercises.length > 0) {
            const initialData = {};
            sessionExercises.forEach(ex => {
                initialData[ex.exerciseId] = {};
                ex.sets.forEach(set => {
                    // Solo inicializa si no existe ya para no sobrescribir datos introducidos
                    if (!workoutData[ex.exerciseId]?.[set.setNumber]) {
                         initialData[ex.exerciseId][set.setNumber] = { ...set, completed: false, note: '', isPR: false };
                    } else {
                         initialData[ex.exerciseId][set.setNumber] = workoutData[ex.exerciseId][set.setNumber];
                    }
                });
            });
            // Solo actualiza si hay cambios para evitar bucles infinitos
            if (JSON.stringify(initialData) !== JSON.stringify(workoutData)) {
                 setWorkoutData(initialData);
            }
            // Resetea los PRs de sesión al iniciar (solo si resetSessionPRs es una función)
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
                    [setNumber]: {
                        ...currentSetData,
                        [field]: value
                    }
                }
            };

            // Comprobar si es un nuevo PR al cambiar peso o reps
            if ((field === 'weight' || field === 'reps')) {
                 const updatedSetData = newData[exerciseId][setNumber];
                 const weight = parseFloat(updatedSetData.weight);
                 const reps = parseInt(updatedSetData.reps, 10);

                 // Verifica si checkIsPR es una función antes de llamarla
                 const isNewPR = typeof checkIsPR === 'function' ? checkIsPR(exerciseId, reps, weight) : false;

                 if (isNewPR) {
                     newData[exerciseId][setNumber].isPR = true;
                      // Verifica si trackNewPR es una función antes de llamarla
                      if (typeof trackNewPR === 'function') trackNewPR(exerciseId, reps, weight);
                 } else {
                     newData[exerciseId][setNumber].isPR = false;
                 }
            }
            return newData;
        });
    }, [checkIsPR, trackNewPR]); // Asegúrate de que las dependencias sean correctas

    const handleCompleteSet = useCallback((exerciseId, setNumber, isCompleted) => {
        setWorkoutData(prevData => {
            const currentSetData = prevData[exerciseId]?.[setNumber] || { id: uuidv4(), setNumber };
            return {
                ...prevData,
                [exerciseId]: {
                    ...prevData[exerciseId],
                    [setNumber]: { ...currentSetData, completed: isCompleted }
                }
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
                [exerciseId]: {
                    ...prevData[exerciseId],
                    [setNumber]: { ...currentSet, isPR: !currentSet.isPR }
                }
             };
         });
    }, []);

    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        const removedSetInfo = removeSetFromState(exerciseId, setIdToRemove);
        if (removedSetInfo) {
            setWorkoutData(prevData => {
                const exerciseSets = { ...prevData[exerciseId] };
                delete exerciseSets[removedSetInfo.set.setNumber]; // Elimina por número de set
                return { ...prevData, [exerciseId]: exerciseSets };
            });
            startUndo(removedSetInfo); // Inicia el contador para deshacer
        }
    }, [removeSetFromState, startUndo]);

    const handleUndoRemoveSet = useCallback(() => {
        const restoredInfo = undo(); // Obtiene la info del set restaurado
        if (!restoredInfo) return;

        // Vuelve a añadir el set a sessionExercises
        setSessionExercises(prevExercises =>
            prevExercises.map(ex => {
                if (ex.exerciseId === restoredInfo.exerciseId) {
                    const newSets = [...ex.sets];
                    newSets.splice(restoredInfo.index, 0, restoredInfo.set); // Inserta en la posición original
                    // Renumera los sets en sessionExercises
                    const renumberedSets = newSets.map((set, index) => ({ ...set, setNumber: index + 1 }));
                    return { ...ex, sets: renumberedSets };
                }
                return ex;
            })
        );

        // Restaura los datos en workoutData (si existían)
        setWorkoutData(prevData => ({
             ...prevData,
             [restoredInfo.exerciseId]: {
                 ...prevData[restoredInfo.exerciseId],
                 [restoredInfo.set.setNumber]: { ...restoredInfo.set } // Usa el número de set original
             }
         }));

    }, [undo, setSessionExercises]);


    const handleDeleteExercise = useCallback((exerciseId) => {
        setExerciseIdToDelete(exerciseId);
        setIsDeleteExerciseConfirmationOpen(true);
    }, []);

    const confirmDeleteExercise = useCallback(() => {
        deleteExerciseFromState(exerciseIdToDelete); // Llama al manager
        // Limpia datos de workoutData para el ejercicio eliminado
        setWorkoutData(prevData => {
            const newData = { ...prevData };
            delete newData[exerciseIdToDelete];
            return newData;
        });
        setIsDeleteExerciseConfirmationOpen(false);
        setExerciseIdToDelete(null);
    }, [exerciseIdToDelete, deleteExerciseFromState]);


    // Finalizar/Cancelar (con guardia para 'user')
    const handleFinishWorkout = useCallback(async () => {
        // Guardia: Asegura que el usuario esté cargado
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
                     .map(setInfo => workoutData[ex.exerciseId]?.[setInfo.setNumber]) // Obtiene los datos ingresados
                     .filter(setData => setData && (setData.weight || setData.reps || setData.effort || setData.completed || setData.note)) // Filtra sets vacíos no completados
                     .map(setData => ({ // Mapea al formato de guardado
                         set: setData.setNumber,
                         weight: parseFloat(setData.weight) || 0,
                         reps: parseInt(setData.reps, 10) || 0,
                         effort: setData.effort || '',
                         completed: setData.completed || false,
                         note: setData.note || '',
                         isPR: setData.isPR || false,
                     }))
             })).filter(ex => ex.sets.length > 0); // Filtra ejercicios sin sets válidos


            if (exercisesToSave.length === 0) {
                 alert("No has registrado ningún dato en esta sesión.");
                 setIsSaving(false);
                 return;
            }

            // Ahora sabemos que 'user.uid' existe
            const sessionId = await saveWorkoutSession(user.uid, routineId, routineDoc?.name || 'Entrenamiento', exercisesToSave);
            navigate(`/historial/${sessionId}`); // Redirige al detalle de la sesión guardada

        } catch (error) {
            console.error("Error al guardar sesión:", error);
            alert("Hubo un error al guardar la sesión.");
            setIsSaving(false); // Solo aquí si hay error
        }
        // No ponemos setIsSaving(false) aquí si navegamos
    }, [sessionExercises, workoutData, user, routineId, routineDoc?.name, navigate]); // Asegúrate que 'user' esté en las dependencias

    const handleCancelWorkout = () => {
        setIsCancelConfirmationOpen(false);
        navigate('/rutinas'); // O a donde quieras redirigir al cancelar
    };


    // Estados combinados de carga y error
    const isLoading = routineLoading || managerLoading || isLastPerformanceLoading || isPRLoading;
    const hasError = managerError;

    // Guardia: Si el usuario no está cargado aún (y no hay otro loading activo), muestra loader
    if (!user && !isLoading) { return <ThemedLoader />; }
    if (isLoading) return <ThemedLoader />;
    if (hasError) return <Card><p className="text-red-500">{hasError}</p></Card>;

    // --- RENDERIZADO ---
    return (
        <div className="relative min-h-screen pb-16">
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
                            // --- CORRECCIÓN CLAVE ---
                            // Verifica que getLastPerformance sea una función antes de llamarla
                            const lastPerfSets = typeof getLastPerformance === 'function'
                                ? getLastPerformance(ex.exerciseId)
                                : []; // Si no es función, devuelve array vacío como fallback
                            // --- FIN CORRECCIÓN CLAVE ---
                            return (
                                <ExerciseCard
                                    key={ex.exerciseId}
                                    exercise={ex}
                                    preferences={preferences}
                                    workoutData={workoutData[ex.exerciseId] || {}}
                                    onSetChange={handleSetChange}
                                    onCompleteSet={handleCompleteSet}
                                    onAddSet={handleAddSet}
                                    onRemoveSet={handleRemoveSet}
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
            {/* Barra de Deshacer */}
            <UndoBar isVisible={showUndo} onUndo={handleUndoRemoveSet} message="Serie eliminada." />
        </div>
    );
}