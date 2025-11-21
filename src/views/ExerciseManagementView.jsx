import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext.jsx'; // Obtener user para verificar admin
import { isUserAdmin } from '../utils/admin.js';      // Importar utilidad de admin
import Card from '../components/Card';
import ThemedLoader from '../components/ThemedLoader';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
    ChevronRight, FolderPlus, Edit2, Trash2, ArrowLeft, 
    Dumbbell, Layers, Activity, FileText, Lock 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Configuración de la jerarquía de colecciones
const HIERARCHY = [
    { level: 0, collection: 'muscle_groups', label: 'Grupos Musculares', icon: Dumbbell },
    { level: 1, collection: 'exercises', label: 'Ejercicios', icon: Activity },
    { level: 2, collection: 'variations', label: 'Variaciones', icon: Layers },
    { level: 3, collection: 'subvariations', label: 'Sub-variaciones', icon: FileText },
    { level: 4, collection: 'execution_types', label: 'Tipos de Ejecución', icon: Activity }
];

export default function ExerciseManagementView() {
    const { user } = useAuth();
    const isAdmin = isUserAdmin(user); // Validar permisos

    const [currentLevel, setCurrentLevel] = useState(0);
    const [pathHistory, setPathHistory] = useState([]); // [{id, name, collection}]
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modales y Formularios
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [deletingItem, setDeletingItem] = useState(null);

    // --- 1. Fetch Data ---
    const fetchItems = async () => {
        setLoading(true);
        try {
            let collectionRef;
            
            if (currentLevel === 0) {
                // Raíz: muscle_groups
                collectionRef = collection(db, 'muscle_groups');
            } else {
                // Construir ruta anidada: muscle_groups/ID/exercises/ID/variations...
                let fullPath = pathHistory.reduce((acc, curr, index) => {
                     return `${acc}/${HIERARCHY[index].collection}/${curr.id}`;
                }, '');
                if (fullPath.startsWith('/')) fullPath = fullPath.substring(1);
                
                collectionRef = collection(db, `${fullPath}/${HIERARCHY[currentLevel].collection}`);
            }

            const snapshot = await getDocs(collectionRef);
            const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Ordenar alfabéticamente
            fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
            setItems(fetchedItems);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar la lista.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [currentLevel, pathHistory]);

    // --- 2. Navegación ---
    const handleEnterLevel = (item) => {
        if (currentLevel >= HIERARCHY.length - 1) return; 
        setPathHistory([...pathHistory, item]);
        setCurrentLevel(prev => prev + 1);
    };

    const handleGoBack = () => {
        if (currentLevel === 0) return;
        const newHistory = [...pathHistory];
        newHistory.pop();
        setPathHistory(newHistory);
        setCurrentLevel(prev => prev - 1);
    };

    // --- 3. Acciones CRUD (Protegidas) ---
    const handleSave = async (e) => {
        e.preventDefault();
        if (!isAdmin) return; // Protección extra
        if (!formData.name.trim()) return;

        setIsModalOpen(false);
        const loadingToast = toast.loading(editingItem ? "Actualizando..." : "Creando...");

        try {
            let collectionPath;
            if (currentLevel === 0) {
                collectionPath = 'muscle_groups';
            } else {
                const parentPath = pathHistory.reduce((acc, curr, index) => {
                     return `${acc}/${HIERARCHY[index].collection}/${curr.id}`;
                }, '').substring(1);
                collectionPath = `${parentPath}/${HIERARCHY[currentLevel].collection}`;
            }
            
            const colRef = collection(db, collectionPath);

            if (editingItem) {
                await updateDoc(doc(db, collectionPath, editingItem.id), {
                    name: formData.name
                });
                toast.success("Actualizado", { id: loadingToast });
            } else {
                await addDoc(colRef, {
                    name: formData.name,
                    createdAt: serverTimestamp(),
                    ...(currentLevel > 0 && { parentId: pathHistory[currentLevel-1].id })
                });
                toast.success("Creado", { id: loadingToast });
            }
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar", { id: loadingToast });
        }
    };

    const handleDelete = async () => {
        if (!deletingItem || !isAdmin) return; // Protección extra
        
        let collectionPath;
        if (currentLevel === 0) {
            collectionPath = 'muscle_groups';
        } else {
            const parentPath = pathHistory.reduce((acc, curr, index) => {
                    return `${acc}/${HIERARCHY[index].collection}/${curr.id}`;
            }, '').substring(1);
            collectionPath = `${parentPath}/${HIERARCHY[currentLevel].collection}`;
        }

        try {
            await deleteDoc(doc(db, collectionPath, deletingItem.id));
            toast.success("Eliminado");
            setDeletingItem(null);
            fetchItems();
        } catch (error) {
            console.error(error);
            toast.error("Error. Puede tener sub-elementos.", { duration: 4000 });
        }
    };

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name });
        setIsModalOpen(true);
    };

    const CurrentIcon = HIERARCHY[currentLevel].icon;

    return (
        <div className="space-y-6 pb-20">
            {/* Modal Crear/Editar (Solo Admin) */}
            {isAdmin && isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">
                            {editingItem ? 'Editar' : 'Nuevo'} {HIERARCHY[currentLevel].label}
                        </h3>
                        <form onSubmit={handleSave}>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Nombre"
                                className="w-full p-2 border rounded mb-4 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmación (Solo Admin) */}
            {isAdmin && (
                <ConfirmationModal 
                    isOpen={!!deletingItem}
                    onClose={() => setDeletingItem(null)}
                    title="¿Eliminar elemento?"
                    message={`Vas a eliminar "${deletingItem?.name}".`}
                    onConfirm={handleDelete}
                    confirmText="Sí, Eliminar"
                />
            )}

            <Card>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
                    <button 
                        onClick={() => { setPathHistory([]); setCurrentLevel(0); }}
                        className={`hover:text-blue-500 ${currentLevel === 0 ? 'font-bold text-blue-600' : ''}`}
                    >
                        Inicio
                    </button>
                    {pathHistory.map((item, idx) => (
                        <React.Fragment key={item.id}>
                            <ChevronRight size={14} />
                            <span className={idx === pathHistory.length - 1 ? 'font-bold' : ''}>
                                {item.name}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                {/* Header de Nivel */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        {currentLevel > 0 && (
                            <button onClick={handleGoBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CurrentIcon className="text-blue-500" />
                                {HIERARCHY[currentLevel].label}
                                {!isAdmin && <Lock size={16} className="text-gray-400 ml-2" title="Solo lectura" />}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {currentLevel === 0 ? 'Explorador de ejercicios' : `Dentro de: ${pathHistory[pathHistory.length-1].name}`}
                            </p>
                        </div>
                    </div>
                    
                    {/* Botón Nuevo (Solo Admin) */}
                    {isAdmin && (
                        <button 
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                        >
                            <FolderPlus size={18} /> <span className="hidden sm:inline">Nuevo</span>
                        </button>
                    )}
                </div>

                {/* Lista de Items */}
                {loading ? (
                    <ThemedLoader />
                ) : items.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p>No hay elementos aquí.</p>
                        {isAdmin && <button onClick={openCreateModal} className="text-blue-500 hover:underline mt-2">Crear el primero</button>}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all group"
                            >
                                {/* Área Clicable (Entrar al nivel) - Accesible para TODOS */}
                                <button 
                                    onClick={() => handleEnterLevel(item)}
                                    className="flex-grow text-left flex items-center gap-3"
                                >
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                                        {currentLevel < HIERARCHY.length - 1 ? <ChevronRight size={18} /> : <Activity size={18} />}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white text-lg">{item.name}</span>
                                </button>

                                {/* Botones de Acción (Solo Admin) */}
                                {isAdmin && (
                                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openEditModal(item)}
                                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => setDeletingItem(item)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}