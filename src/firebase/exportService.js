import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';

/**
 * Descarga todos los ejercicios de la colección especificada a un archivo JSON.
 * @param {string} collectionPath - Ruta de la colección en Firebase (ej. 'exercises' o 'users/UID/exercises')
 */
export const exportExercisesToJSON = async (collectionPath = 'exercises') => {
    console.log(`Iniciando exportación de: ${collectionPath}...`);
    
    try {
        const querySnapshot = await getDocs(collection(db, collectionPath));
        const exercises = [];

        querySnapshot.forEach((doc) => {
            // Incluimos el ID del documento dentro del objeto
            exercises.push({ id: doc.id, ...doc.data() });
        });

        if (exercises.length === 0) {
            alert('No se encontraron ejercicios en la colección para exportar.');
            return;
        }

        // 1. Convertir a texto JSON formateado
        const jsonString = JSON.stringify(exercises, null, 2);

        // 2. Crear un Blob (archivo en memoria)
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 3. Crear un enlace temporal para descargar
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exercises_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        // 4. Simular clic
        document.body.appendChild(link);
        link.click();

        // 5. Limpieza
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`Exportados ${exercises.length} ejercicios correctamente.`);
        alert(`¡Éxito! Se han descargado ${exercises.length} ejercicios.`);

    } catch (error) {
        console.error("Error al exportar ejercicios:", error);
        alert(`Hubo un error al exportar: ${error.message}`);
    }
};