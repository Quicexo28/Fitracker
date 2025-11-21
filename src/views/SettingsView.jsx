import React, { useState, useEffect, useRef } from 'react';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { saveUserPreferences } from '../firebase/settingsService.js';
import { exportExercisesToJSON } from '../firebase/exportService.js';
import { restructureFromJSON } from '../firebase/restructureService.js';
import { isUserAdmin } from '../utils/admin.js'; // <--- Importar validador de admin
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Link } from 'react-router-dom';
import { Download, Database, AlertTriangle, Upload, Lock } from 'lucide-react';

const FeatureToggle = ({ label, description, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
        <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

export default function SettingsView({ user }) {
    const { preferences: contextPreferences, updatePreferences, loading: contextLoading } = usePreferences();
    const [preferences, setPreferences] = useState(null);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Verificar si es administrador
    const isAdmin = isUserAdmin(user);

    // Referencia para el input de archivo oculto
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (contextPreferences) {
            setPreferences(contextPreferences);
        }
    }, [contextPreferences]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFeedback('');
        try {
            await saveUserPreferences(user.uid, preferences);
            updatePreferences(preferences);
            setFeedback('¡Ajustes guardados con éxito!');
        } catch (error) {
            setFeedback('Error al guardar los ajustes.');
            console.error("Error saving preferences:", error);
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(''), 3000);
        }
    };
    
    const handleFeatureToggle = (featureName) => {
        setPreferences(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [featureName]: !prev.features[featureName],
            }
        }));
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    // --- FUNCIONES DE ADMIN ---
    const handleExport = () => {
        // Ajusta 'exercises' si usas otro nombre de colección raíz en el futuro
        if (window.confirm("¿Deseas descargar una copia local de tus ejercicios en JSON?")) {
            exportExercisesToJSON('exercises'); // O la colección que desees exportar
        }
    };

    const handleRestructureClick = () => {
        const confirm = window.confirm(
            "PELIGRO (ADMIN): Vas a reestructurar la base de datos usando un archivo JSON local.\n\n" +
            "Esto creará/sobrescribirá las colecciones: muscle_groups, exercises, variations, etc.\n" +
            "Asegúrate de seleccionar el archivo de respaldo correcto.\n\n" +
            "¿Continuar?"
        );
        if (confirm && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonContent = e.target.result;
                const exercisesData = JSON.parse(jsonContent);
                
                setIsProcessing(true);
                await restructureFromJSON(exercisesData);
            } catch (error) {
                console.error("Error procesando el archivo JSON:", error);
                alert("Error al leer el archivo JSON. Asegúrate de que el formato sea correcto.");
            } finally {
                setIsProcessing(false);
                event.target.value = ''; 
            }
        };
        reader.readAsText(file);
    };

    if (contextLoading || !preferences) return <ThemedLoader />;

    return (
        <div className="pb-20">
            <Card>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Ajustes</h2>
                <form onSubmit={handleSave} className="space-y-10">
                    
                    {/* --- Perfil Público --- */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold border-b pb-2">Perfil Público</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configura cómo te verán otros usuarios.</p>
                        <Link to="/perfil/configurar" className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                            Editar mi perfil
                        </Link>
                    </div>

                    {/* --- Preferencias --- */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold border-b pb-2">Preferencias</h3>
                        <div className="space-y-4 pt-2">
                             <div>
                                <h4 className="text-lg font-medium">Unidad de Peso</h4>
                                <div className="flex gap-4 mt-2">
                                    <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.weightUnit === 'kg' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                        <input type="radio" name="weightUnit" value="kg" checked={preferences.weightUnit === 'kg'} onChange={handleChange} className="h-4 w-4 text-blue-600" /> Kilogramos (kg)
                                    </label>
                                    <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.weightUnit === 'lbs' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                        <input type="radio" name="weightUnit" value="lbs" checked={preferences.weightUnit === 'lbs'} onChange={handleChange} className="h-4 w-4 text-blue-600" /> Libras (lbs)
                                    </label>
                                </div>
                            </div>
                             <div>
                                <h4 className="text-lg font-medium">Métrica de Esfuerzo</h4>
                                <div className="flex gap-4 mt-2">
                                    <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.effortMetric === 'rir' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}><input type="radio" name="effortMetric" value="rir" checked={preferences.effortMetric === 'rir'} onChange={handleChange} className="h-4 w-4 text-blue-600" /> RIR</label>
                                    <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.effortMetric === 'rpe' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}><input type="radio" name="effortMetric" value="rpe" checked={preferences.effortMetric === 'rpe'} onChange={handleChange} className="h-4 w-4 text-blue-600" /> RPE</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Módulos --- */}
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold border-b pb-2">Módulos</h3>
                        <div className="space-y-3 pt-2">
                            <FeatureToggle label="Módulo de Mediciones" description="Registra peso y medidas." isEnabled={preferences.features.measurements} onToggle={() => handleFeatureToggle('measurements')} />
                            <FeatureToggle label="Módulo de Analíticas" description="Estadísticas y calendario." isEnabled={preferences.features.analytics} onToggle={() => handleFeatureToggle('analytics')} />
                            <FeatureToggle label="Módulo de Planificación" description="Mesociclos y rutinas." isEnabled={preferences.features.planning} onToggle={() => handleFeatureToggle('planning')} />
                        </div>
                    </div>

                    {/* --- ZONA ADMIN: GESTIÓN DE DATOS --- */}
                    {isAdmin && (
                        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Lock size={20} /> Administración de Base de Datos
                            </h3>
                            
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Exportar */}
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">Copia de Seguridad</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Descarga tus ejercicios actuales en JSON.</p>
                                    </div>
                                    <button type="button" onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
                                        <Download size={18} /> Exportar JSON
                                    </button>
                                </div>

                                {/* Reestructurar desde JSON */}
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                            <AlertTriangle size={16} /> Restaurar/Reestructurar
                                        </h4>
                                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
                                            Carga <code>exercises_backup.json</code> para reconstruir la base de datos.
                                        </p>
                                    </div>
                                    
                                    {/* Input oculto para el archivo */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".json"
                                        style={{ display: 'none' }}
                                    />

                                    <button 
                                        type="button" 
                                        onClick={handleRestructureClick} 
                                        disabled={isProcessing}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                    >
                                        <Upload size={18} />
                                        {isProcessing ? 'Procesando...' : 'Cargar JSON y Ejecutar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Botón Guardar --- */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400">
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        {feedback && <p className="text-sm text-green-600 dark:text-green-400">{feedback}</p>}
                    </div>
                </form>
            </Card>
        </div>
    );
}