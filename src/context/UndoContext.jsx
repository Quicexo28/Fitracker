import React, { createContext, useState, useRef, useCallback, useContext, useMemo, useEffect } from 'react';

// 1. Crear el Contexto
const UndoContext = createContext(null);

// 2. Crear el Proveedor del Contexto
export function UndoProvider({ children, timeoutDuration = 5000 }) {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    // Usamos una ref para la callback para evitar problemas de closure en el setTimeout
    const onUndoCallbackRef = useRef(null);
    const timeoutRef = useRef(null); // Ref para el ID del timeout

    // Función centralizada para ocultar la barra y limpiar todo
    const hideUndoBar = useCallback(() => {
        // Limpia el timeout SI existe
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null; // Resetea la ref del timeout
            console.log("[UndoContext] Timeout limpiado por hideUndoBar."); // Debug
        }
        // Resetea el estado solo si está visible actualmente
        if (isVisible) {
            setIsVisible(false);
            onUndoCallbackRef.current = null; // Limpia la ref de la callback
            setMessage('');
            console.log("[UndoContext] hideUndoBar: Estado reseteado a invisible."); // Debug
        }
    }, [isVisible]); // Depende de isVisible para evitar llamadas innecesarias


    // Función para mostrar la barra (llamada desde los componentes)
    const showUndoBar = useCallback((msg, undoCallback) => {
        console.log("[UndoContext] showUndoBar llamado con mensaje:", msg); // Debug

        // --- CLAVE: Limpia SIEMPRE el timeout anterior ANTES de empezar ---
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            console.log("[UndoContext] showUndoBar: Timeout anterior limpiado."); // Debug
        }

        setMessage(msg);
        onUndoCallbackRef.current = undoCallback; // Guarda la callback en la ref (siempre actualizada)
        setIsVisible(true); // Muestra la barra
        console.log("[UndoContext] showUndoBar: Estado puesto a visible. Iniciando nuevo timeout."); // Debug

        // Inicia el NUEVO temporizador para ocultar automáticamente
        timeoutRef.current = setTimeout(() => {
            console.log("[UndoContext] Timeout disparado."); // Debug
            hideUndoBar(); // Llama a la función centralizada de limpieza
        }, timeoutDuration);

    }, [timeoutDuration, hideUndoBar]); // Depende de timeoutDuration y hideUndoBar

    // Función que se ejecuta al hacer clic en "Deshacer" en la barra
    const executeUndo = useCallback(() => {
        console.log("[UndoContext] executeUndo llamado."); // Debug
        // Llama a la callback guardada en la ref
        if (typeof onUndoCallbackRef.current === 'function') {
            console.log("[UndoContext] Ejecutando callback de deshacer guardada."); // Debug
            onUndoCallbackRef.current();
        } else {
            console.warn("[UndoContext] No se encontró callback de deshacer para ejecutar."); // Debug
        }
        // Oculta la barra inmediatamente después de intentar deshacer
        hideUndoBar();
    }, [hideUndoBar]); // Depende de hideUndoBar


    // Valor que proporciona el contexto (sin cambios)
    const contextValue = useMemo(() => ({
        isVisible,
        message,
        executeUndo,
        showUndoBar
    }), [isVisible, message, executeUndo, showUndoBar]);

    // Efecto de limpieza al desmontar el Provider (importante)
    useEffect(() => {
        // Devuelve una función de limpieza que se ejecuta cuando el componente se desmonta
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                console.log("[UndoContext] Provider desmontado, timeout limpiado."); // Debug
            }
        };
    }, []); // Se ejecuta solo una vez al montar

    return (
        <UndoContext.Provider value={contextValue}>
            {children}
        </UndoContext.Provider>
    );
}

// Hook para componentes que activan el undo (sin cambios)
export function useUndoContext() {
    const context = useContext(UndoContext);
    if (!context) { throw new Error('useUndoContext debe usarse dentro de un UndoProvider'); }
    return { showUndoBar: context.showUndoBar };
}

// Hook para la barra global (sin cambios)
export function useGlobalUndoStatus() {
     const context = useContext(UndoContext);
    if (!context) { throw new Error('useGlobalUndoStatus debe usarse dentro de un UndoProvider'); }
    return { isVisible: context.isVisible, message: context.message, executeUndo: context.executeUndo };
}