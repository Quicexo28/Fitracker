import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { exerciseDatabase } from '../exercises.js';

const formatChartDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const calculateOneRepMax = (weight, reps, effort, effortMetric) => {
    let adjustedReps = reps;
    if (effortMetric === 'rir' && typeof effort === 'number') {
        adjustedReps += effort;
    } else if (effortMetric === 'rpe' && typeof effort === 'number') {
        adjustedReps += (10 - effort);
    }
    return weight * (1 + (adjustedReps / 30));
};

export default function ExerciseAnalyticsView({ user }) {
    const { exerciseId } = useParams();
    const [activeChart, setActiveChart] = useState('maxWeight');

    const sessionsPath = useMemo(() => user ? `users/${user.uid}/sessions` : null, [user]);
    const { data: sessions, loading: sessionsLoading } = useFirestoreCollection(sessionsPath, { orderBy: 'completedAt', direction: 'asc' });
    
    const customExercisePath = useMemo(() => user ? `users/${user.uid}/exercises/${exerciseId}` : null, [user, exerciseId]);
    const { document: customExerciseDoc, loading: customExerciseLoading } = useFirestoreDocument(customExercisePath);

    // --- LÓGICA MEJORADA PARA ENCONTRAR EL NOMBRE ---
    const exerciseName = useMemo(() => {
        if (customExerciseDoc) return customExerciseDoc.name;

        for (const group of exerciseDatabase) {
            for (const item of group.items) {
                if (item.id === exerciseId) return item.name;
                
                if (item.variations) {
                    const foundVariation = item.variations.find(v => v.id === exerciseId);
                    if (foundVariation) {
                        return `${item.name} ${foundVariation.name}`;
                    }
                }
            }
        }
        return 'Análisis de Ejercicio';
    }, [customExerciseDoc, exerciseId]);

     const chartData = useMemo(() => {
        const labels = [];
        const maxWeightData = [];
        const volumeData = [];
        const oneRMData = [];

        sessions.forEach(session => {
            const exerciseData = session.exercises?.find(ex => ex.exerciseId === exerciseId);
            if (exerciseData && exerciseData.sets.length > 0) {
                labels.push(formatChartDate(session.completedAt));
                let sessionMaxWeight = 0, sessionVolume = 0, sessionBestORM = 0;
                exerciseData.sets.forEach(set => {
                    sessionMaxWeight = Math.max(sessionMaxWeight, set.weight);
                    sessionVolume += (set.weight * set.reps);
                    const estimatedORM = calculateOneRepMax(set.weight, set.reps, set.effort, 'rir'); // Asumiendo 'rir' por defecto
                    sessionBestORM = Math.max(sessionBestORM, estimatedORM);
                });
                maxWeightData.push(sessionMaxWeight);
                volumeData.push(sessionVolume);
                oneRMData.push(sessionBestORM);
            }
        });
        return { labels, datasets: [ { label: 'Peso Máximo Levantado', data: maxWeightData, borderColor: 'rgb(59, 130, 246)', tension: 0.3 }, { label: 'Volumen Total (Peso * Reps)', data: volumeData, borderColor: 'rgb(16, 185, 129)', tension: 0.3 }, { label: '1RM Estimado', data: oneRMData, borderColor: 'rgb(234, 179, 8)', tension: 0.3 } ] };
    }, [sessions, exerciseId]);

    const renderActiveChart = () => {
        const dataSetMapping = { maxWeight: chartData.datasets?.[0], volume: chartData.datasets?.[1], oneRM: chartData.datasets?.[2] };
        const selectedDataSet = dataSetMapping[activeChart];
        if (!selectedDataSet) return null;
        return <ProgressChart chartData={{ labels: chartData.labels, datasets: [selectedDataSet] }} />;
    };

    if (sessionsLoading || customExerciseLoading) return <ThemedLoader />;

    return (
        <Card>
            <Link to="/ejercicios" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-4">
                <ArrowLeft size={16} /> Volver a la Biblioteca
            </Link>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <BarChart2 /> {exerciseName}
            </h2>

            {chartData.labels.length > 1 ? (
                <div>
                    <div className="flex items-center border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button onClick={() => setActiveChart('maxWeight')} className={`px-4 py-2 text-sm font-medium ${activeChart === 'maxWeight' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Peso Máximo</button>
                        <button onClick={() => setActiveChart('volume')} className={`px-4 py-2 text-sm font-medium ${activeChart === 'volume' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Volumen</button>
                        <button onClick={() => setActiveChart('oneRM')} className={`px-4 py-2 text-sm font-medium ${activeChart === 'oneRM' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>1RM Estimado</button>
                    </div>
                    <div>{renderActiveChart()}</div>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-8">Necesitas registrar al menos dos sesiones con esta variación para ver los gráficos de progreso.</p>
            )}
        </Card>
    );
}