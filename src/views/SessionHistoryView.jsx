import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Ruta correcta
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx'; // Ruta correcta
import { deleteWorkoutSession } from '../firebase/sessionService.js'; // Ruta correcta
import Card from '../components/Card.jsx'; // Ruta correcta
import ThemedLoader from '../components/ThemedLoader.jsx'; // Ruta correcta
import ConfirmationModal from '../components/ConfirmationModal.jsx'; // Ruta correcta
import UndoBar from '../components/UndoBar.jsx'; // Ruta correcta
import useUndo from '../hooks/useUndo.jsx'; // Ruta correcta
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Trash2, CalendarDays, Clock, CheckCircle } from 'lucide-react';

export default function SessionHistoryView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessionIdToDelete, setSessionIdToDelete] = useState(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

    const { startUndo, onUndo, undoState } = useUndo(5000);

    const sessionsPath = useMemo(() => user ? `users/${user.uid}/workoutSessions` : null, [user]);
    const { data: sessions, loading, error, refetch } = useFirestoreCollection(sessionsPath, {
        orderBy: 'date',
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
            const deletionCallback = async () => {
                await deleteWorkoutSession(user.uid, currentSessionId);
                refetch();
            };
            startUndo('Sesión eliminada', deletionCallback);
            setSessionIdToDelete(null);
        }
    }, [sessionIdToDelete, user.uid, refetch, startUndo]);

    if (loading) return <ThemedLoader />;
    if (error) return <p className="text-red-500 text-center mt-8">Error: {error.message}</p>;

    return (
        <div className="relative min-h-screen pb-16">
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Sesiones</h1>
                    <div className="w-6"></div>
                </div>

                {sessions.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aún no tienes sesiones registradas. ¡Empieza a entrenar!</p>
                ) : (
                    <div className="space-y-4">
                        {sessions.map(session => (
                            <div key={session.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center relative">
                                <div className="flex-1 mb-2 sm:mb-0">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{session.routineName || 'Sesión sin nombre'}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <CalendarDays size={16} /> {session.date ? format(session.date.toDate(), 'PPPp', { locale: es }) : 'Fecha desconocida'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                        <Clock size={16} /> Duración: {session.duration || '00:00:00'}
                                    </p>
                                    {session.completedSets > 0 && (
                                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle size={16} /> {session.completedSets} series completadas
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteSessionClick(session.id)}
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
                message="¿Estás seguro de que quieres eliminar esta sesión? Esta acción se puede deshacer durante un corto periodo de tiempo."
            />

            <UndoBar
                isActive={undoState.isActive}
                onUndo={onUndo}
                message={undoState.message}
            />
        </div>
    );
}

//hola 