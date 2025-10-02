import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './config.js';

// --- Funciones existentes (getProfile, isDisplayNameUnique, saveProfile) sin cambios ---
export const getProfile = async (userId) => {
    if (!userId) return null;
    const profileRef = doc(db, 'users', userId);
    const docSnap = await getDoc(profileRef);
    return docSnap.exists() ? docSnap.data() : null;
};

export const isDisplayNameUnique = async (displayName) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("displayName", "==", displayName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

export const saveProfile = async (userId, profileData) => {
    const { displayName } = profileData;
    if (!userId || !displayName) {
        throw new Error("El nombre de usuario es obligatorio.");
    }
    const currentProfile = await getProfile(userId);
    if (currentProfile?.displayName !== displayName) {
        const isUnique = await isDisplayNameUnique(displayName);
        if (!isUnique) {
            throw new Error("USERNAME_TAKEN");
        }
    }
    const profileRef = doc(db, 'users', userId);
    await setDoc(profileRef, { ...profileData, lastUpdated: serverTimestamp() }, { merge: true });
};

/**
 * Busca usuarios por su nombre de usuario.
 * @param {string} searchQuery - El término de búsqueda.
 * @param {string} currentUserId - El ID del usuario actual para excluirlo de los resultados.
 * @returns {Promise<Array>} Una lista de usuarios que coinciden con la búsqueda.
 */
export const searchUsers = async (searchQuery, currentUserId) => {
    if (!searchQuery) return [];
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("displayName", ">=", searchQuery), where("displayName", "<=", searchQuery + '\uf8ff'));
    
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach(doc => {
        if (doc.id !== currentUserId) {
            users.push({ id: doc.id, ...doc.data() });
        }
    });
    return users;
};

/**
 * Gestiona una acción de amistad (aceptar, rechazar, cancelar, añadir).
 * @param {string} currentUserId - UID del usuario actual.
 * @param {string} otherUserId - UID del otro usuario implicado.
 * @param {string} action - 'accept', 'reject', 'cancel', o 'add'.
 */
export const handleFriendAction = async (currentUserId, otherUserId, action) => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const otherUserRef = doc(db, 'users', otherUserId);
    const batch = writeBatch(db);

    switch(action) {
        case 'add':
            batch.update(currentUserRef, { sentRequests: arrayUnion(otherUserId) });
            batch.update(otherUserRef, { receivedRequests: arrayUnion(currentUserId) });
            break;
        case 'accept':
            batch.update(currentUserRef, { friends: arrayUnion(otherUserId), receivedRequests: arrayRemove(otherUserId) });
            batch.update(otherUserRef, { friends: arrayUnion(currentUserId), sentRequests: arrayRemove(currentUserId) });
            break;
        case 'reject':
        case 'cancel':
            batch.update(currentUserRef, { receivedRequests: arrayRemove(otherUserId), sentRequests: arrayRemove(otherUserId) });
            batch.update(otherUserRef, { sentRequests: arrayRemove(currentUserId), receivedRequests: arrayRemove(currentUserId) });
            break;
        default:
            throw new Error("Acción no válida");
    }
    await batch.commit();
};

/**
 * Elimina a un amigo.
 * @param {string} currentUserId - UID del usuario actual.
 * @param {string} friendId - UID del amigo a eliminar.
 */
export const removeFriend = async (currentUserId, friendId) => {
    const currentUserRef = doc(db, 'users', currentUserId);
    const friendRef = doc(db, 'users', friendId);
    
    const batch = writeBatch(db);
    batch.update(currentUserRef, { friends: arrayRemove(friendId) });
    batch.update(friendRef, { friends: arrayRemove(currentUserId) });
    await batch.commit();
};