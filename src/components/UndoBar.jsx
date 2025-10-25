import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function UndoBar({ isVisible, onUndo, message = "Acción realizada." }) {

    if (!isVisible) {
        return null; // Si no es visible, no renderiza nada
    }

    // --- CAMBIO: Estilos simplificados SIN transición de opacidad ---
    const barStyles = `
        fixed bottom-4 left-1/2 -translate-x-1/2
        flex items-center justify-between gap-4
        bg-gray-800 text-white /* Color oscuro */
        px-4 py-3 rounded-lg shadow-lg
        z-50 /* Asegura que esté por encima */
        opacity-100 /* Siempre opaco si se renderiza */
        /* Eliminamos: transition-opacity duration-300 ease-in-out */
        /* Eliminamos: ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} */
    `;
    // --- FIN CAMBIO ---

    return (
        <div className={barStyles} role="alert" aria-live="polite">
            <span>{message}</span>
            <button
                onClick={onUndo}
                className="flex items-center gap-1 font-bold text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
            >
                <RotateCcw size={16} />
                Deshacer
            </button>
        </div>
    );
}