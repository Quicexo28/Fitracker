import { collection, addDoc, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore'; // Añade setDoc aquí
import { db } from './config.js';

const transformWorkoutData = (workoutData, exercises, prSets) => { 
    if (!workoutData) return [];
    return Object.keys(workoutData).map(exerciseId => {
        const exerciseLog = workoutData[exerciseId];
        const exerciseDetails = exercises.find(ex => ex.id === exerciseId || ex.exerciseId === exerciseId);
        const sets = exerciseLog ? Object.keys(exerciseLog).map(setNumber => {
            const setData = exerciseLog[setNumber] || {};
            const isPR = prSets.has(`${exerciseId}-${setNumber}`); 
            return {
                set: parseInt(setNumber, 10),
                weight: parseFloat(setData.weight) || 0,
                reps: parseInt(setData.reps, 10) || 0,
                effort: parseFloat(setData.effort) || 0,
                note: setData.note || '',
                isPR: isPR,
                completedLeft: setData.completedLeft || false,
                completedRight: setData.completedRight || false,
                completed: setData.completedLeft || (setData.completedLeft && setData.completedRight),
            };
        }).sort((a, b) => a.set - b.set) : [];
        
        return {
            exerciseId: exerciseId,
            exerciseName: exerciseDetails?.name || exerciseDetails?.exerciseName || 'Ejercicio Desconocido',
            isUnilateral: exerciseDetails?.isUnilateral || false,
            sets: sets
        };
    }).filter(ex => ex.sets.length > 0);
};

export const saveWorkoutSession = async (userId, routineId, rawWorkoutData, exercises, prSets) => {
    console.log("Iniciando guardado de sesión...");
    if (!userId || !routineId) {
        console.error("Error Crítico: Falta ID de usuario o de rutina.");
        throw new Error("Falta el ID de usuario o de rutina.");
    }

    try {
        const transformedData = transformWorkoutData(rawWorkoutData, exercises, prSets); 
        console.log("Datos de sesión transformados:", transformedData);

        if (transformedData.length === 0) {
            console.warn("No hay datos de series para guardar. Abortando.");
            throw new Error("No hay datos de series para guardar.");
        }

        const routineDocSnap = await getDoc(doc(db, `users/${userId}/routines/${routineId}`));
        
        const sessionData = {
            routineId: routineId,
            routineName: routineDocSnap.exists() ? routineDocSnap.data().name : 'Rutina Eliminada',
            completedAt: serverTimestamp(),
            exercises: transformedData,
        };

        console.log("Objeto final a guardar en Firestore:", sessionData);

        // --- CORRECCIÓN APLICADA: Unificamos el nombre a "sessions" ---
        const sessionCollectionRef = collection(db, `users/${userId}/sessions`);
        const docRef = await addDoc(sessionCollectionRef, sessionData);

        console.log("¡Éxito! Sesión guardada con ID:", docRef.id);
        return docRef;

    } catch (error) {
        console.error("--- ERROR DETALLADO AL GUARDAR EN FIRESTORE ---", error);
        throw error; // Re-lanza el error para que la UI lo capture
    }
};


export const deleteWorkoutSession = async (userId, sessionId) => {
    if (!userId || !sessionId) throw new Error("Falta el ID de usuario o de sesión.");
    const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
    await deleteDoc(sessionDocRef);
};

export const updateWorkoutSession = async (userId, sessionId, rawWorkoutData, exercises) => {
    if (!userId || !sessionId) throw new Error("Falta el ID de usuario o de sesión.");
    const transformedData = transformWorkoutData(rawWorkoutData, exercises, new Set());
    const updatedSessionData = {
        exercises: transformedData,
        lastUpdated: serverTimestamp()
    };
    const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
    await updateDoc(sessionDocRef, updatedSessionData);
};
/**
 * Restaura una sesión previamente eliminada en Firestore usando su ID original.
 * @param {string} userId - El ID del usuario.
 * @param {string} sessionId - El ID original de la sesión a restaurar.
 * @param {object} sessionData - Los datos completos de la sesión que se guardaron antes de eliminarla.
 * @returns {Promise<void>}
 */
export const restoreDeletedSession = async (userId, sessionId, sessionData) => {
    if (!userId || !sessionId || !sessionData) {
        throw new Error("Faltan datos para restaurar la sesión (userId, sessionId, sessionData).");
    }

    // Validación simple de datos (puedes añadir más si es necesario)
    if (!sessionData.routineId || !sessionData.completedAt || !Array.isArray(sessionData.exercises)) {
        console.error("Datos de sesión inválidos para restaurar:", sessionData);
        throw new Error("Los datos de la sesión a restaurar son inválidos o están incompletos.");
    }

    try {
        // Referencia al documento usando el ID original
        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);

        // Re-crea el documento con los datos guardados.
        // ¡Importante! 'setDoc' sobrescribirá si ya existe, pero como lo borramos, lo creará de nuevo.
        await setDoc(sessionDocRef, sessionData);

        console.log(`Sesión ${sessionId} restaurada exitosamente.`);

    } catch (error) {
        console.error(`Error al restaurar la sesión ${sessionId}:`, error);
        // Re-lanza el error para que el hook useUndoManager pueda manejarlo (ej: mostrar un toast de error)
        throw new Error("No se pudo restaurar la sesión en la base de datos.");
    }
};