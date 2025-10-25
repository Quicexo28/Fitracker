// src/components/GlobalUndoBar.jsx
import React from 'react';
import { useGlobalUndoStatus } from '../context/UndoContext.jsx';
import UndoBar from './UndoBar.jsx'; // El componente presentacional

export default function GlobalUndoBar() {
    const { isVisible, message, executeUndo } = useGlobalUndoStatus();

    // Pasa todo al componente presentacional
    return (
        <UndoBar
            isVisible={isVisible}
            message={message}
            onUndo={executeUndo} // Pasa la función executeUndo del contexto
        />
    );
}