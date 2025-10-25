import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
// Asegúrate de importar useSessions correctamente si lo defines en SessionContext.jsx
import { useSessions } from "../context/SessionContext.jsx";
import { deleteWorkoutSession } from "../firebase/sessionService.js";
import Card from "../components/Card.jsx";
import ThemedLoader from "../components/ThemedLoader.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Edit, CalendarDays } from "lucide-react";
import toast from 'react-hot-toast';
import { UndoActionTypes } from '../hooks/useUndoManager'; // <-- Importar tipos de acción

// Función formatDate (sin cambios)
const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "Fecha inválida";
    // Formato más corto para la lista
    return format(new Date(timestamp.seconds * 1000), "dd/MM/yy HH:mm", { locale: es });
};
// Formato más largo para el modal de confirmación
const formatFullDateForModal = (timestamp) => {
    if (!timestamp?.seconds) return "Fecha inválida";
    return format(new Date(timestamp.seconds * 1000), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
};


// Recibe addUndoAction como prop
export default function SessionHistoryView({ user, addUndoAction }) {
    // Asegura valores por defecto si useSessions retorna undefined/null
    const { sessions = [], loading: sessionsLoading = true, refetchSessions } = useSessions() || {};
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const openConfirmationModal = (session) => {
        setSessionToDelete(session);
        setIsConfirmModalOpen(true);
    };

    // --- MODIFICADO: handleDeleteSession con Undo ---
    const handleDeleteSession = useCallback(async () => {
        if (!sessionToDelete || !user) return;

        const sessionToDeleteId = sessionToDelete.id;
        // ¡IMPORTANTE! Copia profunda para evitar problemas con referencias mutables
        const sessionToDeleteData = JSON.parse(JSON.stringify(sessionToDelete));

        // Payload con los setters/datos necesarios para la restauración
        const undoPayload = {
            sessionId: sessionToDeleteId,
            sessionData: sessionToDeleteData, // Los datos completos para restaurar en Firestore
            refetchSessions, // Pasa la función para refrescar la lista
            user             // Pasa el objeto user
        };

        setIsConfirmModalOpen(false); // Cierra el modal primero

        try {
            // Elimina la sesión de Firestore
            await deleteWorkoutSession(user.uid, sessionToDeleteId);

            // Dispara la acción de Undo (que mostrará el toast)
            addUndoAction(UndoActionTypes.DELETE_SESSION, "Sesión eliminada.", undoPayload);

            // Llama a refetch para actualizar la UI (puede ser optimista o esperar)
            if (refetchSessions) refetchSessions();

        } catch (error) {
            console.error("Error al eliminar la sesión:", error);
            toast.error("Hubo un error al eliminar la sesión.");
        } finally {
            // Limpia el estado de sessionToDelete DESPUÉS de intentar la operación
            setSessionToDelete(null);
        }
    // Incluye todas las dependencias necesarias
    }, [sessionToDelete, user, refetchSessions, addUndoAction, setIsConfirmModalOpen, setSessionToDelete]);

    // sortedSessions (sin cambios)
    const sortedSessions = useMemo(() => {
        // Asegura que sessions sea un array antes de ordenar
        if (!Array.isArray(sessions)) return [];
        return [...sessions].sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
    }, [sessions]);

    if (sessionsLoading) return <ThemedLoader />;

    // --- RENDERIZADO ---
    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirmar Eliminación"
                message={`¿Eliminar sesión "${sessionToDelete?.routineName || 'seleccionada'}" del ${formatFullDateForModal(sessionToDelete?.completedAt)}? Podrás deshacerlo.`} // Usa formato largo
                onConfirm={handleDeleteSession}
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
                                            <CalendarDays size={14} /> {formatDate(session.completedAt)} {/* Usa formato corto */}
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
            {/* El UndoNotification (Toast) se maneja globalmente */}
        </>
    );
}