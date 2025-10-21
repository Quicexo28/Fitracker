import { collection, doc, getDocs, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './config.js';

// --- Función para contar PRs en las sesiones ---
const countPersonalRecords = (sessions) => {
    let prCount = 0;
    sessions.forEach(session => {
        session.exercises?.forEach(exercise => {
            exercise.sets?.forEach(set => {
                if (set.isPR) {
                    prCount++;
                }
            });
        });
    });
    return prCount;
};

// Registro de tipos de logros y cómo calcular su progreso
const achievementRegistry = {
    WORKOUTS_COMPLETED: (stats) => stats.totalSessions || 0,
    PERSONAL_RECORDS_SET: (stats) => stats.totalPRs || 0, // <-- NUEVO TIPO
    // ROUTINES_CREATED: (stats) => stats.totalRoutines || 0, // Ejemplo futuro
};

// Obtiene estadísticas clave del usuario
const getUserStats = async (userId) => {
    // Aseguramos que la colección sea 'sessions' consistentemente
    const sessionsRef = collection(db, `users/${userId}/sessions`);
    // const routinesRef = collection(db, `users/${userId}/routines`); // Para futuro logro

    const [sessionsSnap/*, routinesSnap*/] = await Promise.all([
        getDocs(sessionsRef),
        // getDocs(routinesRef) // Descomentar si añades el logro de rutinas
    ]);

    const sessionsData = sessionsSnap.docs.map(doc => doc.data());

    return {
        totalSessions: sessionsSnap.size,
        totalPRs: countPersonalRecords(sessionsData), // <-- NUEVO CÁLCULO
        // totalRoutines: routinesSnap.size // Para futuro logro
    };
};

// Comprueba y otorga logros
export const checkAndGrantAchievements = async (userId) => {
    if (!userId) return;
    console.log("Comprobando logros para el usuario:", userId);
    const batch = writeBatch(db);
    try {
        const stats = await getUserStats(userId);
        const achievementsRef = collection(db, 'achievements');
        const userAchievementsRef = collection(db, `users/${userId}/userAchievements`);
        const [achievementsSnap, userAchievementsSnap] = await Promise.all([
            getDocs(achievementsRef), getDocs(userAchievementsRef)
        ]);
        const userAchievements = new Map(userAchievementsSnap.docs.map(doc => [doc.id, doc.data()]));
        for (const achievementDoc of achievementsSnap.docs) {
            const achievement = { id: achievementDoc.id, ...achievementDoc.data() };
            if (!achievement.type || !achievementRegistry[achievement.type]) {
                console.warn(`Tipo de logro desconocido o no registrado: ${achievement.type} para ${achievement.id}`);
                continue; // Salta este logro si no está registrado
            }
            const userProgress = achievementRegistry[achievement.type](stats);
            const userAchievement = userAchievements.get(achievement.id) || { unlockedTier: null, progress: 0 };
            let newTier = null;
            const tierLevels = { "Bronce": 1, "Plata": 2, "Oro": 3, null: 0 };
            // Ordena los tiers por umbral descendente antes de buscar el nivel alcanzado
            [...achievement.tiers].sort((a,b) => b.threshold - a.threshold).forEach(tier => {
                if (!newTier && userProgress >= tier.threshold) newTier = tier.level;
            });
            const hasNewTier = newTier && (tierLevels[newTier] > tierLevels[userAchievement.unlockedTier]);
            const progressHasChanged = userProgress !== userAchievement.progress;
            if (hasNewTier || progressHasChanged) {
                const achievementToUpdateRef = doc(db, `users/${userId}/userAchievements`, achievement.id);
                const dataToUpdate = {
                    achievementId: achievement.id,
                    progress: userProgress,
                    unlockedTier: hasNewTier ? newTier : userAchievement.unlockedTier,
                    updatedAt: new Date() // Usamos objeto Date de JS, Firestore lo convierte a Timestamp
                };
                if (hasNewTier) {
                    console.log(`¡Nuevo logro desbloqueado! ${achievement.name} - ${newTier}`);
                    dataToUpdate.unlockedAt = new Date(); // Usamos objeto Date de JS
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