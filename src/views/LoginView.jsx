import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase/config';
import { signInWithGoogle } from '../firebase/authService.js';
import Card from '../components/Card';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Icono de Google
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

export default function LoginView() {
    const { user, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState(null);

    // --- LÓGICA DE REDIRECCIÓN ---
    // Si la autenticación aún está cargando, no mostramos nada para evitar un parpadeo.
    if (loading) {
        return null;
    }

    // Si ya hay un usuario, lo redirigimos a la página de inicio.
    if (user) {
        return <Navigate to="/" replace />;
    }
    
    // --- MANEJADORES DE EVENTOS ---
    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setError(null);
        } catch (error) {
            setError("Credenciales incorrectas o el usuario no existe.");
        }
    };

    const handleRegister = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setError(null);
        } catch (error) {
            setError("No se pudo crear la cuenta. La contraseña debe tener al menos 6 caracteres.");
        }
    };

    const handleGuest = async () => {
        try {
            await signInAnonymously(auth);
            setError(null);
        } catch (error) {
            setError("No se pudo iniciar como invitado.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            handleRegister(email, password);
        } else {
            handleLogin(email, password);
        }
    };
    
    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="max-w-md w-full">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    {isRegistering ? 'Crear una Cuenta' : 'Iniciar Sesión'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg placeholder-gray-500" placeholder="Correo electrónico"/>
                    </div>
                    <div>
                        <label htmlFor="password"  className="sr-only">Contraseña</label>
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg placeholder-gray-500" placeholder="Contraseña" />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md">
                            {isRegistering ? 'Registrarse' : 'Entrar'}
                        </button>
                    </div>
                </form>
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-gray-600" /></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">O</span></div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-3">
                         <button onClick={signInWithGoogle} className="w-full inline-flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <GoogleIcon />
                            <span>Continuar con Google</span>
                        </button>
                        <button onClick={handleGuest} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                            Continuar como Invitado
                        </button>
                    </div>
                </div>
                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
                    <button onClick={() => setIsRegistering(!isRegistering)} className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                        {isRegistering ? 'Inicia sesión' : 'Regístrate'}
                    </button>
                </p>
            </Card>
        </div>
    );
}