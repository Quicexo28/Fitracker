import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Un hook personalizado para manejar la lógica de "deshacer" una acción.
 * Permite que una acción se ejecute después de un tiempo, a menos que se "deshaga".
 * @param {number} timeout Duración en milisegundos para deshacer la acción.
 */
export default function useUndo(timeout = 5000) {
    const [undoState, setUndoState] = useState({ isActive: false, message: '' });
    const timerRef = useRef(null);
    const actionCallbackRef = useRef(null); // Ref para almacenar la función a ejecutar

    // Limpia el temporizador si el componente se desmonta
    // o si el efecto se re-ejecuta (por ejemplo, si 'timeout' cambia, aunque aquí es constante)
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            actionCallbackRef.current = null; // También limpiamos el callback al desmontar
        };
    }, []); // Dependencias vacías para que se ejecute solo al montar y desmontar

    const startUndo = useCallback((message, callback) => {
        // Limpia cualquier acción de deshacer pendiente para evitar conflictos
        clearTimeout(timerRef.current);

        actionCallbackRef.current = callback; // Guarda la función callback
        setUndoState({ isActive: true, message });

        // Establece el nuevo temporizador para ejecutar la acción
        timerRef.current = setTimeout(() => {
            if (actionCallbackRef.current) {
                actionCallbackRef.current(); // Ejecuta la función guardada (la eliminación)
            }
            setUndoState({ isActive: false, message: '' }); // Resetea el estado
            actionCallbackRef.current = null; // Limpia la referencia
        }, timeout);
    }, [timeout]); // 'timeout' es una dependencia para el useCallback

    const onUndo = useCallback(() => {
        // Si el usuario presiona "Deshacer", limpiamos el temporizador y el callback
        clearTimeout(timerRef.current);
        setUndoState({ isActive: false, message: '' });
        actionCallbackRef.current = null; // Importante limpiar para evitar que se ejecute
    }, []);

    return { 
        startUndo, 
        onUndo, 
        undoState: {
            isActive: undoState.isActive,
            message: undoState.message,
        }
    };
}