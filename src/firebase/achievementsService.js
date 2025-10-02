// src/firebase/achievementsService.js
import { collection, doc, getDocs, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './config.js';

// Este registro mapea un tipo de logro con una función que sabe cómo calcular el progreso del usuario para ese tipo.
// Es fácilmente extensible para futuros logros.
const achievementRegistry = {
    WORKOUTS_COMPLETED: (stats) => stats.totalSessions || 0,
    // Ejemplo de cómo añadirías más en el futuro:
    // TOTAL_VOLUME_LIFTED: (stats) => stats.totalVolume || 0,
};

/**
 * Obtiene las estadísticas clave de un usuario, como el número total de sesiones.
 * @param {string} userId El ID del usuario.
 * @returns {Promise<object>} Un objeto con las estadísticas del usuario.
 */
const getUserStats = async (userId) => {
    const sessionsRef = collection(db, `users/${userId}/sessions`);
    const sessionsSnap = await getDocs(sessionsRef);
    return {
        totalSessions: sessionsSnap.size
        // Aquí se podrían añadir cálculos más complejos como sumar el volumen total de todas las sesiones.
    };
};

/**
 * Comprueba todos los logros definidos contra las estadísticas del usuario y otorga los nuevos niveles alcanzados.
 * Esta función se debe llamar después de que una acción relevante (como completar un entrenamiento) ocurra.
 * @param {string} userId El ID del usuario.
 */
export const checkAndGrantAchievements = async (userId) => {
    if (!userId) return;
    console.log("Comprobando logros para el usuario:", userId);
    
    const batch = writeBatch(db);

    try {
        const stats = await getUserStats(userId);
        const achievementsRef = collection(db, 'achievements');
        const userAchievementsRef = collection(db, `users/${userId}/userAchievements`);

        const [achievementsSnap, userAchievementsSnap] = await Promise.all([
            getDocs(achievementsRef),
            getDocs(userAchievementsRef)
        ]);

        const userAchievements = new Map(userAchievementsSnap.docs.map(doc => [doc.id, doc.data()]));

        for (const achievementDoc of achievementsSnap.docs) {
            const achievement = { id: achievementDoc.id, ...achievementDoc.data() };
            if (!achievement.type || !achievementRegistry[achievement.type]) continue;

            const userProgress = achievementRegistry[achievement.type](stats);
            const userAchievement = userAchievements.get(achievement.id) || { unlockedTier: null, progress: 0 };

            let newTier = null;
            const tierLevels = { "Bronce": 1, "Plata": 2, "Oro": 3 };
            
            // Revisa los niveles de mayor a menor para encontrar el más alto alcanzado
            [...achievement.tiers].reverse().forEach(tier => {
                if (!newTier && userProgress >= tier.threshold) {
                    newTier = tier.level;
                }
            });

            // Si se ha alcanzado un nuevo nivel que es superior al que ya se tenía
            const hasNewTier = newTier && (tierLevels[newTier] > tierLevels[userAchievement.unlockedTier]);
            const progressHasChanged = userProgress !== userAchievement.progress;

            if (hasNewTier || progressHasChanged) {
                const achievementToUpdateRef = doc(db, `users/${userId}/userAchievements`, achievement.id);
                const dataToUpdate = {
                    achievementId: achievement.id,
                    progress: userProgress,
                    unlockedTier: hasNewTier ? newTier : userAchievement.unlockedTier,
                    updatedAt: new Date()
                };
                if (hasNewTier) {
                    console.log(`¡Nuevo logro desbloqueado! ${achievement.name} - ${newTier}`);
                    dataToUpdate.unlockedAt = new Date();
                }
                batch.set(achievementToUpdateRef, dataToUpdate, { merge: true });
            }
        }

        await batch.commit();
        console.log("Comprobación de logros finalizada.");
    } catch (error) {
        console.error("Error al comprobar los logros:", error);
    }
};