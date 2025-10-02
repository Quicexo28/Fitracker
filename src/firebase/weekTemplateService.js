import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Guarda (crea o actualiza) una plantilla de semana.
 * @param {string} userId El ID del usuario.
 * @param {object} templateData Los datos de la plantilla (nombre y horario).
 * @param {string|null} templateId El ID si se está actualizando.
 */
export const saveWeekTemplate = async (userId, templateData, templateId) => {
    if (!userId) throw new Error("Falta el ID de usuario.");

    const dataToSave = {
        ...templateData,
        lastUpdated: serverTimestamp()
    };

    if (templateId) {
        const docRef = doc(db, `users/${userId}/weekTemplates`, templateId);
        await updateDoc(docRef, dataToSave);
    } else {
        dataToSave.createdAt = serverTimestamp();
        const collectionRef = collection(db, `users/${userId}/weekTemplates`);
        await addDoc(collectionRef, dataToSave);
    }
};

/**
 * Elimina una plantilla de semana.
 * @param {string} userId El ID del usuario.
 * @param {string} templateId El ID de la plantilla a eliminar.
 */
export const deleteWeekTemplate = async (userId, templateId) => {
    if (!userId || !templateId) throw new Error("Faltan IDs.");
    const docRef = doc(db, `users/${userId}/weekTemplates`, templateId);
    await deleteDoc(docRef);
};