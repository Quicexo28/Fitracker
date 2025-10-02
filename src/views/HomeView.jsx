import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../context/SessionContext.jsx';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import useActiveMesocycle from '../hooks/useActiveMesocycle.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import { TrendingUp, Flame, Calendar, PlayCircle } from 'lucide-react';
import { isWithinInterval, differenceInCalendarWeeks, getDay } from 'date-fns';

const formatChartDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

export default function HomeView({ user }) {
    const { sessions, loading: sessionsLoading } = useSessions();
    const { activePlan, loading: mesocyclesLoading } = useActiveMesocycle(user.uid);
    const { data: routines, loading: routinesLoading } = useFirestoreCollection(`users/${user.uid}/routines`);

    // Lógica para encontrar el entrenamiento de hoy
    const todaysWorkout = useMemo(() => {
        if (!activePlan || routines.length === 0) return null;

        const today = new Date();
        const currentWeek = activePlan.weeks.find(w => w.number === activePlan.currentWeek);
        if (!currentWeek) return null;

        const dayIndex = getDay(today);
        const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const currentDayKey = dayKeys[dayIndex];
        const routineId = currentWeek.schedule[currentDayKey];

        if (!routineId) return { isRestDay: true, planName: activePlan.name };

        const routineDetails = routines.find(r => r.id === routineId);
        if (!routineDetails) return null;

        return {
            planName: activePlan.name,
            routineId: routineDetails.id,
            routineName: routineDetails.name,
            isDeload: currentWeek.type === 'deload',
        };
    }, [activePlan, routines]);

    const { lastSession, topVolumeExercise } = useMemo(() => {
        if (!sessions || sessions.length === 0) {
            return { lastSession: null, topVolumeExercise: null };
        }
        const session = sessions[0];
        let topExercise = null;
        let maxVolume = 0;
        session.exercises?.forEach(exercise => {
            const currentVolume = exercise.sets.reduce((total, set) => total + (set.weight * set.reps), 0);
            if (currentVolume > maxVolume) {
                maxVolume = currentVolume;
                topExercise = { ...exercise, totalVolume: maxVolume };
            }
        });
        return { lastSession: session, topVolumeExercise: topExercise };
    }, [sessions]);

    const chartData = useMemo(() => {
        if (!topVolumeExercise) {
            return { labels: [], datasets: [] };
        }
        const labels = [];
        const dataPoints = [];
        [...sessions].reverse().forEach(session => {
            const exerciseData = session.exercises?.find(ex => ex.exerciseId === topVolumeExercise.exerciseId);
            if (exerciseData && exerciseData.sets.length > 0) {
                labels.push(formatChartDate(session.completedAt));
                const maxWeight = Math.max(...exerciseData.sets.map(set => set.weight));
                dataPoints.push(maxWeight);
            }
        });
        return {
            labels,
            datasets: [{
                label: `Peso Máx. para ${topVolumeExercise.exerciseName}`,
                data: dataPoints,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.1
            }]
        };
    }, [sessions, topVolumeExercise]);
    
    const loading = sessionsLoading || mesocyclesLoading || routinesLoading;
    if (loading) {
        return <ThemedLoader />;
    }

    return (
        <div className="space-y-6">
            {todaysWorkout && (
                <Card className="bg-blue-600 text-white dark:bg-blue-800 animate-fade-in">
                    <h2 className="text-sm font-semibold opacity-80 mb-2">Plan Activo: {todaysWorkout.planName}</h2>
                    {todaysWorkout.isRestDay ? (
                        <div>
                            <p className="text-2xl font-bold">Hoy es día de descanso</p>
                            <p className="opacity-90">¡Aprovecha para recuperarte!</p>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-2xl font-bold">Hoy Toca: {todaysWorkout.routineName}</p>
                                {todaysWorkout.isDeload && <p className="text-yellow-300 font-semibold text-sm">Semana de Descarga</p>}
                            </div>
                            <Link to={`/session/${todaysWorkout.routineId}`} className="flex items-center gap-2 bg-white text-blue-600 font-bold py-2 px-4 rounded-full hover:bg-gray-200 transition-transform hover:scale-105">
                                <PlayCircle size={18} /> Iniciar
                            </Link>
                        </div>
                    )}
                </Card>
            )}
            
            {!lastSession && !todaysWorkout && (
                <Card>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">¡Bienvenido a Fit Tracker!</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">Crea una rutina o un plan de entrenamiento para empezar.</p>
                </Card>
            )}

            {lastSession && (
                 <Card>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resumen de tu Última Sesión</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <Calendar size={14} /> {new Date(lastSession.completedAt.seconds * 1000).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </Card>
            )}

            {topVolumeExercise && (
                <Card>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                           <Flame className="text-red-500" size={24}/>
                        </div>
                        <div>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Ejercicio con Mayor Volumen</p>
                           <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{topVolumeExercise.exerciseName}</h3>
                           <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">{topVolumeExercise.totalVolume.toLocaleString('es-ES')} kg de volumen total</p>
                        </div>
                    </div>
                </Card>
            )}

            {chartData.labels.length > 1 ? (
                <Card>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={22}/> Progresión del Ejercicio Destacado
                    </h3>
                    <ProgressChart chartData={chartData} />
                </Card>
            ) : (
                !todaysWorkout && lastSession && <Card><p className="text-center text-gray-500">Registra más sesiones para ver tu progreso.</p></Card>
            )}
        </div>
    );
}