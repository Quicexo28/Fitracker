import React, { useState, useEffect, useMemo, memo } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { Plus, X, Loader } from 'lucide-react';
import Card from './Card.jsx';
import toast from 'react-hot-toast';

function AddRoutineModal({ isOpen, onClose, user }) {
    const [routineName, setRoutineName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const routinesPath = useMemo(() => user ? `users/${user.uid}/routines` : null, [user]);

    const handleAddRoutine = async (e) => {
        e.preventDefault();
        if (!routineName.trim()) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, routinesPath), {
                name: routineName.trim(),
                createdAt: serverTimestamp()
            });
            toast.success('¡Rutina creada con éxito!');
            onClose();
        } catch (error) {
            console.error("Error añadiendo rutina:", error);
            toast.error('Error al crear la rutina.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => { if (!isOpen) setRoutineName(''); }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-gray-900 dark:text-white">Crear Nueva Rutina</h3><button onClick={onClose} className="p-1 text-gray-400 hover:text-white" disabled={isSubmitting}><X/></button></div>
                <form onSubmit={handleAddRoutine} className="space-y-4">
                    <div><label htmlFor="rt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Rutina</label><input id="rt-name" type="text" value={routineName} onChange={e => setRoutineName(e.target.value)} required className="mt-1 block w-full p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg" /></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg" disabled={isSubmitting}>Cancelar</button><button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed" disabled={isSubmitting}>{isSubmitting ? <Loader className="animate-spin" size={20}/> : <Plus/>}{isSubmitting ? 'Creando...' : 'Crear'}</button></div>
                </form>
            </Card>
        </div>
    );
}

export default memo(AddRoutineModal);