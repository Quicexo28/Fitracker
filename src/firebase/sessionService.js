import { collection, addDoc, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Checks an object recursively for any properties with the value `undefined`.
 * @param {any} obj The object or value to check.
 * @param {string} path The current path for logging purposes.
 * @returns {boolean} True if an undefined value is found, false otherwise.
 */
const checkForUndefined = (obj, path = '') => {
    if (obj === undefined) {
        console.error(`Found undefined value at path: ${path || '<root>'}`);
        return true;
    }
    if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                if (checkForUndefined(obj[i], `${path}[${i}]`)) {
                    return true;
                }
            }
        } else {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (checkForUndefined(obj[key], `${path}${path ? '.' : ''}${key}`)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};


/**
 * Transforms raw workout data into a structured format suitable for Firestore,
 * ensuring no undefined values are present.
 * @param {object} workoutData Raw data keyed by exerciseId, then setNumber.
 * @param {Array<object>} sessionExercises Array of exercise objects from useSessionManager.
 * @param {Set<string>} prSets Set containing strings like "exerciseId-setNumber" for PRs.
 * @returns {Array<object>} Array of exercise objects ready for Firestore.
 */
const transformWorkoutData = (workoutData, sessionExercises, prSets) => {
    if (!workoutData || !sessionExercises) return [];

    return Object.keys(workoutData).map(exerciseId => {
        const exerciseLog = workoutData[exerciseId];
        const exerciseDetails = sessionExercises.find(ex => ex.exerciseId === exerciseId);

        if (!exerciseDetails) {
            console.warn(`Details not found for exerciseId: ${exerciseId} in sessionExercises. Skipping.`);
            return null; // Skip if no matching details found
        }

        const sets = exerciseLog ? Object.keys(exerciseLog).map(setNumber => {
            const setData = exerciseLog[setNumber] || {};
            const setNumInt = parseInt(setNumber, 10);
            const isPR = prSets.has(`${exerciseId}-${setNumInt}`); // Use parsed set number

            // --- Robust Parsing with Defaults ---
            const weightValue = parseFloat(setData.weight);
            const repsValue = parseInt(setData.reps, 10);
            const effortValue = parseFloat(setData.effort);

            const completedLeft = setData.completedLeft === true;
            const completedRight = setData.completedRight === true;

            // Determine completed status based on unilateral property
            const isCompleted = exerciseDetails.isUnilateral
                ? (completedLeft && completedRight) // Both must be true for unilateral
                : completedLeft; // Only left (or the main one) for bilateral

            return {
                set: setNumInt,
                weight: !isNaN(weightValue) ? weightValue : 0,
                // Handle range or single number for reps
                reps: !isNaN(repsValue) ? repsValue : (typeof setData.reps === 'string' ? parseInt(setData.reps.split('-')[0], 10) || 0 : 0),
                effort: !isNaN(effortValue) ? effortValue : null, // Use null for invalid effort
                note: setData.note || '',
                isPR: isPR,
                // Only include left/right if it's unilateral
                ...(exerciseDetails.isUnilateral && { completedLeft: completedLeft }),
                ...(exerciseDetails.isUnilateral && { completedRight: completedRight }),
                completed: isCompleted, // Calculated completed status
            };
        }).sort((a, b) => a.set - b.set) : [];

        // Filter out sets that might be empty or invalid before returning the exercise
        const validSets = sets.filter(s => s.weight > 0 || s.reps > 0 || s.effort !== null || s.note !== '' || s.completed);

        // If no valid sets remain for this exercise, return null to filter it out later
        if (validSets.length === 0) {
            return null;
        }

        return {
            exerciseId: exerciseId,
            exerciseName: exerciseDetails.exerciseName || 'Ejercicio Desconocido',
            variationName: exerciseDetails.variationName || '',
            isUnilateral: exerciseDetails.isUnilateral || false,
            supersetId: exerciseDetails.supersetId || null,
            supersetOrder: exerciseDetails.supersetOrder ?? null,
            sets: validSets // Use only valid sets
        };
    }).filter(ex => ex !== null); // Filter out exercises that ended up with no valid sets or missing details
};


/**
 * Saves a workout session to Firestore.
 * @param {string} userId User's ID.
 * @param {string} routineId Routine's ID.
 * @param {object} rawWorkoutData Raw data from the session view.
 * @param {Array<object>} sessionExercises Exercises state from useSessionManager.
 * @param {Set<string>} prSets Set of PR identifiers ("exerciseId-setNumber").
 * @returns {Promise<DocumentReference>} Firestore document reference of the saved session.
 */
export const saveWorkoutSession = async (userId, routineId, rawWorkoutData, sessionExercises, prSets) => {
    console.log("Iniciando guardado de sesión...");
    if (!userId || !routineId) {
        console.error("Error Crítico: Falta ID de usuario o de rutina.");
        throw new Error("Falta el ID de usuario o de rutina.");
    }

    try {
        const transformedData = transformWorkoutData(rawWorkoutData, sessionExercises, prSets);
        console.log("Datos de sesión transformados:", transformedData);

        // Explicit Undefined Check
        if (checkForUndefined({ exercises: transformedData })) {
            console.error("¡ERROR! Se detectó un valor 'undefined' en los datos transformados. Abortando guardado.");
            throw new Error("Se intentó guardar un valor 'undefined' en Firestore.");
        }

        if (transformedData.length === 0) {
            // Check if there was input data originally
             if (Object.keys(rawWorkoutData).length > 0 && Object.values(rawWorkoutData).some(exData => Object.keys(exData).length > 0)) {
                console.warn("Los datos brutos contenían entradas, pero la transformación resultó en 0 ejercicios válidos. Revisar lógica.");
                // Decide: throw error or allow saving an "empty" session marker?
                // For now, let's prevent saving an empty session derived from actual input
                 throw new Error("No hay datos de series válidos para guardar después de la transformación.");
            } else {
                console.warn("No hay datos de series para guardar (entrada vacía). Abortando.");
                throw new Error("No hay datos de series para guardar.");
            }
        }

        const routineDocSnap = await getDoc(doc(db, `users/${userId}/routines/${routineId}`));

        const sessionData = {
            routineId: routineId,
            routineName: routineDocSnap.exists() ? routineDocSnap.data().name : 'Rutina Eliminada',
            completedAt: serverTimestamp(),
            exercises: transformedData,
        };

        console.log("Objeto final a guardar en Firestore:", sessionData);

        const sessionCollectionRef = collection(db, `users/${userId}/sessions`);
        const docRef = await addDoc(sessionCollectionRef, sessionData);

        console.log("¡Éxito! Sesión guardada con ID:", docRef.id);
        return docRef; // Return the reference

    } catch (error) {
        console.error("--- ERROR DETALLADO AL GUARDAR EN FIRESTORE ---");
        console.error("User ID:", userId);
        console.error("Routine ID:", routineId);
        // Avoid logging rawWorkoutData unless absolutely necessary for debugging large objects
        // console.error("Raw Workout Data:", rawWorkoutData);
        console.error("Error Object:", error);
        // Add specific error handling if needed, otherwise re-throw
        throw error;
    }
};

/**
 * Deletes a workout session from Firestore.
 * @param {string} userId User's ID.
 * @param {string} sessionId Session's ID to delete.
 */
export const deleteWorkoutSession = async (userId, sessionId) => {
    if (!userId || !sessionId) throw new Error("Falta el ID de usuario o de sesión para eliminar.");
    const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
    try {
        await deleteDoc(sessionDocRef);
        console.log(`Sesión ${sessionId} eliminada exitosamente.`);
    } catch (error) {
        console.error(`Error al eliminar la sesión ${sessionId}:`, error);
        throw new Error("No se pudo eliminar la sesión.");
    }
};

/**
 * Updates an existing workout session in Firestore.
 * @param {string} userId User's ID.
 * @param {string} sessionId Session's ID to update.
 * @param {object} rawWorkoutData Updated raw data from the edit view.
 * @param {Array<object>} sessionExercises Current exercises state from useSessionManager.
 */
export const updateWorkoutSession = async (userId, sessionId, rawWorkoutData, sessionExercises) => {
    if (!userId || !sessionId) throw new Error("Falta el ID de usuario o de sesión para actualizar.");

    try {
        // Assuming no new PRs are set during an edit, pass an empty Set for prSets
        const transformedData = transformWorkoutData(rawWorkoutData, sessionExercises, new Set());

        // Explicit Undefined Check before updating
        if (checkForUndefined({ exercises: transformedData })) {
            console.error("¡ERROR! Se detectó un valor 'undefined' en los datos transformados al actualizar. Abortando guardado.");
            throw new Error("Se intentó guardar un valor 'undefined' en Firestore durante la actualización.");
        }

         // It might be valid to save an update that results in zero exercises (if the user deleted all)
         // So we might not need the strict empty check here, unless required by business logic.
         if (transformedData.length === 0 && Object.keys(rawWorkoutData).length > 0) {
             console.warn("La actualización resultó en 0 ejercicios válidos. Guardando sesión 'vacía'.");
         }


        const updatedSessionData = {
            exercises: transformedData,
            lastUpdated: serverTimestamp() // Add a timestamp for the update
        };

        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
        await updateDoc(sessionDocRef, updatedSessionData);
        console.log(`Sesión ${sessionId} actualizada exitosamente.`);

    } catch (error) {
        console.error(`--- ERROR DETALLADO AL ACTUALIZAR SESIÓN ${sessionId} ---`);
        console.error("Error Object:", error);
        throw error; // Re-throw
    }
};

/**
 * Restores a previously deleted session using its original ID.
 * @param {string} userId User's ID.
 * @param {string} sessionId The original ID of the session to restore.
 * @param {object} sessionData The complete session data saved before deletion.
 */
export const restoreDeletedSession = async (userId, sessionId, sessionData) => {
    if (!userId || !sessionId || !sessionData) {
        throw new Error("Faltan datos para restaurar la sesión (userId, sessionId, sessionData).");
    }

    // Basic data validation
    if (typeof sessionData !== 'object' || sessionData === null || !sessionData.routineId || !sessionData.completedAt || !Array.isArray(sessionData.exercises)) {
        console.error("Datos de sesión inválidos para restaurar:", sessionData);
        throw new Error("Los datos de la sesión a restaurar son inválidos o están incompletos.");
    }

     // Final check for undefined before restoring
    if (checkForUndefined(sessionData, 'sessionData')) {
        console.error("¡ERROR! Se detectó un valor 'undefined' en los datos de la sesión a restaurar. Abortando restauración.");
        throw new Error("Los datos de la sesión a restaurar contienen 'undefined'.");
    }


    try {
        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
        // Use setDoc to re-create the document with the original ID
        await setDoc(sessionDocRef, sessionData);
        console.log(`Sesión ${sessionId} restaurada exitosamente.`);
    } catch (error) {
        console.error(`Error al restaurar la sesión ${sessionId}:`, error);
        throw new Error("No se pudo restaurar la sesión en la base de datos.");
    }
};