import React, { useState, useMemo, memo } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { uploadImage } from '../firebase/imageService.js';
import { useExercises } from '../hooks/useExercises.jsx'; // <-- CAMBIO: Importar hook
import { Plus, X, Loader, Upload } from 'lucide-react';
import Card from './Card.jsx';
import toast from 'react-hot-toast';
import ThemedLoader from './ThemedLoader.jsx'; // <-- CAMBIO: Importar Loader

function AddExerciseModal({ isOpen, onClose, user, onExerciseCreated }) {
    const [exerciseName, setExerciseName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isUnilateral, setIsUnilateral] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const exercisesPath = useMemo(() => user ? `users/${user.uid}/exercises` : null, [user]);

    // --- INICIO DE CAMBIOS ---
    const { allMuscleGroups, loading, error } = useExercises();
    // --- FIN DE CAMBIOS ---

    const clearFormAndClose = () => {
        setExerciseName('');
        setMuscleGroup('');
        setImageFile(null);
        setIsUnilateral(false);
        setImagePreview(null);
        onClose();
    };
    
    // ... (El resto de tus funciones handleImageChange y handleAddExercise no cambian) ...
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleAddExercise = async (e) => {
        e.preventDefault();
        if (!exerciseName.trim() || !muscleGroup) {
            alert("Por favor, completa el nombre y el grupo muscular.");
            return;
        }
        setIsSubmitting(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const uploadPath = `users/${user.uid}/exercise_images`;
                imageUrl = await uploadImage(imageFile, uploadPath);
            }

            const newExerciseData = {
                name: exerciseName.trim(),
                group: muscleGroup,
                imageUrl: imageUrl,
                isUnilateral: isUnilateral,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, exercisesPath), newExerciseData);
            
            if (onExerciseCreated) {
                onExerciseCreated({ id: docRef.id, ...newExerciseData });
            }
            
            toast.success('¡Ejercicio añadido con éxito!');
            clearFormAndClose();
        } catch (error) {
            console.error("Error añadiendo ejercicio:", error);
            toast.error("Hubo un error al añadir el ejercicio.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Añadir Nuevo Ejercicio</h3>
                    <button onClick={clearFormAndClose} className="p-1" disabled={isSubmitting}><X /></button>
                </div>

                {/* --- INICIO DE CAMBIOS --- */}
                {loading && <ThemedLoader />}
                {error && <p className="text-red-500">Error al cargar grupos musculares.</p>}
                
                {!loading && !error && (
                <form onSubmit={handleAddExercise} className="space-y-4">
                    <div>
                        <label htmlFor="ex-name" className="block text-sm font-medium">Nombre del Ejercicio</label>
                        <input id="ex-name" type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} placeholder="Ej: Press Francés en Polea" className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md"/>
                    </div>
                     <div>
                        <label htmlFor="ex-group" className="block text-sm font-medium">Grupo Muscular</label>
                        <select id="ex-group" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)} className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-600 rounded-md">
                            <option value="">Selecciona un grupo...</option>
                            {/* CAMBIO: Usar allMuscleGroups del hook */}
                            {allMuscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    {/* ... (El resto de tu formulario no cambia) ... */}
                    <div className="flex items-center gap-2">
                        <input id="isUnilateral" type="checkbox" checked={isUnilateral} onChange={(e) => setIsUnilateral(e.target.checked)} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="isUnilateral" className="text-sm font-medium">Es un ejercicio unilateral</label>
                    </div>
                    <div>
                        <label htmlFor="ex-image-upload" className="block text-sm font-medium">Imagen del Ejercicio</label>
                        {imagePreview && (
                            <div className="mt-2 mb-4">
                                <img src={imagePreview} alt="Vista previa" className="w-32 h-32 object-cover rounded-lg mx-auto" />
                            </div>
                        )}
                        <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                           <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="ex-image-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                                        <span>Sube un archivo</span>
                                        <input id="ex-image-upload" name="ex-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                    <p className="pl-1">o arrástralo aquí</p>
                                </div>
                                {imageFile ? <p className="text-xs text-green-500">{imageFile.name}</p> : <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>}
                           </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={clearFormAndClose} className="px-5 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:bg-blue-400" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin" size={20} /> : <Plus />}
                            {isSubmitting ? 'Añadiendo...' : 'Añadir'}
                        </button>
                    </div>
                </form>
                )}
                {/* --- FIN DE CAMBIOS --- */}
            </Card>
        </div>
    );
}

export default memo(AddExerciseModal);