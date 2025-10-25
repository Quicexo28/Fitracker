import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
// Asegúrate de importar useSessions correctamente
import { useSessions } from "../context/SessionContext.jsx"; // Necesita devolver setSessions
import { deleteWorkoutSession } from "../firebase/sessionService.js";
import Card from "../components/Card.jsx";
import ThemedLoader from "../components/ThemedLoader.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Edit, CalendarDays } from "lucide-react";
import toast from 'react-hot-toast';
import { UndoActionTypes } from '../hooks/useUndoManager'; // Importar tipos de acción

// Funciones formatDate y formatFullDateForModal (Asegúrate que estén definidas)
const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "Fecha inválida";
    return format(new Date(timestamp.seconds * 1000), "dd/MM/yy HH:mm", { locale: es });
};
const formatFullDateForModal = (timestamp) => {
    if (!timestamp?.seconds) return "Fecha inválida";
    return format(new Date(timestamp.seconds * 1000), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
};


export default function SessionHistoryView({ user, addUndoAction }) {
    // Asegura valores por defecto y obtén setSessions
    const {
        sessions = [],
        loading: sessionsLoading = true,
        refetchSessions,
        setSessions // <--- Obtener setSessions del contexto
     } = useSessions() || {}; // Añade un fallback por si useSessions devuelve null/undefined

    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const openConfirmationModal = (session) => {
        setSessionToDelete(session);
        setIsConfirmModalOpen(true);
    };

    // --- MODIFICADO: handleDeleteSession con Undo y Actualización Optimista ---
    const handleDeleteSession = useCallback(async () => {
        if (!sessionToDelete || !user) return;

        const sessionToDeleteId = sessionToDelete.id;
        const sessionToDeleteData = JSON.parse(JSON.stringify(sessionToDelete));

        // Payload para el Undo (sin cambios)
        const undoPayload = {
            sessionId: sessionToDeleteId,
            sessionData: sessionToDeleteData,
            user
        };

        setIsConfirmModalOpen(false); // Cierra el modal

        // --- ACTUALIZACIÓN OPTIMISTA ---
        // Elimina la sesión del estado local INMEDIATAMENTE
        if (typeof setSessions === 'function') {
            setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToDeleteId));
        } else {
            console.warn("setSessions no está disponible. La UI no se actualizará optimísticamente.");
            // Considera añadir setSessions a tu SessionContext si no existe
        }
        // --- FIN ACTUALIZACIÓN OPTIMISTA ---

        try {
            // Intenta eliminar de Firestore
            await deleteWorkoutSession(user.uid, sessionToDeleteId);

            // Muestra el toast de Undo DESPUÉS de la actualización optimista
            addUndoAction(UndoActionTypes.DELETE_SESSION, "Sesión eliminada.", undoPayload);

            // --- NO LLAMAR A REFETCH AQUÍ ---
            // Se confía en que el listener o el refetch dentro del Undo lo hagan si es necesario.

        } catch (error) {
            console.error("Error al eliminar la sesión de Firestore:", error);
            toast.error("Hubo un error al eliminar la sesión.");

            // --- REVERTIR ACTUALIZACIÓN OPTIMISTA EN CASO DE ERROR ---
            if (typeof setSessions === 'function') {
                // Vuelve a añadir la sesión al estado local si la eliminación falló
                setSessions(prevSessions => {
                    // Evita duplicados si ya existe por alguna razón
                    if (prevSessions.some(s => s.id === sessionToDeleteId)) {
                        return prevSessions;
                    }
                    // Reinserta y reordena
                    return [...prevSessions, sessionToDeleteData].sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
                });
            } else {
                 // Si no podemos revertir localmente, al menos intenta recargar desde Firestore
                 if (refetchSessions) refetchSessions();
            }
            // --- FIN REVERTIR ---
        } finally {
            // Limpia el estado independientemente del resultado
            setSessionToDelete(null);
        }
    }, [sessionToDelete, user, refetchSessions, addUndoAction, setSessions, setIsConfirmModalOpen, setSessionToDelete]); // Añade setSessions

    // sortedSessions (sin cambios)
    const sortedSessions = useMemo(() => {
        if (!Array.isArray(sessions)) return [];
        return [...sessions].sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
    }, [sessions]);

    if (sessionsLoading) return <ThemedLoader />;

    // --- RENDERIZADO (sin cambios estructurales) ---
    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirmar Eliminación"
                message={`¿Eliminar sesión "${sessionToDelete?.routineName || 'seleccionada'}" del ${formatFullDateForModal(sessionToDelete?.completedAt)}? Podrás deshacerlo.`}
                onConfirm={handleDeleteSession} // Llama a la función actualizada
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />
            <Card>
                <h2 className="text-3xl font-bold mb-6 text-center">Historial de Sesiones</h2>
                {sortedSessions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Aún no has completado ninguna sesión.</p>
                ) : (
                    <ul className="space-y-4">
                        {sortedSessions.map((session) => (
                            <li key={session.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <Link to={`/historial/${session.id}`} className="flex-grow mb-2 sm:mb-0">
                                        <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 hover:underline">{session.routineName || 'Entrenamiento'}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <CalendarDays size={14} /> {formatDate(session.completedAt)}
                                        </p>
                                    </Link>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Link to={`/historial/${session.id}/editar`} className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" title="Editar Sesión">
                                            <Edit size={18} />
                                        </Link>
                                        <button onClick={() => openConfirmationModal(session)} className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" title="Eliminar Sesión">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
            {/* El Undo Toast se maneja globalmente */}
        </>
    );
}