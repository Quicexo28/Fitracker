// src/hooks/useExercises.jsx
import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useFirestoreCollection } from './useFirestoreCollection'; // Tu hook existente

// 1. Referencia a la nueva colección de Firestore
const exercisesCollection = collection(db, 'exercises');

export const useExercises = () => {
  // 2. Usa tu hook existente para obtener los datos de la colección
  const { data: exercises, loading, error } = useFirestoreCollection(exercisesCollection);

  // 3. Usamos useMemo para procesar los datos solo cuando cambien.
  //    Esto recrea las funciones de ayuda que tenías en 'src/exercises.js'
  const processedData = useMemo(() => {
    if (!exercises) {
      return {
        allExercises: [],
        getExerciseById: () => null,
        getVariationsForExercise: () => [],
        // Añade aquí cualquier otra función helper que necesites
      };
    }

    // Mapea los datos de Firestore (que incluyen el ID)
    const allExercises = exercises.map(doc => ({
      ...doc,
      id: doc.id, // Aseguramos que el ID de Firestore esté como 'id'
    }));

    const getExerciseById = (id) => {
      return allExercises.find(ex => ex.id === id) || null;
    };

    const getVariationsForExercise = (baseExerciseId) => {
      const baseEx = getExerciseById(baseExerciseId);
      if (!baseEx || !baseEx.variations) return [];

      return baseEx.variations.map(variation => ({
        ...variation,
        baseExerciseId: baseExerciseId, 
      }));
    };

    return { allExercises, getExerciseById, getVariationsForExercise };

  }, [exercises]); // Solo se recalcula si 'exercises' (los datos) cambia

  // 4. Retorna los datos procesados y el estado de carga/error
  return {
    ...processedData,
    loading,
    error,
  };
};