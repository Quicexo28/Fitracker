import { collection, addDoc, serverTimestamp, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Guarda (crea o actualiza) un plan de mesociclo para un usuario.
 * @param {string} userId El ID del usuario.
 * @param {object} mesocycleData Los datos completos del plan.
 * @param {string|null} mesocycleId El ID del mesociclo si se está actualizando, o null si es nuevo.
 */
export const saveMesocycle = async (userId, mesocycleData, mesocycleId) => {
    if (!userId) throw new Error("Falta el ID de usuario.");

    const dataToSave = {
        ...mesocycleData,
        lastUpdated: serverTimestamp()
    };

    if (mesocycleId) {
        // Actualizar un plan existente
        const docRef = doc(db, `users/${userId}/mesocycles`, mesocycleId);
        await setDoc(docRef, dataToSave, { merge: true });
    } else {
        // Crear un nuevo plan
        dataToSave.createdAt = serverTimestamp();
        const collectionRef = collection(db, `users/${userId}/mesocycles`);
        await addDoc(collectionRef, dataToSave);
    }
};

/**
 * Elimina un plan de mesociclo.
 * @param {string} userId El ID del usuario.
 * @param {string} mesocycleId El ID del plan a eliminar.
 */
export const deleteMesocycle = async (userId, mesocycleId) => {
    if (!userId || !mesocycleId) throw new Error("Faltan IDs.");
    const docRef = doc(db, `users/${userId}/mesocycles`, mesocycleId);
    await deleteDoc(docRef);
};