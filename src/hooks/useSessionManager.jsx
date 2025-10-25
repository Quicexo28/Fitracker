import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from '../context/AuthContext.jsx'; // Importa useAuth
import { useExercises } from './useExercises.jsx';

// ... (El resto de tus imports) ...
const generateSetId = () => `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;


export default function useSessionManager(routineId, existingSession = null, isEditing = false) {
    const [sessionExercises, setSessionExercises] = useState([]);
    const [originalRoutineExercises, setOriginalRoutineExercises] = useState([]);
    const [loading, setLoading] = useState(!isEditing);
    const [error, setError] = useState(null);
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [exerciseToReplaceId, setExerciseToReplaceId] = useState(null);

    // --- INICIO DE CORRECCIÓN ---
    const { user } = useAuth(); // Obtén el usuario del contexto
    // --- FIN DE CORRECCIÓN ---

    const { getExerciseNameById, loading: exercisesLoading, error: exercisesError } = useExercises();

    // useEffect para cargar rutina
    useEffect(() => {
        // --- INICIO DE CORRECCIÓN ---
        // Solo ejecuta si NO estamos editando, hay routineId Y hay usuario logueado
        if (isEditing || !routineId || !user) {
            setLoading(false); // Asegura que el loading se detenga si no hay usuario
            return;
        }
        // --- FIN DE CORRECCIÓN ---

        const fetchRoutine = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- INICIO DE CORRECCIÓN ---
                // Ahora sabemos que 'user' existe aquí
                const routineDocRef = doc(db, `users/${user.uid}/routines/${routineId}`);
                // --- FIN DE CORRECCIÓN ---
                const routineSnap = await getDoc(routineDocRef);

                if (!routineSnap.exists()) {
                    throw new Error("Rutina no encontrada.");
                }

                const exercisesQuery = query(collection(db, routineDocRef.path, 'exercises'), orderBy('addedAt', 'asc'));
                const exercisesSnap = await getDocs(exercisesQuery);
                const fetchedExercises = exercisesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const exercisesForSession = fetchedExercises.map(ex => ({
                    exerciseId: ex.id,
                    exerciseName: ex.baseName || ex.name,
                    variationName: ex.variationName || '',
                    isUnilateral: ex.isUnilateral || false,
                    supersetId: ex.supersetId || null,
                    supersetOrder: ex.supersetOrder ?? null,
                    sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
                        id: generateSetId(),
                        setNumber: i + 1,
                        weight: '',
                        reps: ex.reps || '',
                        effort: '',
                        completed: false,
                        note: '',
                        isPR: false,
                    }))
                }));

                setOriginalRoutineExercises(fetchedExercises);
                setSessionExercises(exercisesForSession);

            } catch (err) {
                console.error("Error cargando rutina:", err);
                setError(`Error al cargar la rutina: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutine();

    // --- INICIO DE CORRECCIÓN ---
    }, [routineId, isEditing, user]); // Añade 'user' como dependencia
    // --- FIN DE CORRECCIÓN ---


    // useEffect para cargar sesión existente (ya dependía de getExerciseNameById)
    useEffect(() => {
        // --- INICIO DE CORRECCIÓN ---
        // Asegúrate de que 'user' existe antes de procesar
        if (!user || !isEditing || !existingSession?.exercises) {
            // Si no hay usuario o sesión, asegúrate de que loading sea false
            if (isEditing) setLoading(false);
            return;
        }
        // --- FIN DE CORRECCIÓN ---

        const loadedExercises = existingSession.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: getExerciseNameById(ex.exerciseId), // Usa el hook
            variationName: ex.variationName || '',
            isUnilateral: ex.isUnilateral || false,
            supersetId: ex.supersetId || null,
            supersetOrder: ex.supersetOrder ?? null,
            sets: ex.sets.map(s => ({
                id: generateSetId(),
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
        setLoading(false);

    // --- INICIO DE CORRECCIÓN ---
    }, [isEditing, existingSession, getExerciseNameById, user]); // Añade 'user'
    // --- FIN DE CORRECCIÓN ---


    // ... (El resto de tus Callbacks: handleAddSet, handleRemoveSet, handleDeleteExercise, etc. no necesitan cambiar aquí) ...
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
                    if (ex.sets.length > 0) {
                        const lastSet = ex.sets[ex.sets.length - 1];
                        newSet.weight = lastSet.weight;
                        newSet.reps = lastSet.reps;
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
                    if (setIndexToRemove === -1) return ex;

                    removedSetInfo = { exerciseId, set: ex.sets[setIndexToRemove], index: setIndexToRemove };

                    const updatedSets = ex.sets.filter(set => set.id !== setIdToRemove)
                                             .map((set, index) => ({ ...set, setNumber: index + 1 }));
                    return { ...ex, sets: updatedSets };
                }
                return ex;
            })
        );
         return removedSetInfo;
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
            supersetId: null,
            supersetOrder: null,
            sets: Array.from({ length: newExerciseData.sets || 3 }, (_, i) => ({
                 id: generateSetId(),
                 setNumber: i + 1,
                 weight: '',
                 reps: newExerciseData.reps || '',
                 effort: '',
                 completed: false,
                 note: '',
                 isPR: false
            }))
        };

        if (exerciseToReplaceId) {
            setSessionExercises(prev => prev.map(ex =>
                ex.exerciseId === exerciseToReplaceId ? exerciseToAdd : ex
            ));
            setExerciseToReplaceId(null);
        } else {
            setSessionExercises(prev => [...prev, exerciseToAdd]);
        }
        setIsAddExerciseModalOpen(false);
    }, [exerciseToReplaceId]);

    const openReplaceModal = useCallback((exerciseId) => {
        setExerciseToReplaceId(exerciseId);
        setIsAddExerciseModalOpen(true);
    }, []);

    const openAddModal = useCallback(() => {
        setExerciseToReplaceId(null);
        setIsAddExerciseModalOpen(true);
    }, []);


    // Combinar estados de carga y error
    const finalLoading = loading || exercisesLoading;
    const finalError = error || exercisesError;

    return {
        sessionExercises,
        setSessionExercises,
        loading: finalLoading,
        error: finalError,
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