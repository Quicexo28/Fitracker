import React from 'react';
import { useGlobalUndoStatus } from '../context/UndoContext.jsx'; // Hook para el estado global
import UndoBar from './UndoBar.jsx'; // Componente presentacional

export default function GlobalUndoBar() {
    // Obtiene el estado y la función del contexto global
    const { isVisible, message, executeUndo } = useGlobalUndoStatus();

    // Pasa los datos al componente presentacional
    return (
        <UndoBar
            isVisible={isVisible}
            message={message}
            onUndo={executeUndo}
        />
    );
}