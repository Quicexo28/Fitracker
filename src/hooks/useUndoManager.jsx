import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar react-hot-toast
import { RotateCcw } from 'lucide-react'; // Icono para el botón

// Necesitarás tus funciones de restauración aquí
import { restoreDeletedSession /*, ... */ } from '../firebase/sessionService'; // ¡Hipotético!

// Tipos de acción (exportados para usar en componentes)
export const UndoActionTypes = {
    DELETE_SET: 'DELETE_SET',
    DELETE_EXERCISE: 'DELETE_EXERCISE',
    DELETE_SESSION: 'DELETE_SESSION',
};

// Funciones de restauración
const actionRestorers = {
    [UndoActionTypes.DELETE_SET]: (payload, stateSetters) => {
        const { exerciseId, setInfo, exerciseIndex, setIndex } = payload;
        const { setSessionExercises, setWorkoutData } = stateSetters;
        if (!setSessionExercises || !setWorkoutData) return;

        setSessionExercises(prevExercises => {
            const updatedExercises = [...prevExercises];
            if (updatedExercises[exerciseIndex]?.exerciseId === exerciseId) {
                const updatedSets = [...updatedExercises[exerciseIndex].sets];
                updatedSets.splice(setIndex, 0, setInfo);
                updatedExercises[exerciseIndex] = {
                    ...updatedExercises[exerciseIndex],
                    sets: updatedSets.map((s, i) => ({ ...s, setNumber: i + 1 }))
                };
            }
            return updatedExercises;
        });

        if (payload.workoutDataBefore) {
             setWorkoutData(payload.workoutDataBefore);
        }
    },
    [UndoActionTypes.DELETE_EXERCISE]: (payload, stateSetters) => {
         const { exerciseInfo, index, workoutDataEntry } = payload;
         const { setSessionExercises, setWorkoutData } = stateSetters;
         if (!setSessionExercises || !setWorkoutData) return;

         setSessionExercises(prev => {
             const updated = [...prev];
             updated.splice(index, 0, exerciseInfo);
             return updated;
         });

         if (workoutDataEntry) {
             setWorkoutData(prev => ({
                 ...prev,
                 [exerciseInfo.exerciseId]: workoutDataEntry
             }));
         }
    },
    [UndoActionTypes.DELETE_SESSION]: async (payload, stateSetters) => {
        const { sessionId, sessionData } = payload;
        const { refetchSessions, user } = stateSetters;
        if (!user || !sessionId || !sessionData) return;

        try {
            await restoreDeletedSession(user.uid, sessionId, sessionData); // ¡Necesitas implementar esto!
            if (refetchSessions) refetchSessions();
            toast.success('Sesión restaurada.'); // Notificación de éxito
        } catch (error) {
            console.error("Error al restaurar sesión en Firestore:", error);
            toast.error("No se pudo deshacer la eliminación.");
        }
    },
};


// El Hook Principal
export function useUndoManager(stateSetters, timeoutDuration = 5000) {
    // stateSetters: { setSessionExercises, setWorkoutData, refetchSessions, user }

    const [lastAction, setLastAction] = useState(null); // { type, payload, toastId }
    const timeoutRef = useRef(null);
    const currentToastIdRef = useRef(null); // Guarda el ID del toast activo

    // Limpia el estado y descarta el toast actual
    const clearUndoState = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (currentToastIdRef.current) {
            toast.dismiss(currentToastIdRef.current); // Descarta el toast si existe
            currentToastIdRef.current = null;
        }
        setLastAction(null);
    }, []);

    // Función para ejecutar el deshacer (llamada desde el botón del toast)
    const performUndo = useCallback(() => {
        if (!lastAction) return;

        const restoreFn = actionRestorers[lastAction.type];
        if (typeof restoreFn === 'function') {
            try {
                restoreFn(lastAction.payload, stateSetters);
                console.log(`Undo: Acción '${lastAction.type}' deshecha.`);
                // toast.success('Acción deshecha'); // Puedes añadir un toast de éxito si quieres
            } catch (error) {
                console.error(`Error al deshacer la acción '${lastAction.type}':`, error);
                toast.error('Error al deshacer la acción.');
            }
        } else {
            console.warn(`Undo: No se encontró función de restauración para '${lastAction.type}'.`);
        }

        clearUndoState(); // Limpia estado y descarta toast después de intentar deshacer

    }, [lastAction, stateSetters, clearUndoState]);


    // Función para registrar una acción deshacible y mostrar el toast
    const addUndoAction = useCallback((actionType, message, payload) => {
        // Limpia cualquier undo anterior y su toast
        clearUndoState();

        // Muestra el nuevo toast CON botón
        const toastId = toast(
            (t) => ( // 't' es el objeto del toast que nos da react-hot-toast
                <div className="flex items-center justify-between gap-4 w-full">
                    <span>{message}</span>
                    <button
                        onClick={() => {
                            performUndo(); // Ejecuta la lógica de deshacer
                            // toast.dismiss(t.id); // performUndo ya descarta el toast
                        }}
                        className="flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 ml-2 shrink-0" // shrink-0 evita que el botón se encoja
                    >
                        <RotateCcw size={16} />
                        Deshacer
                    </button>
                </div>
            ),
            {
                duration: timeoutDuration, // Duración automática
                // Puedes personalizar estilos aquí si lo necesitas
                // className: 'your-custom-toast-class',
            }
        );

        // Guarda la información de la acción y el ID del toast
        setLastAction({ type: actionType, payload, toastId });
        currentToastIdRef.current = toastId; // Guarda el ID del toast actual

        // Inicia el temporizador para limpiar el *estado* (lastAction)
        // cuando el toast expire (o sea descartado manualmente)
        timeoutRef.current = setTimeout(() => {
            // console.log("Timeout Undo: Acción confirmada.");
            setLastAction(null); // Limpia solo la acción guardada
            currentToastIdRef.current = null; // Limpia la ref del ID del toast
        }, timeoutDuration);

    }, [clearUndoState, timeoutDuration, performUndo]); // performUndo añadido


    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            clearUndoState(); // Asegura limpiar todo al salir
        };
    }, [clearUndoState]);

    // El hook solo necesita exponer la función para añadir acciones
    return { addUndoAction };
}