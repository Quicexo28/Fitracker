import React, { useMemo } from 'react';
import { useSessions } from '../context/SessionContext.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import CalendarHeatmap from '../components/CalendarHeatmap.jsx';
import { BarChart3, Calendar } from 'lucide-react';

export default function AnalyticsView({ user }) {
    const { sessions, loading } = useSessions();

    const globalStats = useMemo(() => {
        if (loading || sessions.length === 0) {
            return { totalWorkouts: 0, totalVolume: 0 };
        }

        const totalWorkouts = sessions.length;
        
        const totalVolume = sessions.reduce((total, session) => {
            const sessionVolume = session.exercises.reduce((exTotal, ex) => {
                const setVolume = ex.sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0);
                return exTotal + setVolume;
            }, 0);
            return total + sessionVolume;
        }, 0);

        return {
            totalWorkouts,
            totalVolume: totalVolume.toLocaleString('es-ES'),
        };
    }, [sessions, loading]);

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <BarChart3 /> Dashboard de Analíticas
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Aquí tienes un resumen global de tu progreso y consistencia.
                </p>
            </Card>

            {loading ? <ThemedLoader /> : (
                <>
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Estadísticas Globales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Entrenamientos Totales</p>
                                <p className="text-2xl font-bold">{globalStats.totalWorkouts}</p>
                            </div>
                             <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Volumen Total Levantado</p>
                                <p className="text-2xl font-bold">{globalStats.totalVolume} kg</p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        {/* --- CAMBIO AQUÍ: Título actualizado --- */}
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Calendar size={20} /> Consistencia - Entrenamientos Semanales
                        </h3>
                        <CalendarHeatmap sessions={sessions} />
                    </Card>
                </>
            )}
        </div>
    );
}