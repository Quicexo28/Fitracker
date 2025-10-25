import React, { createContext, useState, useRef, useCallback, useContext, useMemo } from 'react';

// 1. Crear el Contexto
const UndoContext = createContext(null);

// 2. Crear el Proveedor del Contexto
export function UndoProvider({ children, timeoutDuration = 5000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [onUndoCallback, setOnUndoCallback] = useState(null); // Guarda la función específica de deshacer
    const timeoutRef = useRef(null);

    // Función para mostrar la barra (llamada desde los componentes)
    const showUndoBar = useCallback((msg, undoCallback) => {
        // Limpia timeout anterior si existe
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setMessage(msg);
        // Guardamos la función usando una función para asegurar que se capture la correcta
        setOnUndoCallback(() => undoCallback);
        setIsVisible(true);

        // Inicia el temporizador para ocultar
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
            setOnUndoCallback(null); // Limpia la función guardada
            setMessage('');
            timeoutRef.current = null;
        }, timeoutDuration);

    }, [timeoutDuration]);

    // Función para ocultar la barra (si es necesario manualmente)
    const hideUndoBar = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
        setOnUndoCallback(null);
        setMessage('');
    }, []);

    // Función que se ejecuta al hacer clic en "Deshacer" en la barra
    const executeUndo = useCallback(() => {
        if (typeof onUndoCallback === 'function') {
            onUndoCallback(); // Ejecuta la función específica guardada
        }
        hideUndoBar(); // Oculta la barra después de deshacer
    }, [onUndoCallback, hideUndoBar]);

    // Valor que proporciona el contexto
    const contextValue = useMemo(() => ({
        isVisible,
        message,
        executeUndo, // Para la barra global
        showUndoBar  // Para los componentes que disparan la acción
    }), [isVisible, message, executeUndo, showUndoBar]);

    return (
        <UndoContext.Provider value={contextValue}>
            {children}
        </UndoContext.Provider>
    );
}

// 3. Hook personalizado para usar el contexto (para componentes que activan el undo)
export function useUndoContext() {
    const context = useContext(UndoContext);
    if (!context) {
        throw new Error('useUndoContext debe usarse dentro de un UndoProvider');
    }
    // Devuelve solo lo que necesitan los componentes: la función para mostrar la barra
    return { showUndoBar: context.showUndoBar };
}

// 4. Hook separado para el componente GlobalUndoBar (devuelve todo lo necesario)
export function useGlobalUndoStatus() {
     const context = useContext(UndoContext);
    if (!context) {
        throw new Error('useGlobalUndoStatus debe usarse dentro de un UndoProvider');
    }
    return {
        isVisible: context.isVisible,
        message: context.message,
        executeUndo: context.executeUndo
    };
}