import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './config.js';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        // El usuario ha iniciado sesión. Puedes acceder a `result.user`.
        console.log("Inicio de sesión con Google exitoso:", result.user);
        return result.user;
    } catch (error) {
        // Manejar errores aquí.
        console.error("Error en el inicio de sesión con Google:", error);
        throw new Error("No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.");
    }
};