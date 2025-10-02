import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import { importRoutine } from '../firebase/sharingService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Users, Download, User, Star, Loader } from 'lucide-react';

const PublicRoutineCard = ({ routine, onImport, isImporting }) => {
    return (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow flex flex-col justify-between">
            <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{routine.name}</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <User size={14} /> Creado por {routine.authorName}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                    <Star size={14} /> Importado {routine.importCount} veces
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => onImport(routine.id)} 
                    disabled={isImporting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400"
                >
                    {isImporting ? <Loader className="animate-spin" size={20}/> : <Download size={16}/>}
                    Importar
                </button>
                {/* Futuro enlace para ver detalles de la rutina pública */}
                {/* <Link to={`/comunidad/rutina/${routine.id}`} className="flex-1 text-center px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold">Ver</Link> */}
            </div>
        </div>
    );
};

export default function CommunityView() {
    const { user } = useAuth();
    const { data: publicRoutines, loading } = useFirestoreCollection('publicRoutines', { orderBy: 'sharedAt', direction: 'desc' });
    const [importingId, setImportingId] = useState(null);

    const handleImport = async (routineId) => {
        setImportingId(routineId);
        try {
            await importRoutine(routineId, user.uid);
            alert("¡Rutina importada con éxito a 'Mis Rutinas'!");
        } catch (error) {
            console.error("Error al importar rutina:", error);
            alert(error.message);
        } finally {
            setImportingId(null);
        }
    };

    return (
        <Card>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Users /> Explorar Rutinas
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Descubre e importa rutinas compartidas por otros usuarios.
                </p>
            </div>

            {loading && <ThemedLoader />}
            
            {!loading && publicRoutines.length === 0 && (
                <p className="text-center text-gray-500 py-10">Aún no se han compartido rutinas en la comunidad.</p>
            )}

            {!loading && publicRoutines.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicRoutines.map(routine => (
                        <PublicRoutineCard 
                            key={routine.id} 
                            routine={routine} 
                            onImport={handleImport} 
                            isImporting={importingId === routine.id}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
}