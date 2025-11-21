// src/utils/admin.js

// REEMPLAZA ESTO CON TU UID REAL DE FIREBASE AUTHENTICATION
const ADMIN_UIDS = [
    'glS8gxK5wUd7zkJbRKNB88EQkun2', 
    // 'OTRO_UID_SI_TIENES_UN_SOCIO'
];

export const isUserAdmin = (user) => {
    if (!user) return false;
    return ADMIN_UIDS.includes(user.uid);
};