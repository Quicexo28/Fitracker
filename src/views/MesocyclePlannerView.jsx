import React, { useState } from 'react';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { deleteMesocycle } from '../firebase/mesocycleService.js';
import { CalendarPlus, Edit, Trash2, BookCopy } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

export default function MesocyclePlannerView({ user }) {
    const mesocyclesPath = `users/${user.uid}/mesocycles`;
    const { data: mesocycles, loading } = useFirestoreCollection(mesocyclesPath, { orderBy: 'startDate', direction: 'desc' });
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const openDeleteModal = (plan) => {
        setItemToDelete(plan);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
            try {
                await deleteMesocycle(user.uid, itemToDelete.id);
            } catch (error) {
                console.error("Error al eliminar el plan:", error);
                alert("No se pudo eliminar el plan.");
            } finally {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            }
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={`Eliminar Plan: ${itemToDelete?.name}`}
                message="¿Estás seguro de que quieres eliminar este plan de entrenamiento? Esta acción no se puede deshacer."
            />
            <Card>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Planificación</h2>
                    <div className="flex gap-2">
                        <Link to="/planificacion/nuevo" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                            <CalendarPlus size={20}/> Crear Nuevo Plan
                        </Link>
                    </div>
                </div>

                {loading && <ThemedLoader />}
                {!loading && mesocycles.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aún no has creado ningún plan de entrenamiento. ¡Crea uno para empezar!</p>
                )}

                {!loading && mesocycles.length > 0 && (
                    <ul className="space-y-4">
                        {mesocycles.map(plan => (
                            <li key={plan.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link to={`/planificacion/editar/${plan.id}`} className="p-2 text-blue-500 hover:text-blue-400">
                                            <Edit size={18} />
                                        </Link>
                                        <button onClick={() => openDeleteModal(plan)} className="p-2 text-red-500 hover:text-red-400">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </>
    );
}