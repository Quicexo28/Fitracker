import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useActiveSession } from '../context/ActiveSessionContext.jsx';
import { PlayCircle, Timer } from 'lucide-react';

export default function PersistentSessionBar() {
    const { activeSession, restTimer, timeRemaining } = useActiveSession();
    const location = useLocation();

    if (!activeSession || location.pathname.startsWith('/session/')) {
        return null;
    }
    
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
            <style>
                {`
                    @keyframes slide-up {
                        from { transform: translateY(100%); }
                        to { transform: translateY(0); }
                    }
                    .animate-slide-up {
                        animation: slide-up 0.3s ease-out;
                    }
                `}
            </style>
            <div className="bg-blue-600 text-white shadow-lg p-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {restTimer.isActive && timeRemaining > 0 ? (
                        <div className='flex items-center gap-3'>
                            <Timer size={20} className="animate-pulse" />
                            <div>
                                <p className="font-bold text-sm">Descanso:</p>
                                <p className="text-xs font-mono">{formatTime(timeRemaining)}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold text-sm">Entrenamiento en curso:</p>
                            <p className="text-xs">{activeSession.routineName || "Rutina"}</p>
                        </div>
                    )}
                    <Link 
                        to={`/session/${activeSession.routineId}`}
                        className="flex items-center gap-2 bg-white text-blue-600 font-bold py-2 px-4 rounded-full hover:bg-gray-200"
                    >
                        <PlayCircle size={18} />
                        Continuar
                    </Link>
                </div>
            </div>
        </div>
    );
}