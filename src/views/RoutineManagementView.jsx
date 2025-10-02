import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import AddRoutineModal from '../components/AddRoutineModal.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function RoutineManagementView({ user }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const routinesPath = useMemo(() => user ? `users/${user.uid}/routines` : null, [user]);
    // La variable 'routines' se actualiza en tiempo real desde Firestore.
    const { data: routines, loading } = useFirestoreCollection(routinesPath);

    const deleteRoutine = async (routineId) => {
        // Nota: Esto no borra la subcolección de ejercicios, solo el documento de la rutina.
        if(window.confirm("¿Estás seguro de que quieres eliminar esta rutina?")){
            try {
                const routineDocRef = doc(db, routinesPath, routineId);
                await deleteDoc(routineDocRef);
                // No necesitamos hacer nada más. El hook actualizará la pantalla.
            } catch (e) {
                console.error("Error al eliminar rutina: ", e);
                alert("Hubo un error al eliminar la rutina.");
            }
        }
    };

    return (
        <>
            <AddRoutineModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} />
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Mis Rutinas</h3>
                    <button onClick={() => setIsAddModalOpen(true)} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-lg"><PlusCircle /></button>
                </div>
                {loading ? <ThemedLoader /> : routines.length === 0 ? <p className="text-center text-gray-500 py-4">No has creado ninguna rutina.</p> : (
                    <ul className="space-y-3">
                        {/* Renderizamos directamente desde la variable 'routines' del hook */}
                        {routines.map((routine) => (
                            <li key={routine.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                <span className="font-medium">{routine.name}</span>
                                <div className="flex items-center gap-2">
                                    <Link to={`/rutina/${routine.id}`} className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <Edit size={18} />
                                    </Link>
                                    <button onClick={() => deleteRoutine(routine.id)} className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><Trash2 size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}