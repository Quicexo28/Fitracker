import React, { useState, useMemo } from 'react';
import { saveMeasurement, deleteMeasurement } from '../firebase/measurementsService.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import MeasurementDetailModal from '../components/MeasurementDetailModal.jsx'; // Reutilizamos el modal
import { LineChart, Weight, Save, Trash2, Calendar, Edit2 } from 'lucide-react';

const formatFullDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
};
const formatChartDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const initialFormState = {
    weight: '', bodyFat: '', chest: '', waist: '', hips: '', arm: '', leg: '', neck: '', shoulders: '', forearm: '', calf: ''
};

// --- Sub-componente de Tarjeta de Entrada (simplificado) ---
const MeasurementInputCard = ({ measurement, formValue, onChange, onCardClick }) => {
    const { name, key, unit, currentValue } = measurement;

    return (
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 shadow-sm">
            <div className="flex justify-between items-start">
                <label htmlFor={key} className="text-sm font-medium text-gray-600 dark:text-gray-300">{name}</label>
                {/* Botón para abrir el gráfico detallado */}
                <button onClick={onCardClick} className="p-1 text-gray-400 hover:text-blue-500">
                    <LineChart size={18} />
                </button>
            </div>
            <input
                type="number"
                step="0.1"
                id={key}
                name={key}
                value={formValue}
                onChange={onChange}
                placeholder={currentValue ? `${currentValue} ${unit}` : `- ${unit}`}
                className="w-full bg-transparent text-2xl font-bold text-gray-900 dark:text-white border-none p-0 focus:ring-0 mt-1"
            />
        </div>
    );
};

export default function BodyMeasurementsView({ user }) {
    const [formState, setFormState] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    // --- Volvemos a usar el estado para el modal de detalle ---
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);

    const measurementsPath = useMemo(() => user ? `users/${user.uid}/measurements` : null, [user]);
    const { data: measurements, loading } = useFirestoreCollection(measurementsPath, { orderBy: 'measuredAt', direction: 'desc' });

    const measurementData = useMemo(() => {
        const definitions = [ { key: 'weight', name: 'Peso Corporal', unit: 'kg' }, { key: 'bodyFat', name: '% Grasa Corporal', unit: '%' }, { key: 'neck', name: 'Cuello', unit: 'cm' }, { key: 'shoulders', name: 'Hombros', unit: 'cm' }, { key: 'chest', name: 'Pecho', unit: 'cm' }, { key: 'arm', name: 'Brazo', unit: 'cm' }, { key: 'forearm', name: 'Antebrazo', unit: 'cm' }, { key: 'waist', name: 'Cintura', unit: 'cm' }, { key: 'hips', name: 'Cadera', unit: 'cm' }, { key: 'leg', name: 'Pierna', unit: 'cm' }, { key: 'calf', name: 'Pantorrilla', unit: 'cm' }, ];
        return definitions.map(def => {
            const history = measurements.filter(m => m[def.key] != null).map(m => ({ date: formatChartDate(m.measuredAt), value: m[def.key] })).reverse();
            const currentValue = history.length > 0 ? history[history.length - 1].value : null;
            return { ...def, currentValue, history };
        });
    }, [measurements]);

    const handleOpenDetailModal = (measurement) => {
        if (measurement.history.length > 0) {
            setSelectedMeasurement(measurement);
            setIsDetailModalOpen(true);
        }
    };

    const handleInputChange = (e) => { const { name, value } = e.target; setFormState(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = async (e) => { e.preventDefault(); if (Object.values(formState).every(val => !val)) { setError('Debes introducir al menos un valor.'); return; } setIsSubmitting(true); setError(''); try { await saveMeasurement(user.uid, formState); setFormState(initialFormState); } catch (err) { setError(err.message); } finally { setIsSubmitting(false); } };
    const openDeleteModal = (id) => { setItemToDelete(id); setIsDeleteModalOpen(true); };
    const handleDelete = async () => { if (itemToDelete) { await deleteMeasurement(user.uid, itemToDelete); setItemToDelete(null); setIsDeleteModalOpen(false); } };
    
    return (
        <div className="space-y-6">
            <MeasurementDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} measurement={selectedMeasurement} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Confirmar Eliminación" message="¿Estás seguro de que quieres eliminar este registro?" />

            <Card>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3"><Weight/> Registrar Mediciones</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {measurementData.map(m => (
                            <MeasurementInputCard
                                key={m.key}
                                measurement={m}
                                formValue={formState[m.key]}
                                onChange={handleInputChange}
                                onCardClick={() => handleOpenDetailModal(m)}
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-blue-400">
                            {isSubmitting ? 'Guardando...' : <><Save size={18}/> Guardar Nuevas Mediciones</> }
                        </button>
                    </div>
                </form>
            </Card>

            <Card>
                <h3 className="text-2xl font-bold mb-4">Historial de Registros</h3>
                {loading ? <ThemedLoader /> : (
                    <ul className="space-y-3">
                        {measurements.map(m => ( <li key={m.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-start"> <div> <p className="font-semibold flex items-center gap-2 mb-2"><Calendar size={14}/> {formatFullDate(m.measuredAt)}</p> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300"> {m.weight && <span><strong>Peso:</strong> {m.weight} kg</span>} {m.bodyFat && <span><strong>% Grasa:</strong> {m.bodyFat} %</span>} {m.neck && <span><strong>Cuello:</strong> {m.neck} cm</span>} {m.shoulders && <span><strong>Hombros:</strong> {m.shoulders} cm</span>} {m.chest && <span><strong>Pecho:</strong> {m.chest} cm</span>} {m.arm && <span><strong>Brazo:</strong> {m.arm} cm</span>} {m.forearm && <span><strong>Antebrazo:</strong> {m.forearm} cm</span>} {m.waist && <span><strong>Cintura:</strong> {m.waist} cm</span>} {m.hips && <span><strong>Cadera:</strong> {m.hips} cm</span>} {m.leg && <span><strong>Pierna:</strong> {m.leg} cm</span>} {m.calf && <span><strong>Pantorrilla:</strong> {m.calf} cm</span>} </div> </div> <button onClick={() => openDeleteModal(m.id)} className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 ml-4"> <Trash2 size={18} /> </button> </li> ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}   