import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function UndoBar({ isActive, onUndo, message }) {
    
    if (!isActive) {
        return null;
    }

    return (
        // --- DIV EXTERNO: POSICIONAMIENTO ---
        // 1. Resuelve el Problema 1: Usamos z-[51] (arbitrario)
        //    para asegurarnos de que esté POR ENCIMA del RestTimer (z-50).
        // 2. Resuelve el Problema 2: El centrado (-translate-x-1/2) 
        //    se queda aquí y no será afectado por la animación.
        <div 
            className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[51]"
            role="alert"
        >
            {/* --- DIV INTERNO: ANIMACIÓN Y ESTILO ---
                Este div ahora solo se preocupa de la animación y el estilo.
                La animación 'animate-slide-up' ya no entrará en conflicto
                con el 'translate-x' del padre.
            */}
            <div 
                className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg shadow-lg p-3 flex items-center justify-between animate-slide-up"
            >
                <span className="text-sm">{message}</span>
                <button 
                    onClick={onUndo} 
                    className="flex items-center gap-2 font-semibold text-sm text-yellow-400 dark:text-yellow-600 hover:underline"
                >
                    <RotateCcw size={16} />
                    Deshacer
                </button>
            </div>
        </div>
    );
}