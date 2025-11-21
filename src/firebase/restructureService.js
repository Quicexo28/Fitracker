import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from './config';

// Helper para limpiar nombres y usarlos como IDs válidos
// Firebase no permite '/' en los IDs de documentos
const sanitizeId = (name) => {
    if (!name) return 'unknown';
    return name.trim().replace(/\//g, "-"); 
};

/**
 * Reorganiza la base de datos usando SUBCOLECCIONES anidadas y NOMBRES como IDs.
 * Estructura:
 * muscle_groups/{NombreGrupo}/exercises/{NombreEjercicio}/variations/{NombreVariacion}/...
 */
export const restructureFromJSON = async (exercisesData) => {
    console.log("Iniciando reestructuración jerárquica con IDs Nominales...");

    if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
        alert("El archivo JSON no es válido o está vacío.");
        return;
    }

    try {
        let batch = writeBatch(db);
        let operationCounter = 0;
        let totalDocs = 0;

        // Función auxiliar para guardar lotes de 450 operaciones
        const commitBatchIfFull = async () => {
            if (operationCounter >= 450) {
                console.log("Guardando lote intermedio...");
                await batch.commit();
                batch = writeBatch(db); // Reiniciar batch
                operationCounter = 0;
            }
        };

        // 1. AGRUPACIÓN EN MEMORIA
        // Agrupamos todo el JSON por nombre de grupo muscular para procesarlo ordenadamente
        const groupedExercises = exercisesData.reduce((acc, ex) => {
            const group = (ex.muscleGroup || ex.groupName || 'Otros').trim();
            if (!acc[group]) acc[group] = [];
            acc[group].push(ex);
            return acc;
        }, {});

        // 2. PROCESAMIENTO DE ESCRITURA
        for (const [groupName, exercises] of Object.entries(groupedExercises)) {
            
            // --- NIVEL 1: GRUPO MUSCULAR ---
            // ID: Nombre del Grupo (ej: "Pecho")
            const groupId = sanitizeId(groupName);
            const muscleGroupRef = doc(db, 'muscle_groups', groupId);
            
            batch.set(muscleGroupRef, { name: groupName });
            operationCounter++; totalDocs++;
            await commitBatchIfFull();

            for (const ex of exercises) {
                // --- NIVEL 2: EJERCICIO ---
                // ID: Nombre del Ejercicio (ej: "Press Banca")
                const exerciseName = ex.name.trim();
                const exerciseId = sanitizeId(exerciseName);
                
                // Ruta: muscle_groups/Pecho/exercises/Press Banca
                const exerciseRef = doc(db, muscleGroupRef.path, 'exercises', exerciseId);
                
                batch.set(exerciseRef, {
                    name: exerciseName,
                    description: ex.description || null,
                    equipment: ex.equipment || null,
                    legacyId: ex.id || null // Guardamos el ID antiguo por seguridad
                });
                operationCounter++; totalDocs++;
                await commitBatchIfFull();

                // --- NIVEL 3: VARIACIONES ---
                if (ex.variations && Array.isArray(ex.variations)) {
                    for (const v of ex.variations) {
                        const variationName = v.name.trim();
                        const variationId = sanitizeId(variationName);

                        // Ruta: .../exercises/Press Banca/variations/Inclinado
                        const variationRef = doc(db, exerciseRef.path, 'variations', variationId);

                        batch.set(variationRef, {
                            name: variationName,
                            equipment: v.equipment || null,
                            legacyId: v.id || null
                        });
                        operationCounter++; totalDocs++;
                        await commitBatchIfFull();

                        // --- NIVEL 4: SUB-VARIACIONES ---
                        const subVars = v.subvariations || v.subVariations;
                        if (subVars && Array.isArray(subVars)) {
                            for (const sv of subVars) {
                                const subVarName = sv.name.trim();
                                const subVarId = sanitizeId(subVarName);

                                // Ruta: .../variations/Inclinado/subvariations/Mancuerna
                                const subVarRef = doc(db, variationRef.path, 'subvariations', subVarId);

                                batch.set(subVarRef, {
                                    name: subVarName,
                                    legacyId: sv.id || null
                                });
                                operationCounter++; totalDocs++;
                                await commitBatchIfFull();

                                // --- NIVEL 5: TIPOS DE EJECUCIÓN ---
                                const execTypes = sv.executionTypes || sv.execution_types;
                                if (execTypes && Array.isArray(execTypes)) {
                                    for (const et of execTypes) {
                                        const execName = et.name.trim();
                                        const execId = sanitizeId(execName);

                                        // Ruta: .../subvariations/Mancuerna/execution_types/Explosivo
                                        const execTypeRef = doc(db, subVarRef.path, 'execution_types', execId);

                                        batch.set(execTypeRef, {
                                            name: execName,
                                            legacyId: et.id || null
                                        });
                                        operationCounter++; totalDocs++;
                                        await commitBatchIfFull();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Guardar el último lote pendiente
        await batch.commit();
        
        console.log(`¡Reestructuración completada! Se crearon ${totalDocs} documentos.`);
        alert(`Proceso finalizado con éxito.\nSe han reestructurado ${totalDocs} elementos usando sus nombres como IDs.`);

    } catch (error) {
        console.error("Error crítico reestructurando:", error);
        alert(`Error: ${error.message}`);
    }
};