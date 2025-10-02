import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config.js';

/**
 * Obtiene las preferencias de un usuario desde Firestore.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<object>} Las preferencias del usuario o valores por defecto.
 */
export const getUserPreferences = async (userId) => {
    if (!userId) return null;

    const prefDocRef = doc(db, `users/${userId}/settings`, 'preferences');
    const docSnap = await getDoc(prefDocRef);

    if (docSnap.exists()) {
        // Para usuarios existentes, devolvemos sus datos guardados
        return docSnap.data();
    } else {
        // --- CAMBIO AQUÍ ---
        // Para usuarios nuevos, devolvemos el objeto de preferencias COMPLETO.
        return {
            weightUnit: 'kg',
            effortMetric: 'rir',
            features: {
                measurements: true,
                analytics: true,
                planning: true,
            }
        };
    }
};

/**
 * Guarda las preferencias de un usuario en Firestore.
 * @param {string} userId - El ID del usuario.
 * @param {object} preferences - El objeto con las preferencias a guardar.
 * @returns {Promise<void>}
 */
export const saveUserPreferences = async (userId, preferences) => {
    if (!userId) return;

    const prefDocRef = doc(db, `users/${userId}/settings`, 'preferences');
    await setDoc(prefDocRef, {
        ...preferences,
        lastUpdated: serverTimestamp()
    }, { merge: true });
};