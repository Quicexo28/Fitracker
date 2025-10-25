import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config.js';
// import { getExerciseById as getOldExerciseById } from '../exercises.js'; // <-- CAMBIO: Comenta o elimina esta línea
import { useExercises } from './useExercises.jsx'; // <-- CAMBIO: Importa el nuevo hook

// ... (El resto de tus imports no cambian)

const generateSetId = () => `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

export default function useSessionManager(routineId, existingSession = null, isEditing = false) {
    const [sessionExercises, setSessionExercises] = useState([]);
    const [originalRoutineExercises, setOriginalRoutineExercises] = useState([]);
    const [loading, setLoading] = useState(!isEditing); // No cargues si estás editando una sesión existente
    const [error, setError] = useState(null);
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [exerciseToReplaceId, setExerciseToReplaceId] = useState(null); // Para saber qué ejercicio reemplazar

    // --- INICIO DE CAMBIOS ---
    const { getExerciseNameById, loading: exercisesLoading, error: exercisesError } = useExercises();
    // --- FIN DE CAMBIOS ---

    // ... (Tu useEffect para cargar la rutina no cambia) ...
    useEffect(() => {
        if (isEditing || !routineId) return; // No cargues rutina si editas sesión o no hay ID

        const fetchRoutine = async () => {
            setLoading(true);
            setError(null);
            try {
                const routineDocRef = doc(db, `users/${auth.currentUser.uid}/routines/${routineId}`); // Asumiendo que tienes acceso a auth.currentUser
                const routineSnap = await getDoc(routineDocRef);

                if (!routineSnap.exists()) {
                    throw new Error("Rutina no encontrada.");
                }

                const exercisesQuery = query(collection(db, routineDocRef.path, 'exercises'), orderBy('addedAt', 'asc'));
                const exercisesSnap = await getDocs(exercisesQuery);
                const fetchedExercises = exercisesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Prepara los ejercicios para la sesión
                const exercisesForSession = fetchedExercises.map(ex => ({
                    exerciseId: ex.id,
                    exerciseName: ex.baseName || ex.name, // Usa el nombre guardado en la rutina
                    variationName: ex.variationName || '',
                    isUnilateral: ex.isUnilateral || false,
                    supersetId: ex.supersetId || null,
                    supersetOrder: ex.supersetOrder ?? null,
                    // Crea los sets iniciales basados en la rutina
                    sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
                        id: generateSetId(),
                        setNumber: i + 1,
                        weight: '',
                        reps: ex.reps || '', // Usa las reps de la rutina si existen
                        effort: '',
                        completed: false,
                        note: '',
                        isPR: false, // Inicialmente no es PR
                    }))
                }));

                setOriginalRoutineExercises(fetchedExercises); // Guarda los originales por si acaso
                setSessionExercises(exercisesForSession);

            } catch (err) {
                console.error("Error cargando rutina:", err);
                setError(`Error al cargar la rutina: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutine();

    }, [routineId, isEditing]); // Dependencias: routineId y isEditing


    // Lógica para cargar sesión existente si estamos editando
    useEffect(() => {
        if (isEditing && existingSession?.exercises) {
            // Transforma los datos de la sesión existente al formato que necesita el UI
             const loadedExercises = existingSession.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                // --- INICIO DE CAMBIOS ---
                // Usa el nuevo hook para obtener el nombre
                exerciseName: getExerciseNameById(ex.exerciseId),
                // --- FIN DE CAMBIOS ---
                variationName: ex.variationName || '', // Asegúrate de tener esto
                isUnilateral: ex.isUnilateral || false,
                supersetId: ex.supersetId || null,
                supersetOrder: ex.supersetOrder ?? null,
                sets: ex.sets.map(s => ({
                    id: generateSetId(), // Genera un ID temporal para el UI
                    setNumber: s.set,
                    weight: s.weight || '',
                    reps: s.reps || '',
                    effort: s.effort || '',
                    completed: s.completed || false,
                    note: s.note || '',
                    isPR: s.isPR || false,
                }))
            }));
            setSessionExercises(loadedExercises);
            setLoading(false); // Marca como cargado
        }
    }, [isEditing, existingSession, getExerciseNameById]); // CAMBIO: Añadir getExerciseNameById


    // ... (El resto de tus funciones como handleAddSet, handleRemoveSet, etc., no cambian fundamentalmente) ...
    // ... Asegúrate de que cualquier lugar que usara getOldExerciseById ahora obtenga el nombre de otra forma (ya está en sessionExercises) ...

    const handleAddSet = useCallback((exerciseId) => {
        setSessionExercises(prevExercises =>
            prevExercises.map(ex => {
                if (ex.exerciseId === exerciseId) {
                    const nextSetNumber = ex.sets.length + 1;
                    const newSet = {
                        id: generateSetId(),
                        setNumber: nextSetNumber,
                        weight: '', reps: '', effort: '', completed: false, note: '', isPR: false
                    };
                    // Copia los valores del último set si existe
                    if (ex.sets.length > 0) {
                        const lastSet = ex.sets[ex.sets.length - 1];
                        newSet.weight = lastSet.weight;
                        newSet.reps = lastSet.reps;
                        // No copiamos effort, completed, note, isPR
                    }
                    return { ...ex, sets: [...ex.sets, newSet] };
                }
                return ex;
            })
        );
    }, []);

    const handleRemoveSet = useCallback((exerciseId, setIdToRemove) => {
        let removedSetInfo = null;
        setSessionExercises(prevExercises =>
            prevExercises.map(ex => {
                if (ex.exerciseId === exerciseId) {
                    const setIndexToRemove = ex.sets.findIndex(set => set.id === setIdToRemove);
                    if (setIndexToRemove === -1) return ex; // No encontrado

                    removedSetInfo = { exerciseId, set: ex.sets[setIndexToRemove], index: setIndexToRemove };

                    const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove)
                                             .map((set, index) => ({ ...set, setNumber: index + 1 })); // Renumerar sets
                    return { ...ex, sets: updatedSets };
                }
                return ex;
            })
        );
         return removedSetInfo; // Devuelve la info para el Undo
    }, []);


    const handleDeleteExercise = useCallback((exerciseIdToDelete) => {
        setSessionExercises(prev => prev.filter(ex => ex.exerciseId !== exerciseIdToDelete));
    }, []);

    const handleAddOrReplaceExercise = useCallback((newExerciseData) => {
        const exerciseToAdd = {
            exerciseId: newExerciseData.id,
            exerciseName: newExerciseData.baseName || newExerciseData.name,
            variationName: newExerciseData.variationName || '',
            isUnilateral: newExerciseData.isUnilateral || false,
            supersetId: null, // Los ejercicios añadidos no están en superset inicialmente
            supersetOrder: null,
            sets: Array.from({ length: newExerciseData.sets || 3 }, (_, i) => ({ // Usa sets del modal si existen
                 id: generateSetId(),
                 setNumber: i + 1,
                 weight: '',
                 reps: newExerciseData.reps || '', // Usa reps del modal si existen
                 effort: '',
                 completed: false,
                 note: '',
                 isPR: false
            }))
        };

        if (exerciseToReplaceId) {
            // Modo Reemplazo
            setSessionExercises(prev => prev.map(ex =>
                ex.exerciseId === exerciseToReplaceId ? exerciseToAdd : ex
            ));
            setExerciseToReplaceId(null); // Limpiar el ID de reemplazo
        } else {
            // Modo Añadir
            setSessionExercises(prev => [...prev, exerciseToAdd]);
        }
        setIsAddExerciseModalOpen(false); // Cierra el modal
    }, [exerciseToReplaceId]);

    const openReplaceModal = useCallback((exerciseId) => {
        setExerciseToReplaceId(exerciseId);
        setIsAddExerciseModalOpen(true);
    }, []);

    const openAddModal = useCallback(() => {
        setExerciseToReplaceId(null); // Asegura que estemos en modo añadir
        setIsAddExerciseModalOpen(true);
    }, []);


    // --- INICIO DE CAMBIOS ---
    // Combina los estados de carga
    const finalLoading = loading || exercisesLoading;
    const finalError = error || exercisesError;
    // --- FIN DE CAMBIOS ---

    return {
        sessionExercises,
        setSessionExercises, // Necesario para Undo
        loading: finalLoading, // CAMBIO: Usar carga combinada
        error: finalError,     // CAMBIO: Usar error combinado
        isAddExerciseModalOpen,
        setIsAddExerciseModalOpen,
        handleAddSet,
        handleRemoveSet,
        handleDeleteExercise,
        handleAddOrReplaceExercise,
        openReplaceModal,
        openAddModal
    };
}