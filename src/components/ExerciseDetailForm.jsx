import React, { useState, useEffect } from 'react';
import { Loader, Plus, Save } from 'lucide-react';

export default function ExerciseDetailForm({ exercise, onSave, onCancel, isSubmitting, mode = 'add' }) {
    const [details, setDetails] = useState({
        sets: '3',
        minReps: '8',
        maxReps: '12',
        restMinutes: '1',
        restSeconds: '30',
        restBetweenSidesMinutes: '0', // <-- NUEVO
        restBetweenSidesSeconds: '15' // <-- Actualizado
    });

    useEffect(() => {
        if (mode === 'edit' && exercise) {
            setDetails({
                sets: exercise.sets || '3',
                minReps: exercise.reps?.split('-')[0] || '8',
                maxReps: exercise.reps?.split('-')[1] || '12',
                restMinutes: exercise.restMinutes || '1',
                restSeconds: exercise.restSeconds || '30',
                restBetweenSidesMinutes: exercise.restBetweenSidesMinutes || '0', // <-- NUEVO
                restBetweenSidesSeconds: exercise.restBetweenSidesSeconds || '15' // <-- Actualizado
            });
        }
    }, [exercise, mode]);

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const exerciseData = {
            ...exercise,
            sets: details.sets,
            reps: `${details.minReps}-${details.maxReps}`,
            minReps: details.minReps,
            maxReps: details.maxReps,
            restMinutes: details.restMinutes,
            restSeconds: details.restSeconds,
            restBetweenSidesMinutes: details.restBetweenSidesMinutes, // <-- NUEVO
            restBetweenSidesSeconds: details.restBetweenSidesSeconds  // <-- Actualizado
        };
        onSave(exerciseData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-b-lg">
            <h4 className="font-semibold text-lg mb-4">Añadir detalles para: {exercise.name}</h4>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="sets" className="block text-sm font-medium">Series</label>
                        <input type="number" name="sets" id="sets" value={details.sets} onChange={handleChange} className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rango de Repeticiones</label>
                        <div className="flex items-center gap-2">
                            <input type="number" name="minReps" value={details.minReps} onChange={handleChange} placeholder="Min" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                            <span className="text-gray-500">-</span>
                            <input type="number" name="maxReps" value={details.maxReps} onChange={handleChange} placeholder="Max" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Descanso entre Series</label>
                    <div className="flex items-center gap-2">
                        <input type="number" name="restMinutes" value={details.restMinutes} onChange={handleChange} min="0" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                        <span className="text-sm">min</span>
                        <input type="number" name="restSeconds" value={details.restSeconds} onChange={handleChange} min="0" max="59" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                        <span className="text-sm">seg</span>
                    </div>
                </div>

                {exercise.isUnilateral && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Descanso entre Lados</label>
                        <div className="flex items-center gap-2">
                            <input type="number" name="restBetweenSidesMinutes" value={details.restBetweenSidesMinutes} onChange={handleChange} min="0" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                            <span className="text-sm">min</span>
                            <input type="number" name="restBetweenSidesSeconds" value={details.restBetweenSidesSeconds} onChange={handleChange} min="0" max="59" className="w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md" />
                            <span className="text-sm">seg</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-300 dark:border-gray-600">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 dark:bg-gray-500 rounded-lg font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader className="animate-spin" size={20} /> : (mode === 'add' ? <Plus size={20} /> : <Save size={20} />)}
                    {mode === 'add' ? 'Añadir a la Rutina' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}