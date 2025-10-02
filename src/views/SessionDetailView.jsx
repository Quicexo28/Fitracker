import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { ArrowLeft, Calendar, Dumbbell, BarChart2, MessageSquare, Link as LinkIcon, Award } from 'lucide-react';

const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    return new Date(timestamp.seconds * 1000).toLocaleString('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short'
    });
};

export default function SessionDetailView({ user }) {
    const { sessionId } = useParams();
    const sessionPath = useMemo(() => user ? `users/${user.uid}/sessions/${sessionId}` : null, [user, sessionId]);
    const { document: session, loading, error } = useFirestoreDocument(sessionPath);

    const routinePath = useMemo(() => (user && session) ? `users/${user.uid}/routines/${session.routineId}` : null, [user, session]);
    const { document: routine } = useFirestoreDocument(routinePath);

    const groupedExercises = useMemo(() => {
        if (!session?.exercises) return [];
        const groups = {};
        const singleExercises = [];
        session.exercises.forEach(ex => {
            if (ex.supersetId) {
                if (!groups[ex.supersetId]) groups[ex.supersetId] = [];
                groups[ex.supersetId].push(ex);
            } else {
                singleExercises.push([ex]);
            }
        });
        Object.values(groups).forEach(group => group.sort((a, b) => a.supersetOrder - b.supersetOrder));
        const finalStructure = [];
        const processedIds = new Set();
        session.exercises.forEach(ex => {
            if (processedIds.has(ex.exerciseId)) return;
            if (ex.supersetId) {
                finalStructure.push(groups[ex.supersetId]);
                groups[ex.supersetId].forEach(groupedEx => processedIds.add(groupedEx.exerciseId));
            } else {
                finalStructure.push([ex]);
                processedIds.add(ex.exerciseId);
            }
        });
        return finalStructure;
    }, [session]);

    if (loading) return <ThemedLoader />;
    if (error) return <Card><p className="text-red-500">{error}</p></Card>;
    if (!session) return <Card><p>No se encontró la sesión.</p></Card>

    return (
        <Card>
            <Link to="/historial" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-4">
                <ArrowLeft size={16} />
                Volver al Historial
            </Link>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {routine?.name || 'Detalles del Entrenamiento'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <Calendar size={14} /> {formatDate(session.completedAt)}
                </div>
            </div>

            <div className="space-y-6">
                {groupedExercises.map((group, index) => (
                    <div key={index} className={`space-y-3 ${group.length > 1 ? 'p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30' : ''}`}>
                         {group.length > 1 && <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2"><LinkIcon size={16}/>Super-serie Realizada</h4>}
                        {group.map((exercise, exIndex) => (
                            <Link to={`/ejercicios/${exercise.exerciseId}`} key={exIndex}>
                                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg hover:ring-2 hover:ring-blue-500 transition-all">
                                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-3 flex items-center justify-between">
                                        <span className="flex items-center gap-2"> <Dumbbell size={20} /> {exercise.exerciseName} </span>
                                        <BarChart2 size={20} className="text-blue-500 opacity-70"/>
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                                            <span>SERIE</span>
                                            <span className="text-center">PESO</span>
                                            <span className="text-center">REPS</span>
                                            <span className="text-center">RIR/RPE</span>
                                        </div>
                                        {exercise.sets.map((set, setIndex) => (
                                            <div key={setIndex} className="bg-white dark:bg-gray-800 p-2 rounded">
                                                <div className="grid grid-cols-4 gap-2 items-center">
                                                    <span className="font-semibold flex items-center gap-2">
                                                        {set.isPR && <Award size={16} className="text-yellow-500" />}
                                                        #{set.set}
                                                    </span>
                                                    <span className="text-center">{set.weight}</span>
                                                    <span className="text-center">{set.reps}</span>
                                                    <span className="text-center">{set.effort}</span>
                                                </div>
                                                {set.note && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <MessageSquare size={14} />
                                                        <span>{set.note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
        </Card>
    );
}