import { doc, getDoc, setDoc, getDocs, collection, writeBatch, increment } from 'firebase/firestore';
import { db } from './config.js';
import { getProfile } from './profileService.js';

export const shareRoutine = async (userId, routineId) => {
    const userProfile = await getProfile(userId);
    if (!userProfile || !userProfile.displayName) {
        throw new Error("PROFILE_NOT_FOUND");
    }

    const privateRoutineRef = doc(db, `users/${userId}/routines`, routineId);
    const privateExercisesRef = collection(db, `users/${userId}/routines/${routineId}/exercises`);
    const routineDoc = await getDoc(privateRoutineRef);

    if (!routineDoc.exists()) { throw new Error("La rutina no existe."); }
    if (routineDoc.data().isPublic) { throw new Error("Esta rutina ya ha sido compartida."); }

    const publicRoutineId = routineDoc.id;
    const publicRoutineRef = doc(db, 'publicRoutines', publicRoutineId);
    const batch = writeBatch(db);

    const publicRoutineData = {
        name: routineDoc.data().name,
        authorId: userId,
        authorName: userProfile.displayName,
        originalRoutineId: routineId,
        sharedAt: new Date(),
        importCount: 0,
    };
    batch.set(publicRoutineRef, publicRoutineData);

    const exercisesSnapshot = await getDocs(privateExercisesRef);
    exercisesSnapshot.forEach(exerciseDoc => {
        const publicExerciseRef = doc(db, `publicRoutines/${publicRoutineId}/exercises`, exerciseDoc.id);
        batch.set(publicExerciseRef, exerciseDoc.data());
    });
    
    batch.update(privateRoutineRef, { isPublic: true, publicRoutineId: publicRoutineId });
    await batch.commit();
    return publicRoutineId;
};

/**
 * Importa una rutina pública a la colección privada de un usuario.
 * @param {string} publicRoutineId El ID de la rutina en la colección `publicRoutines`.
 * @param {string} newOwnerId El UID del usuario que está importando la rutina.
 */
export const importRoutine = async (publicRoutineId, newOwnerId) => {
    if (!publicRoutineId || !newOwnerId) throw new Error("Faltan IDs para la importación.");

    const publicRoutineRef = doc(db, 'publicRoutines', publicRoutineId);
    const publicRoutineDoc = await getDoc(publicRoutineRef);

    if (!publicRoutineDoc.exists()) {
        throw new Error("La rutina que intentas importar ya no existe.");
    }

    const batch = writeBatch(db);

    // Crear la nueva rutina privada
    const newPrivateRoutineRef = doc(collection(db, `users/${newOwnerId}/routines`));
    const routineData = publicRoutineDoc.data();
    batch.set(newPrivateRoutineRef, {
        name: routineData.name,
        importedFrom: publicRoutineId,
        importedFromAuthor: routineData.authorName,
        createdAt: serverTimestamp(),
    });

    // Copiar los ejercicios
    const publicExercisesRef = collection(db, `publicRoutines/${publicRoutineId}/exercises`);
    const exercisesSnapshot = await getDocs(publicExercisesRef);
    exercisesSnapshot.forEach(exerciseDoc => {
        const newPrivateExerciseRef = doc(db, `users/${newOwnerId}/routines/${newPrivateRoutineRef.id}/exercises`, exerciseDoc.id);
        batch.set(newPrivateExerciseRef, exerciseDoc.data());
    });

    // Actualizar el contador de importaciones
    batch.update(publicRoutineRef, { importCount: increment(1) });

    await batch.commit();
};