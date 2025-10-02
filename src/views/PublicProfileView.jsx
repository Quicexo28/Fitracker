import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { User, Dumbbell } from 'lucide-react';

export default function PublicProfileView() {
    const { userId } = useParams();

    // Cargar los datos del perfil del usuario que estamos visitando
    const { document: profile, loading: profileLoading } = useFirestoreDocument(`users/${userId}`);
    
    // --- CORRECCIÓN AQUÍ: 'routinas' a 'routines' ---
    const { data: sharedRoutines, loading: routinesLoading } = useFirestoreCollection(
        `users/${userId}/routines`, // Ruta corregida
        { where: ["isShared", "==", true] }
    );

    if (profileLoading || routinesLoading) {
        return <ThemedLoader />;
    }

    if (!profile) {
        return <Card><h2 className="text-center">Este perfil de usuario no existe.</h2></Card>;
    }

    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <User size={48} className="text-gray-500" />
                </div>
                <h2 className="text-3xl font-bold">
                    {profile.displayName}
                </h2>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-xl font-semibold text-center mb-4">Rutinas Compartidas</h3>
                {sharedRoutines.length > 0 ? (
                    <ul className="space-y-3">
                        {sharedRoutines.map(routine => (
                            <li key={routine.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                <Link to={`/rutina/${routine.id}`} className="font-semibold hover:text-blue-500">
                                    {routine.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-6">
                        {profile.displayName} aún no ha compartido ninguna rutina.
                    </p>
                )}
            </div>
        </Card>
    );
}