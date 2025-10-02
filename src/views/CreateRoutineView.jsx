import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import Card from '../components/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateRoutineView() {
    const [routineName, setRoutineName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const routinesPath = useMemo(() => user ? `users/${user.uid}/routines` : null, [user]);

    const handleCreateRoutine = async (e) => {
        e.preventDefault();
        if (!routineName.trim() || !routinesPath) return;
        
        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(db, routinesPath), {
                name: routineName.trim(),
                createdAt: serverTimestamp()
            });
            // Redirige al usuario a la página para construir la rutina recién creada.
            navigate(`/rutina/${docRef.id}`);
        } catch (error) {
            console.error("Error al crear la rutina:", error);
            alert("Hubo un error al crear la rutina.");
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <h2 className="text-3xl font-bold text-center mb-6">Crear Nueva Rutina</h2>
            <form onSubmit={handleCreateRoutine} className="max-w-md mx-auto">
                <div className="mb-4">
                    <label htmlFor="routineName" className="block text-lg font-medium mb-2">
                        Nombre de la Rutina
                    </label>
                    <input
                        id="routineName"
                        type="text"
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        placeholder="Ej: Día de Piernas"
                        className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        required
                    />
                </div>
                <div className="text-center">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400"
                    >
                        {isSubmitting ? 'Creando...' : 'Crear y Añadir Ejercicios'}
                    </button>
                </div>
            </form>
        </Card>
    );
}