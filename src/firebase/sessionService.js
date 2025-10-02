import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
                // --- NUEVOS CAMPOS PARA UNILATERAL ---
                completedLeft: setData.completedLeft || false,
                completedRight: setData.completedRight || false,
                // Mantenemos 'completed' por compatibilidad y lógica general
                completed: setData.completedLeft && setData.completedRight,
            };
        }).sort((a, b) => a.set - b.set) : [];
        return {
            exerciseId: exerciseId,
            exerciseName: exerciseDetails?.name || exerciseDetails?.exerciseName || 'Ejercicio Desconocido',
            isUnilateral: exerciseDetails?.isUnilateral || false, // Guardamos si el ejercicio es unilateral
            sets: sets
        };
    });
};

export const saveWorkoutSession = async (userId, routineId, rawWorkoutData, exercises, prSets) => {
    if (!userId || !routineId) throw new Error("Falta el ID de usuario o de rutina.");
    const transformedData = transformWorkoutData(rawWorkoutData, exercises, prSets); 
    const hasData = transformedData.some(ex => ex.sets.length > 0 && ex.sets.some(s => s.weight > 0 || s.reps > 0));
    if (!hasData) {
        throw new Error("No hay datos de series para guardar.");
    }
    const sessionData = {
        routineId: routineId,
        completedAt: serverTimestamp(),
        exercises: transformedData
    };
    const sessionCollectionRef = collection(db, `users/${userId}/sessions`);
    await addDoc(sessionCollectionRef, sessionData);
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