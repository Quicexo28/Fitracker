import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import { deleteWorkoutSession } from '../firebase/sessionService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import UndoBar from '../components/UndoBar.jsx';
import useUndo from '../hooks/useUndo.jsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Trash2, CalendarDays, Clock, CheckCircle } from 'lucide-react';

export default function SessionHistoryView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessionIdToDelete, setSessionIdToDelete] = useState(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const { startUndo, onUndo, undoState } = useUndo(5000);

    // --- CORRECCIÓN APLICADA: Unificamos el nombre a "sessions" ---
    const sessionsPath = useMemo(() => user ? `users/${user.uid}/sessions` : null, [user]);
    const { data: sessions, loading, error } = useFirestoreCollection(sessionsPath, {
        orderBy: 'completedAt', // Corregido para usar el campo de timestamp
        direction: 'desc'
    });

    const handleDeleteSessionClick = (sessionId) => {
        setSessionIdToDelete(sessionId);
        setIsConfirmationModalOpen(true);
    };

    const confirmAndDeleteSession = useCallback(() => {
        setIsConfirmationModalOpen(false);
        if (sessionIdToDelete) {
            const currentSessionId = sessionIdToDelete;
            // El borrado se hace en segundo plano, la UI se actualiza por el listener
            const deletionCallback = async () => {
                await deleteWorkoutSession(user.uid, currentSessionId);
            };
            startUndo('Sesión eliminada', deletionCallback);
            setSessionIdToDelete(null);
        }
    }, [sessionIdToDelete, user.uid, startUndo]);

    if (loading) return <ThemedLoader />;
    if (error) return <p className="text-red-500 text-center mt-8">Error: {error.message}</p>;

    return (
        <div className="relative min-h-screen pb-16">
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Sesiones</h1>
                </div>

                {sessions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aún no tienes sesiones registradas.</p>
                ) : (
                    <div className="space-y-4">
                        {sessions.map(session => (
                            <div key={session.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center relative">
                                <div className="flex-1 mb-2 sm:mb-0 cursor-pointer" onClick={() => navigate(`/historial/${session.id}`)}>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{session.routineName || 'Sesión sin nombre'}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <CalendarDays size={16} /> {session.completedAt ? format(session.completedAt.toDate(), 'PPPp', { locale: es }) : 'Fecha desconocida'}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSessionClick(session.id); }}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full absolute top-2 right-2 sm:static"
                                    aria-label={`Eliminar sesión ${session.routineName}`}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => setIsConfirmationModalOpen(false)}
                onConfirm={confirmAndDeleteSession}
                title="Confirmar Eliminación"
                message="¿Estás seguro de que quieres eliminar esta sesión?"
            />

            <UndoBar
                isActive={undoState.isActive}
                onUndo={onUndo}
                message={undoState.message}
            />
        </div>
    );
}