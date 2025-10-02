import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext.jsx';
import { saveUserPreferences } from '../firebase/settingsService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Link } from 'react-router-dom';

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

    if (contextLoading || !preferences) return <ThemedLoader />;

    return (
        <Card>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Ajustes</h2>
            <form onSubmit={handleSave} className="space-y-10">
                <div className="space-y-3">
                    <h3 className="text-xl font-semibold border-b pb-2">Perfil Público</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configura cómo te verán otros usuarios cuando compartas rutinas.</p>
                    <Link to="/perfil/configurar" className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600">
                        Editar mi perfil
                    </Link>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xl font-semibold border-b pb-2">Preferencias de Entrenamiento</h3>
                    <div className="space-y-4 pt-2">
                        <div>
                            <h4 className="text-lg font-medium">Unidad de Peso</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Elige la unidad para registrar el peso.</p>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.weightUnit === 'kg' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                    <input type="radio" name="weightUnit" value="kg" checked={preferences.weightUnit === 'kg'} onChange={handleChange} className="h-4 w-4 text-blue-600" />
                                    Kilogramos (kg)
                                </label>
                                <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.weightUnit === 'lbs' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                    <input type="radio" name="weightUnit" value="lbs" checked={preferences.weightUnit === 'lbs'} onChange={handleChange} className="h-4 w-4 text-blue-600" />
                                    Libras (lbs)
                                </label>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-medium">Métrica de Esfuerzo</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Elige cómo medir la intensidad del esfuerzo.</p>
                            <div className="flex gap-4">
                                <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.effortMetric === 'rir' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}><input type="radio" name="effortMetric" value="rir" checked={preferences.effortMetric === 'rir'} onChange={handleChange} className="h-4 w-4 text-blue-600" />RIR (Reps in Reserve)</label>
                                <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 ${preferences.effortMetric === 'rpe' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-300 dark:border-gray-600'}`}><input type="radio" name="effortMetric" value="rpe" checked={preferences.effortMetric === 'rpe'} onChange={handleChange} className="h-4 w-4 text-blue-600" />RPE (Rate of Perceived Exertion)</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xl font-semibold border-b pb-2">Módulos de la Aplicación</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Activa o desactiva las funciones avanzadas.</p>
                    <div className="space-y-3 pt-2">
                        <FeatureToggle label="Módulo de Mediciones" description="Registra y visualiza tu peso y medidas corporales." isEnabled={preferences.features.measurements} onToggle={() => handleFeatureToggle('measurements')} />
                        <FeatureToggle label="Módulo de Analíticas" description="Accede a un dashboard con calendario y estadísticas." isEnabled={preferences.features.analytics} onToggle={() => handleFeatureToggle('analytics')} />
                        <FeatureToggle label="Módulo de Planificación" description="Crea mesociclos y planifica tus entrenamientos." isEnabled={preferences.features.planning} onToggle={() => handleFeatureToggle('planning')} />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400">
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    {feedback && <p className="text-sm text-green-600 dark:text-green-400">{feedback}</p>}
                </div>
            </form>
        </Card>
    );
}