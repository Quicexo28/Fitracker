import React, { useState } from 'react';
import { saveWeekTemplate, deleteWeekTemplate } from '../firebase/weekTemplateService.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { Plus, Save, Trash2, ArrowLeft, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- CORRECCIÓN ESTRUCTURAL: El sub-componente AHORA ESTÁ FUERA del componente principal ---
// Esto asegura que los hooks (useState, useFirestoreCollection) se llamen correctamente.
const TemplateForm = ({ user, existingTemplate, onSave, onCancel }) => {
    const [name, setName] = useState(existingTemplate?.name || '');
    const [schedule, setSchedule] = useState(
        existingTemplate?.schedule || { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' }
    );
    const { data: routines, loading } = useFirestoreCollection(`users/${user.uid}/routines`);
    
    const weekdays = [ { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miércoles' }, { key: 'thu', label: 'Jueves' }, { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' }, { key: 'sun', label: 'Domingo' } ];

    const handleSave = () => {
        if (!name.trim()) {
            alert("La plantilla debe tener un nombre.");
            return;
        }
        onSave({ name, schedule });
    };

    const handleScheduleChange = (day, routineId) => {
        setSchedule(prev => ({ ...prev, [day]: routineId }));
    };

    if (loading) return <ThemedLoader />;

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4 space-y-4 border border-gray-200 dark:border-gray-600">
             <div>
                <label className="block text-sm font-medium">Nombre de la Plantilla</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Semana de Hipertrofia A" className="mt-1 w-full p-2 bg-white dark:bg-gray-600 rounded-md" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekdays.map(day => (
                    <div key={day.key}>
                        <label className="block text-xs font-medium mb-1">{day.label}</label>
                        <select value={schedule[day.key]} onChange={e => handleScheduleChange(day.key, e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded-md">
                            <option value="">Descanso</option>
                            {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-300 dark:bg-gray-500 rounded-md font-semibold">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 font-semibold"><Save size={16}/> Guardar Plantilla</button>
            </div>
        </div>
    );
};


// --- Componente principal de la vista ---
export default function WeekTemplatesView({ user }) {
    const { data: templates, loading } = useFirestoreCollection(`users/${user.uid}/weekTemplates`, { orderBy: 'name', direction: 'asc' });
    const [isCreating, setIsCreating] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deletingTemplate, setDeletingTemplate] = useState(null);

    const handleSave = async (templateData) => {
        const idToSave = editingTemplate ? editingTemplate.id : null;
        await saveWeekTemplate(user.uid, templateData, idToSave);
        setIsCreating(false);
        setEditingTemplate(null);
    };
    
    const handleDelete = async () => {
        if (deletingTemplate) {
            await deleteWeekTemplate(user.uid, deletingTemplate.id);
            setDeletingTemplate(null);
        }
    };

    const isFormOpen = isCreating || !!editingTemplate;

    return (
        <>
            <ConfirmationModal 
                isOpen={!!deletingTemplate}
                onClose={() => setDeletingTemplate(null)}
                onConfirm={handleDelete}
                title={deletingTemplate ? `Eliminar Plantilla: ${deletingTemplate.name}` : 'Confirmar Eliminación'}
                message="¿Estás seguro? Esta plantilla se eliminará permanentemente."
            />
            <Card>
                 <div className="flex justify-between items-center mb-4">
                    <div>
                        <Link to="/planificacion" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-2">
                            <ArrowLeft size={16}/> Volver al Planificador
                        </Link>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Semanas Plantilla</h2>
                    </div>
                    {!isFormOpen && (
                        <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-md font-semibold">
                           <Plus size={20} /> Crear Plantilla
                        </button>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400">Crea y gestiona tus semanas de entrenamiento reutilizables. Podrás aplicarlas rápidamente al construir tus mesociclos.</p>
                
                {isFormOpen && (
                    <TemplateForm
                        user={user}
                        existingTemplate={editingTemplate}
                        onSave={handleSave}
                        onCancel={() => { setIsCreating(false); setEditingTemplate(null); }}
                    />
                )}

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {loading && <ThemedLoader />}
                    {!loading && templates.length === 0 && !isFormOpen && (
                        <p className="text-center text-gray-500 py-8">No has creado ninguna plantilla de semana.</p>
                    )}
                    <ul className="space-y-3">
                        {templates.map(template => (
                             <li key={template.id} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                                <span className="font-semibold">{template.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingTemplate(template)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500"><Edit size={18}/></button>
                                    <button onClick={() => setDeletingTemplate(template)} className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
        </>
    );
}