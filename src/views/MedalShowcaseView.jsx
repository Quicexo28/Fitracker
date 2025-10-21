import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Award, Check, Save, ArrowLeft, Lock } from 'lucide-react';

export default function MedalShowcaseView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [allMedals, setAllMedals] = useState([]);
    const [selectedMedals, setSelectedMedals] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchMedals = async () => {
            if (user) {
                try {
                    const userRef = doc(db, `users/${user.uid}`);
                    const profileDoc = await getDoc(userRef);
                    const currentShowcase = profileDoc.data()?.showcasedMedals || [];
                    setSelectedMedals(new Set(currentShowcase));

                    const achievementDefsSnap = await getDocs(collection(db, 'achievements'));
                    const achievementDefs = achievementDefsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                    const userAchievementsSnap = await getDocs(collection(db, `users/${user.uid}/userAchievements`));
                    const userAchievements = new Map(userAchievementsSnap.docs.map(d => [d.id, d.data()]));

                    const medals = achievementDefs.map(achDef => {
                        const userAch = userAchievements.get(achDef.id);
                        
                        // Ordena los tiers por threshold ascendente para facilitar encontrar el actual y el siguiente
                        const sortedTiers = [...achDef.tiers].sort((a, b) => a.threshold - b.threshold);

                        if (userAch) {
                            const tierInfo = sortedTiers.find(t => t.level === userAch.unlockedTier);
                            const currentLevelIndex = sortedTiers.findIndex(t => t.level === userAch.unlockedTier);
                            const nextTier = sortedTiers[currentLevelIndex + 1]; // Puede ser undefined si es Oro

                            return {
                                id: achDef.id,
                                name: tierInfo?.medalName || achDef.name,
                                description: achDef.description,
                                tier: userAch.unlockedTier,
                                unlocked: true,
                                progress: userAch.progress || 0,
                                currentThreshold: tierInfo?.threshold || 0,
                                nextThreshold: nextTier?.threshold,
                            };
                        } else {
                            const firstTier = sortedTiers[0];
                            return {
                                id: achDef.id,
                                name: firstTier?.medalName || achDef.name,
                                description: achDef.description,
                                tier: 'Bloqueada',
                                unlocked: false,
                                progress: userAchievements.get(achDef.id)?.progress || 0, // Muestra progreso aunque esté bloqueado
                                currentThreshold: 0,
                                nextThreshold: firstTier?.threshold,
                            };
                        }
                    });

                    setAllMedals(medals);
                } catch (error) {
                    console.error("Error fetching medals:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchMedals();
    }, [user]);

    const calculateProgressPercent = (medal) => {
        if (!medal.nextThreshold) return medal.unlocked ? 100 : 0; // Si no hay siguiente nivel, 100% si está desbloqueado, 0% si no
        if (medal.nextThreshold === 0) return 100; // Evitar división por cero

        // Progreso relativo al rango entre el umbral actual y el siguiente
        const progressSinceLastTier = Math.max(0, medal.progress - medal.currentThreshold);
        const totalNeededForNextTier = medal.nextThreshold - medal.currentThreshold;
        
        if (totalNeededForNextTier <= 0) return 100; // Si el rango es 0 o negativo, ya se superó

        return Math.min(100, (progressSinceLastTier / totalNeededForNextTier) * 100);
    };

    const handleSelect = (medalId, isUnlocked) => {
        if (!isUnlocked) {
            alert("No puedes destacar una medalla que aún no has desbloqueado.");
            return;
        }
        const newSelection = new Set(selectedMedals);
        if (newSelection.has(medalId)) {
            newSelection.delete(medalId);
        } else {
            if (newSelection.size < 3) {
                newSelection.add(medalId);
            } else {
                alert("Solo puedes destacar un máximo de 3 medallas.");
            }
        }
        setSelectedMedals(newSelection);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                showcasedMedals: Array.from(selectedMedals)
            });
            navigate('/perfil');
        } catch (error) {
            console.error("Error saving showcased medals:", error);
            alert("Hubo un error al guardar tu selección.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <ThemedLoader />;

    return (
        <Card>
            <Link to="/perfil" className="flex items-center gap-2 text-sm text-blue-500 hover:underline mb-4">
                <ArrowLeft size={16}/> Volver al Perfil
            </Link>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold">Gestionar Medallas</h2>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
            <p className="text-gray-500 mb-6">Selecciona hasta 3 medallas desbloqueadas para mostrar en tu perfil.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMedals.length > 0 ? allMedals.map(medal => {
                    const isSelected = selectedMedals.has(medal.id);
                    const tierColor = medal.tier === 'Oro' ? 'text-yellow-500' : medal.tier === 'Plata' ? 'text-gray-400' : medal.tier === 'Bronce' ? 'text-yellow-700' : 'text-gray-500';
                    const canSelect = medal.unlocked;
                    const progressPercent = calculateProgressPercent(medal);

                    return (
                        <div key={medal.id} onClick={() => handleSelect(medal.id, medal.unlocked)} className={`p-4 rounded-lg border-2 relative transition-all ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-gray-200 dark:border-gray-700'} ${canSelect ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                            {isSelected && <Check className="absolute top-2 right-2 text-white bg-blue-500 rounded-full p-1" />}
                            {!medal.unlocked && <Lock className="absolute top-2 right-2 text-gray-400" />}
                            
                            <div className="flex items-center gap-4">
                                <Award size={40} className={tierColor} />
                                <div>
                                    <h3 className="font-bold">{medal.name}</h3>
                                    <p className="text-xs text-gray-500">{medal.description}</p>
                                    {(medal.nextThreshold !== undefined) && ( // Muestra barra si hay un siguiente nivel definido
                                        <div className="mt-2" title={`Progreso: ${medal.progress} / ${medal.nextThreshold || 'MAX'}`}>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : <p className="text-center text-gray-500 col-span-full py-8">No hay logros definidos. Añádelos en la base de datos de Firebase.</p>}
            </div>
        </Card>
    );
}