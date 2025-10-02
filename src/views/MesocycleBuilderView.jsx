import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { saveMesocycle } from '../firebase/mesocycleService.js';
import { saveWeekTemplate, deleteWeekTemplate } from '../firebase/weekTemplateService.js';
import useFirestoreCollection from '../hooks/useFirestoreCollection.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { Save, ArrowLeft, ArrowUp, ArrowDown, ChevronsUp, Plus, Trash2, Edit, ChevronDown, CheckSquare, Square } from 'lucide-react';
import { addMonths, format, eachWeekOfInterval } from 'date-fns';

const weekTypes = [
    { key: 'load', label: 'Carga', icon: ArrowUp, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
    { key: 'peak', label: 'Pico', icon: ChevronsUp, color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' },
    { key: 'deload', label: 'Descarga', icon: ArrowDown, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' },
];

const weekdays = [
    { key: 'mon', label: 'Lunes' }, { key: 'tue', label: 'Martes' }, { key: 'wed', label: 'Miércoles' },
    { key: 'thu', label: 'Jueves' }, { key: 'fri', label: 'Viernes' }, { key: 'sat', label: 'Sábado' }, { key: 'sun', label: 'Domingo' }
];

const TemplateForm = ({ user, existingTemplate, onSave, onCancel, routines }) => {
    const [name, setName] = useState(existingTemplate?.name || '');
    const [schedule, setSchedule] = useState(
        existingTemplate?.schedule || { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' }
    );
    const handleSave = () => { if (!name.trim()) { alert("La plantilla debe tener un nombre."); return; } onSave({ name, schedule }); };
    const handleScheduleChange = (day, routineId) => setSchedule(prev => ({ ...prev, [day]: routineId }));

    return ( <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4 space-y-4 border border-gray-200 dark:border-gray-600"> <div> <label className="block text-sm font-medium">Nombre de la Plantilla</label> <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Semana de Hipertrofia A" className="mt-1 w-full p-2 bg-white dark:bg-gray-600 rounded-md" /> </div> <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"> {weekdays.map(day => ( <div key={day.key}> <label className="block text-xs font-medium mb-1">{day.label}</label> <select value={schedule[day.key]} onChange={e => handleScheduleChange(day.key, e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-gray-600 rounded-md"> <option value="">Descanso</option> {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)} </select> </div> ))} </div> <div className="flex justify-end gap-2 pt-2"> <button onClick={onCancel} className="px-4 py-2 bg-gray-300 dark:bg-gray-500 rounded-md font-semibold">Cancelar</button> <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 font-semibold"><Save size={16}/> Guardar Plantilla</button> </div> </div> );
};

export default function MesocycleBuilderView({ user }) {
    const { mesocycleId } = useParams();
    const isEditMode = !!mesocycleId;
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [planStartDate, setPlanStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [durationInMonths, setDurationInMonths] = useState(1);
    const [weeks, setWeeks] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedWeekNumbers, setSelectedWeekNumbers] = useState(new Set());

    const { data: routines, loading: routinesLoading } = useFirestoreCollection(`users/${user.uid}/routines`);
    const { data: templates, loading: templatesLoading } = useFirestoreCollection(`users/${user.uid}/weekTemplates`, { orderBy: 'name', direction: 'asc' });
    const mesocyclePath = isEditMode ? `users/${user.uid}/mesocycles/${mesocycleId}` : null;
    const { document: existingMesocycle, loading: mesocycleLoading } = useFirestoreDocument(mesocyclePath);

    useEffect(() => {
        if (isEditMode && existingMesocycle) {
            setName(existingMesocycle.name || '');
            if (existingMesocycle.planStartDate) setPlanStartDate(format(existingMesocycle.planStartDate.toDate(), 'yyyy-MM-dd'));
            setDurationInMonths(existingMesocycle.durationInMonths || 1);
            setWeeks(existingMesocycle.weeks || []);
        }
    }, [isEditMode, existingMesocycle]);
    
    useEffect(() => {
        if (!planStartDate || !durationInMonths) {
            setWeeks([]);
            return;
        }
        const start = new Date(planStartDate + 'T00:00:00');
        const end = addMonths(start, parseInt(durationInMonths, 10));
        const weekIntervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        const totalWeeks = weekIntervals.length;

        setWeeks(prevWeeks => {
            const newWeeks = Array.from({ length: totalWeeks }, (_, index) => {
                const weekNumber = index + 1;
                const existingWeek = prevWeeks.find(w => w.number === weekNumber) || {};
                return {
                    number: weekNumber,
                    type: existingWeek.type || 'load',
                    schedule: existingWeek.schedule || { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' }
                };
            });
            if(selectedWeekIndex >= newWeeks.length) {
                setSelectedWeekIndex(0);
            }
            return newWeeks;
        });
    }, [planStartDate, durationInMonths]);

    const applyTemplate = (templateSchedule, targetWeeks) => {
        if (!templateSchedule) return;
        const newWeeks = weeks.map(week => {
            if (targetWeeks.includes(week.number)) {
                return { ...week, schedule: { ...templateSchedule } };
            }
            return week;
        });
        setWeeks(newWeeks);
    };

    const handleWeekClick = (weekIndex) => {
        if (isSelectionMode) {
            const weekNumber = weeks[weekIndex].number;
            const newSelection = new Set(selectedWeekNumbers);
            if (newSelection.has(weekNumber)) {
                newSelection.delete(weekNumber);
            } else {
                newSelection.add(weekNumber);
            }
            setSelectedWeekNumbers(newSelection);
        } else {
            const currentType = weeks[weekIndex].type;
            const currentIndex = weekTypes.findIndex(t => t.key === currentType);
            const nextIndex = (currentIndex + 1) % weekTypes.length;
            const nextTypeKey = weekTypes[nextIndex].key;
            
            const newWeeks = [...weeks];
            newWeeks[weekIndex].type = nextTypeKey;
            setWeeks(newWeeks);
            setSelectedWeekIndex(weekIndex);
        }
    };

    const handleApplyTemplateToSelection = () => {
        const templateId = document.getElementById('selection-template').value;
        if (!templateId) {
            alert("Por favor, selecciona una plantilla.");
            return;
        }
        const template = templates.find(t => t.id === templateId);
        if (template) {
            applyTemplate(template.schedule, Array.from(selectedWeekNumbers));
            setIsSelectionMode(false);
            setSelectedWeekNumbers(new Set());
        }
    };
    
    const handleApplyTemplateToWeek = (templateId) => {
        if (!templateId || selectedWeekIndex === null) return;
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const newWeeks = [...weeks];
            newWeeks[selectedWeekIndex].schedule = { ...template.schedule };
            setWeeks(newWeeks);
        }
    };
    
    const handleSaveTemplate = async (templateData) => {
        const idToSave = editingTemplate ? editingTemplate.id : null;
        await saveWeekTemplate(user.uid, templateData, idToSave);
        setIsCreatingTemplate(false);
        setEditingTemplate(null);
    };
    const handleDeleteTemplate = (templateId) => deleteWeekTemplate(user.uid, templateId);
    
    const handleSave = async () => {
        if (!name || !planStartDate || !durationInMonths) {
            alert("Por favor, completa todos los campos del plan.");
            return;
        }
        setIsSaving(true);
        const relevantWeeks = weeks.filter(w => Object.values(w.schedule).some(day => day !== ''));
        const mesocycleData = {
            name,
            planStartDate: new Date(planStartDate + 'T00:00:00'),
            durationInMonths: parseInt(durationInMonths, 10),
            weeks: relevantWeeks
        };
        try {
            await saveMesocycle(user.uid, mesocycleData, mesocycleId);
            navigate('/planificacion');
        } catch (error) {
            console.error("Error guardando el plan:", error);
            alert("Hubo un error al guardar el plan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (routinesLoading || mesocycleLoading || templatesLoading) return <ThemedLoader />;

    return (
        <Card>
            <Link to="/planificacion" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-4">
                <ArrowLeft size={16} /> Volver a Planificación
            </Link>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold">{isEditMode ? 'Editar Plan' : 'Crear Nuevo Plan'}</h2>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-md">
                    <Save size={20}/> {isSaving ? 'Guardando...' : 'Guardar Plan'}
                </button>
            </div>

            <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">1. Configuración del Mesociclo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Nombre del Plan</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Hipertrofia Bloque 1" className="mt-1 w-full p-2 bg-white dark:bg-gray-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="planStartDate" className="block text-sm font-medium">Fecha de Inicio</label>
                        <input type="date" id="planStartDate" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-gray-600 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium">Duración (Meses)</label>
                        <select id="duration" value={durationInMonths} onChange={e => setDurationInMonths(e.target.value)} className="mt-1 w-full p-2 bg-white dark:bg-gray-600 rounded-md">
                            {[1,2,3,4,5,6].map(m => <option key={m} value={m}>{m} mes{m > 1 ? 'es' : ''}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {weeks.length > 0 && (
                <div className="space-y-8">
                    <div>
                        <details className="group" onToggle={(e) => setShowTemplateManager(e.target.open)}>
                            <summary className="flex justify-between items-center cursor-pointer list-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <h3 className="text-xl font-semibold">2. Semanas Plantilla (Opcional)</h3>
                                <ChevronDown className="group-open:rotate-180 transition-transform" />
                            </summary>
                            {showTemplateManager && (
                                <div className="mt-4 pl-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Crea o edita plantillas para aplicarlas rápidamente a las semanas de tu plan.</p>
                                    {!isCreatingTemplate && !editingTemplate && (
                                        <button onClick={() => setIsCreatingTemplate(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 my-2">
                                            <Plus size={16} /> Crear Nueva Plantilla
                                        </button>
                                    )}
                                    {(isCreatingTemplate || editingTemplate) && (
                                        <TemplateForm user={user} existingTemplate={editingTemplate} onSave={handleSaveTemplate} onCancel={() => { setIsCreatingTemplate(false); setEditingTemplate(null); }} routines={routines} />
                                    )}
                                    <ul className="space-y-2 mt-4">
                                        {templates.map(t => (
                                            <li key={t.id} className="p-2 bg-gray-200 dark:bg-gray-800 rounded flex justify-between items-center">
                                                <span>{t.name}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingTemplate(t)} className="p-1"><Edit size={16}/></button>
                                                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1"><Trash2 size={16}/></button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </details>
                    </div>

                    <div>
                        <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
                            <h3 className="text-xl font-semibold">3. Planificador Visual</h3>
                            <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedWeekNumbers(new Set()); }} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md font-semibold ${isSelectionMode ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'}`}>
                                {isSelectionMode ? 'Cancelar Selección' : <><CheckSquare size={14}/> Seleccionar Múltiples</>}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {isSelectionMode ? 'Selecciona las semanas a las que quieres aplicar una plantilla.' : 'Haz clic en una semana para cambiar su fase y ver/editar sus detalles.'}
                        </p>
                        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900/50">
                            <div className="flex flex-wrap gap-2">
                                {weeks.map((week, weekIndex) => {
                                    const weekType = weekTypes.find(t => t.key === week.type) || weekTypes[0];
                                    const Icon = weekType.icon;
                                    const isSelectedForEditing = selectedWeekIndex === weekIndex && !isSelectionMode;
                                    const isSelectedInSelection = selectedWeekNumbers.has(week.number);
                                    return (
                                        <button key={week.number} onClick={() => handleWeekClick(weekIndex)} className={`${weekType.color} w-20 h-20 rounded-lg flex flex-col items-center justify-center text-center transition-all relative ${isSelectedForEditing ? 'ring-4 ring-offset-2 dark:ring-offset-gray-800 ring-blue-500' : 'ring-0'}`}>
                                            {isSelectionMode && (
                                                <div className="absolute top-1 right-1 p-0.5 bg-white dark:bg-gray-800 rounded">
                                                    {isSelectedInSelection ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-gray-400" />}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold">Sem. {week.number}</span>
                                            <Icon className="my-1" size={20} />
                                            <span className="text-[10px] uppercase">{weekType.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {isSelectionMode && selectedWeekNumbers.size > 0 && (
                             <div className="mt-4 p-3 bg-blue-600 text-white rounded-lg flex flex-wrap items-center justify-between gap-4 animate-fade-in">
                                <p className="font-semibold">{selectedWeekNumbers.size} semana(s) seleccionada(s)</p>
                                <div className="flex items-center gap-2">
                                     <select id="selection-template" className="p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md">
                                        <option value="">Selecciona plantilla...</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    <button onClick={handleApplyTemplateToSelection} className="px-4 py-2 text-sm bg-white text-blue-600 font-bold rounded-md whitespace-nowrap">Aplicar</button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {!isSelectionMode && selectedWeekIndex !== null && weeks[selectedWeekIndex] && (
                        <div>
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                <h3 className="text-xl font-semibold">Editando Semana {weeks[selectedWeekIndex].number}</h3>
                                <div className="flex items-center gap-2">
                                    <select onChange={(e) => { handleApplyTemplateToWeek(e.target.value); e.target.value = ""; }} className="p-1.5 text-xs bg-white dark:bg-gray-700 rounded-md">
                                        <option value="">Aplicar plantilla...</option>
                                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700">
                                {weekdays.map(day => (
                                    <div key={day.key}>
                                        <label className="block text-xs font-medium mb-1 text-gray-500">{day.label}</label>
                                        <select value={weeks[selectedWeekIndex].schedule[day.key]} onChange={e => handleScheduleChange(selectedWeekIndex, day.key, e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-gray-700 rounded-md border-gray-300 dark:border-gray-600">
                                            <option value="">Descanso</option>
                                            {routines.map(routine => ( <option key={routine.id} value={routine.id}>{routine.name}</option> ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}