import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook (reescrito) para manejar la lógica de "deshacer"
 * con el patrón de "acción inmediata, restauración al clic".
 */
export default function useUndo(timeout = 5000) {
    
    // 1. Estado para la UI (visibilidad y mensaje)
    const [undoState, setUndoState] = useState({ 
        isActive: false, 
        message: '' 
    });
    
    // 2. Referencia para el temporizador de desaparición
    const timerRef = useRef(null);
    
    // 3. Referencia para guardar la *función de restauración*
    const restoreCallbackRef = useRef(null);

    // 4. Limpieza al desmontar
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
        };
    }, []); 

    /**
     * Inicia la barra de deshacer.
     * @param {string} message - El mensaje a mostrar (ej. "Ejercicio eliminado").
     * @param {function} callback - La función que RESTAURA el estado (la acción de deshacer).
     */
    const startUndo = useCallback((message, callback) => {
        clearTimeout(timerRef.current);
        restoreCallbackRef.current = callback;
        
        // Actualiza el estado de React, lo que provoca una nueva renderización
        setUndoState({ isActive: true, message });

        // Inicia el temporizador para que la barra desaparezca
        timerRef.current = setTimeout(() => {
            setUndoState({ isActive: false, message: '' });
            restoreCallbackRef.current = null;
        }, timeout);

    }, [timeout]);

    /**
     * Se llama cuando el usuario hace clic en el botón "Deshacer".
     */
    const onUndo = useCallback(() => {
        clearTimeout(timerRef.current);
        setUndoState({ isActive: false, message: '' });

        if (restoreCallbackRef.current) {
            restoreCallbackRef.current();
        }
        
        restoreCallbackRef.current = null;

    }, []); 

    // --- ESTA ES LA PARTE IMPORTANTE ---
    // Devuelve el objeto de estado 'undoState' directamente.
    // NO lo envuelvas en otro objeto.
    return { 
        startUndo, 
        onUndo, 
        undoState 
    };
}