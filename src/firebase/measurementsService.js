import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Guarda un nuevo registro de medición para un usuario.
 * @param {string} userId - El ID del usuario.
 * @param {object} measurementData - Objeto con los datos de medición.
 */
export const saveMeasurement = async (userId, measurementData) => {
    if (!userId || !measurementData) {
        throw new Error("Faltan el ID de usuario o los datos de medición.");
    }

    const dataToSave = { measuredAt: serverTimestamp() };
    
    // Array actualizado con todos los campos de medición
    const fields = ['weight', 'bodyFat', 'chest', 'waist', 'hips', 'arm', 'leg', 'neck', 'shoulders', 'forearm', 'calf'];
    fields.forEach(field => {
        if (measurementData[field]) {
            dataToSave[field] = parseFloat(measurementData[field]);
        }
    });

    if (Object.keys(dataToSave).length <= 1) {
        throw new Error("No hay datos válidos para guardar.");
    }
    
    const measurementsCollectionRef = collection(db, `users/${userId}/measurements`);
    await addDoc(measurementsCollectionRef, dataToSave);
};

/**
 * Elimina un registro de medición.
 * @param {string} userId - El ID del usuario.
 * @param {string} measurementId - El ID del documento de medición a eliminar.
 */
export const deleteMeasurement = async (userId, measurementId) => {
    if (!userId || !measurementId) {
        throw new Error("Faltan el ID de usuario o de la medición.");
    }
    const measurementDocRef = doc(db, `users/${userId}/measurements`, measurementId);
    await deleteDoc(measurementDocRef);
};