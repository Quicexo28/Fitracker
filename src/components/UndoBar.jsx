import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Componente presentacional para mostrar una barra temporal con opción de deshacer.
 * @param {boolean} isVisible - Controla si la barra se muestra o no.
 * @param {function} onUndo - Función a llamar cuando se hace clic en "Deshacer".
 * @param {string} message - Mensaje a mostrar en la barra.
 */
export default function UndoBar({ isVisible, onUndo, message = "Acción realizada." }) {

    // Si no está visible, no renderiza nada
    if (!isVisible) {
        return null;
    }

    // Estilos Tailwind para posicionamiento fijo y apariencia
    const barStyles = `
        fixed bottom-4 left-1/2 -translate-x-1/2
        flex items-center justify-between gap-4
        bg-gray-800 text-white
        px-4 py-3 rounded-lg shadow-lg
        z-50
        transition-opacity duration-300 ease-in-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `;

    return (
        <div className={barStyles} role="alert" aria-live="polite">
            <span>{message}</span>
            <button
                // Llama directamente a la función 'onUndo' recibida (que será executeUndo del contexto)
                onClick={onUndo}
                className="flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
            >
                <RotateCcw size={16} />
                Deshacer
            </button>
        </div>
    );
}