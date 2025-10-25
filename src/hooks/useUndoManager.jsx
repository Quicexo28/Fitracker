import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast'; // Importar react-hot-toast
import { RotateCcw } from 'lucide-react'; // Icono para el botón

// Importa tu función de restauración de Firebase (asegúrate de que exista y funcione)
// Debes crear esta función en sessionService.js si aún no existe.
// import { restoreDeletedSession } from '../firebase/sessionService';

// --- Placeholder para restoreDeletedSession si aún no la has creado ---
// --- ¡RECUERDA REEMPLAZAR ESTO CON TU IMPLEMENTACIÓN REAL! ---
const restoreDeletedSession = async (userId, sessionId, sessionData) => {
    console.warn("restoreDeletedSession no implementado. Simulando restauración...");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
    console.log("Simulación: Sesión restaurada (Firestore):", userId, sessionId, sessionData);
    // Aquí iría la lógica real con setDoc
    // import { doc, setDoc } from 'firebase/firestore';
    // import { db } from './config'; // Asegúrate de importar db
    // const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
    // await setDoc(sessionDocRef, sessionData);
};
// --- Fin del Placeholder ---


// Tipos de acción (exportados para usar en componentes)
export const UndoActionTypes = {
    DELETE_SET: 'DELETE_SET',
    DELETE_EXERCISE: 'DELETE_EXERCISE',
    DELETE_SESSION: 'DELETE_SESSION',
};

// Funciones de restauración (esperan setters en el payload)
const actionRestorers = {
    [UndoActionTypes.DELETE_SET]: (payload) => {
        const { exerciseId, setInfo, exerciseIndex, setIndex, workoutDataBefore, setSessionExercises, setWorkoutData } = payload;
        if (!setSessionExercises || !setWorkoutData) {
            console.error("Undo Error: Faltan setters en el payload para DELETE_SET.");
            toast.error('Error interno al deshacer (setters).'); // Feedback al usuario
            return;
        }
        setSessionExercises(prevExercises => {
            const updatedExercises = [...prevExercises];
            // Verifica si el índice y el ID coinciden por seguridad
            if (updatedExercises[exerciseIndex]?.exerciseId === exerciseId) {
                const updatedSets = [...updatedExercises[exerciseIndex].sets];
                updatedSets.splice(setIndex, 0, setInfo); // Inserta el set de nuevo
                updatedExercises[exerciseIndex] = {
                    ...updatedExercises[exerciseIndex],
                    // Renumera los sets después de la inserción
                    sets: updatedSets.map((s, i) => ({ ...s, setNumber: i + 1 }))
                };
                 return updatedExercises;
            }
             console.warn("Undo Warning: El índice o ID del ejercicio no coincide al restaurar set.");
             toast.error('Error al deshacer: Inconsistencia de datos.');
            return prevExercises; // Devuelve sin cambios si algo no cuadra
        });
        if (workoutDataBefore) {
             setWorkoutData(workoutDataBefore);
        } else {
             console.warn("Undo Warning: No se encontró workoutDataBefore para restaurar DELETE_SET.");
             // Considera si necesitas mostrar un error al usuario aquí también
        }
    },
    [UndoActionTypes.DELETE_EXERCISE]: (payload) => {
         const { exerciseInfo, index, workoutDataBefore, setSessionExercises, setWorkoutData } = payload;
         if (!setSessionExercises || !setWorkoutData) {
             console.error("Undo Error: Faltan setters en el payload para DELETE_EXERCISE.");
             toast.error('Error interno al deshacer (setters).');
             return;
         }
         setSessionExercises(prev => {
             const updated = [...prev];
             updated.splice(index, 0, exerciseInfo); // Inserta el ejercicio
             return updated;
         });
         if (workoutDataBefore) {
            setWorkoutData(workoutDataBefore);
         } else {
            console.warn("Undo Warning: No se encontró workoutDataBefore para restaurar DELETE_EXERCISE.");
            // Considera error al usuario
         }
    },
    [UndoActionTypes.DELETE_SESSION]: async (payload) => {
        const { sessionId, sessionData, user, refetchSessions } = payload;
        if (!user || !sessionId || !sessionData) {
             console.error("Undo Error: Faltan datos en el payload para DELETE_SESSION.");
             toast.error('Error interno al deshacer (datos).');
             return;
        }
        try {
            await restoreDeletedSession(user.uid, sessionId, sessionData); // Llama a la función de Firebase
            toast.success('Sesión restaurada.');
            if (refetchSessions) refetchSessions(); // Refresca la lista
        } catch (error) {
            console.error("Error al restaurar sesión en Firestore:", error);
            toast.error("No se pudo deshacer la eliminación.");
        }
    },
};

