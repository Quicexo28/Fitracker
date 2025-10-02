import React from 'react';
import { Timer, X } from 'lucide-react';
import { useActiveSession } from '../context/ActiveSessionContext.jsx';

export default function RestTimer() {
    const { restTimer, timeRemaining, closeRestTimer } = useActiveSession();
    const { isActive, nextExerciseName, message } = restTimer;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!isActive) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 animate-slide-up">
            <style>{`@keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } } .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }`}</style>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-72 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Timer className="text-blue-500" size={20} />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Tiempo de Descanso</h4>
                    </div>
                    <button onClick={closeRestTimer} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"><X size={18} /></button>
                </div>
                <p className="text-center text-5xl font-mono font-bold text-gray-800 dark:text-gray-100 my-4">
                    {formatTime(timeRemaining)}
                </p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {message ? (
                        <span className="font-bold text-lg text-blue-500">{message}</span>
                    ) : (
                        <>Siguiente: <span className="font-medium text-gray-700 dark:text-gray-300">{nextExerciseName}</span></>
                    )}
                </p>
            </div>
        </div>
    );
}