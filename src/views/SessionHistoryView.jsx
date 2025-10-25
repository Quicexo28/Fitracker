import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSessions } from "../context/SessionContext.jsx";
import { deleteWorkoutSession } from "../firebase/sessionService.js"; // Necesitarás una función para restaurar si quieres undo real
import Card from "../components/Card.jsx";
import ThemedLoader from "../components/ThemedLoader.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
//import { useUndoContext } from "../context/UndoContext.jsx"; // <-- 2. IMPORTA el hook del contexto
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Edit, CalendarDays } from "lucide-react";

// Función para formatear fechas
const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return "Fecha inválida";
    return format(new Date(timestamp.seconds * 1000), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
};

export default function SessionHistoryView() {
    const { user } = useAuth();
    const { sessions, loading: sessionsLoading, refetchSessions } = useSessions(); // Asumiendo que useSessions provee refetch
    const [sessionToDelete, setSessionToDelete] = useState(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // --- 3. USA el hook del contexto ---
    //const { showUndoBar } = useUndoContext();

    const openConfirmationModal = (session) => {
        setSessionToDelete(session);
        setIsConfirmModalOpen(true);
    };

    // --- 4. MODIFICA handleDeleteSession ---
    const handleDeleteSession = useCallback(async () => {
        if (!sessionToDelete || !user) return;

        const sessionToDeleteId = sessionToDelete.id;
        const sessionToDeleteData = { ...sessionToDelete }; // Guarda los datos por si se deshace

        setIsConfirmModalOpen(false); // Cierra el modal de confirmación

        try {
            await deleteWorkoutSession(user.uid, sessionToDeleteId);
            const restoreAction = async () => {
                console.warn("La función para restaurar sesión eliminada aún no está implementada.");
                alert("Restaurar sesión eliminada aún no implementado.");
            };

            // Muestra la barra de deshacer usando el contexto
            //showUndoBar("Sesión eliminada.", restoreAction);

            // Refresca la lista después de mostrar el undo (o después de que el timeout termine si quieres)
             if (refetchSessions) refetchSessions(); // Llama a refetch si existe

        } catch (error) {
            console.error("Error al eliminar la sesión:", error);
            alert("Hubo un error al eliminar la sesión.");
        } finally {
            setSessionToDelete(null); // Limpia el estado
        }
    }, [sessionToDelete, user, /*showUndoBar,*/ refetchSessions]); // Añade dependencias


    const sortedSessions = useMemo(() => {
        // Ordena las sesiones de más reciente a más antigua
        return [...sessions].sort((a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0));
    }, [sessions]);


    if (sessionsLoading) return <ThemedLoader />;

    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirmar Eliminación"
                message={`¿Estás seguro de que quieres eliminar la sesión "${sessionToDelete?.routineName || 'seleccionada'}" del ${formatDate(sessionToDelete?.completedAt)}? Esta acción no se puede deshacer directamente.`}
                onConfirm={handleDeleteSession} // Llama a la función modificada
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
        </>
    );
}