// El Hook Principal (ya no recibe stateSetters al inicio)
export function useUndoManager(timeoutDuration = 5000) {
    const [lastActionMeta, setLastActionMeta] = useState(null); // { toastId } - Metadatos de la última acción *activa* para deshacer
    const timeoutRef = useRef(null);
    const currentToastIdRef = useRef(null); // ID del toast *actualmente visible* asociado a lastActionMeta

    // Limpia el estado meta y el temporizador asociado
    const clearUndoState = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // No descartamos el toast aquí, solo el estado interno
        currentToastIdRef.current = null;
        setLastActionMeta(null);
    }, []);

    // Función para ejecutar el deshacer (llamada desde el botón del toast)
    // Recibe la acción específica ({ type, payload, toastId }) asociada a ESE toast
    const performUndo = useCallback((actionToUndo) => {
        if (!actionToUndo) return;

        const restoreFn = actionRestorers[actionToUndo.type];
        if (typeof restoreFn === 'function') {
            try {
                // Llama a la restauración pasando el payload específico de esa acción
                restoreFn(actionToUndo.payload);
                console.log(`Undo: Acción '${actionToUndo.type}' deshecha.`);
                // Opcional: toast.success('Acción deshecha');
            } catch (error) {
                console.error(`Error al deshacer la acción '${actionToUndo.type}':`, error);
                toast.error('Error al deshacer la acción.');
            }
        } else {
            console.warn(`Undo: No se encontró función de restauración para '${actionToUndo.type}'.`);
        }

        // Si la acción deshecha era la "última activa", limpia el estado meta
        if (actionToUndo.toastId === currentToastIdRef.current) {
             clearUndoState();
        }
         // Siempre descarta el toast en el que se hizo clic
         toast.dismiss(actionToUndo.toastId);

    }, [clearUndoState]); // clearUndoState como dependencia


    // Función para registrar una acción deshacible y mostrar el toast
    const addUndoAction = useCallback((actionType, message, payload) => {
        // Limpia el temporizador y estado meta anterior *antes* de crear el nuevo toast.
        // Esto asegura que solo la *última* acción registrada pueda ser deshecha.
        clearUndoState();

        // Guarda la acción actual (type + payload) para pasarla al onClick del toast
        const currentActionPayload = { type: actionType, payload };

        const toastId = toast(
            (t) => { // 't' es el objeto toast proporcionado por react-hot-toast
                // Construye el objeto completo de la acción para este toast específico
                 const actionForThisToast = { ...currentActionPayload, toastId: t.id };
                 return (
                    <div className="flex items-center justify-between gap-4 w-full">
                        <span>{message}</span>
                        <button
                            onClick={() => {
                                // Llama a performUndo con los datos de *esta* acción específica
                                performUndo(actionForThisToast);
                            }}
                            className="flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1 ml-2 shrink-0"
                        >
                            <RotateCcw size={16} />
                            Deshacer
                        </button>
                    </div>
                 );
            },
            {
                duration: timeoutDuration, // El toast se oculta automáticamente
                id: `undo-${Date.now()}-${Math.random()}` // ID único para el toast
            }
        );

        // Guarda metadatos de esta acción como la "última activa"
        setLastActionMeta({ toastId });
        currentToastIdRef.current = toastId;

        // Inicia el temporizador. Si expira, limpia el estado meta (ya no se puede deshacer)
        timeoutRef.current = setTimeout(() => {
            // Solo limpia si este toast es todavía el último activo registrado
            if (currentToastIdRef.current === toastId) {
                // console.log("Timeout Undo: Acción confirmada (estado meta limpiado).");
                setLastActionMeta(null);
                currentToastIdRef.current = null;
            }
        }, timeoutDuration);

    }, [clearUndoState, timeoutDuration, performUndo]);


    // Limpieza al desmontar el componente que usa el hook
    useEffect(() => {
        return () => {
            clearUndoState(); // Limpia estado meta y temporizador
             // También descarta cualquier toast visible al desmontar (opcional pero recomendable)
             if (currentToastIdRef.current) {
                 toast.dismiss(currentToastIdRef.current);
             }
        };
    }, [clearUndoState]);

    // Expone solo la función para añadir acciones
    return { addUndoAction };
}