import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, saveProfile } from '../firebase/profileService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Save } from 'lucide-react';

export default function ProfileSetupView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(''); // Estado para mensajes de error

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const profile = await getProfile(user.uid);
                setDisplayName(profile?.displayName || user.displayName || '');
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError('El nombre de usuario no puede estar vacío.');
            return;
        }
        setIsSaving(true);
        setError(''); // Limpiar errores previos
        try {
            await saveProfile(user.uid, { displayName: displayName.trim() });
            alert('Perfil guardado con éxito.');
            navigate('/ajustes');
        } catch (error) {
            if (error.message === "USERNAME_TAKEN") {
                setError("Ese nombre de usuario ya está en uso. Por favor, elige otro.");
            } else {
                setError("Hubo un error al guardar el perfil.");
                console.error("Error al guardar el perfil:", error);
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <ThemedLoader />;

    return (
        <Card>
            <h2 className="text-3xl font-bold mb-6">Configurar Perfil Público</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                Este nombre será visible para otros usuarios y debe ser único.
            </p>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                        Nombre de Usuario
                    </label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400"
                    >
                        <Save size={18} />
                        {isSaving ? 'Guardando...' : 'Guardar Perfil'}
                    </button>
                </div>
            </form>
        </Card>
    );
}