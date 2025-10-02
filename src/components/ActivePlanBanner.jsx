import React from 'react';
import { Link } from 'react-router-dom';
import useActiveMesocycle from '../hooks/useActiveMesocycle';
import { Target } from 'lucide-react';

export default function ActivePlanBanner({ user }) {
    const { activePlan, loading } = useActiveMesocycle(user.uid);

    if (loading || !activePlan) {
        return null; // No mostrar nada si no hay plan activo o está cargando
    }

    return (
        <div className="bg-blue-100 dark:bg-blue-900/50 border-b border-blue-200 dark:border-blue-800">
            <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 text-center">
                <Link to={`/planificacion/editar/${activePlan.id}`} className="flex items-center justify-center gap-3 text-sm font-semibold text-blue-800 dark:text-blue-200 hover:underline">
                    <Target size={16} />
                    <span>Plan Activo: <strong>{activePlan.name}</strong> (Semana {activePlan.currentWeek} de {activePlan.totalWeeks})</span>
                </Link>
            </div>
        </div>
    );
}