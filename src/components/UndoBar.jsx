import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function UndoBar({ isActive, onUndo, message }) {
    if (!isActive) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-up">
             <style>
                {`
                    @keyframes slide-up {
                        from { transform: translate(-50%, 100%); opacity: 0; }
                        to { transform: translate(-50%, 0); opacity: 1; }
                    }
                    .animate-slide-up {
                        animation: slide-up 0.3s ease-out forwards;
                    }
                `}
            </style>
            <div className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg shadow-lg p-3 flex items-center justify-between">
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