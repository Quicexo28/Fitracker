import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProfile } from '../firebase/profileService.js';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { User, Dumbbell, Activity, Edit, Award } from 'lucide-react';

export default function ProfileView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ routines: 0, sessions: 0 });
    const [loading, setLoading] = useState(true);
    const [showcasedMedals, setShowcasedMedals] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                try {
                    const profileData = await getProfile(user.uid);
                    setProfile(profileData);

                    const routinesSnap = await getDocs(collection(db, `users/${user.uid}/routines`));
                    const sessionsSnap = await getDocs(collection(db, `users/${user.uid}/sessions`));
                    setStats({ routines: routinesSnap.size, sessions: sessionsSnap.size });

                    if (profileData?.showcasedMedals && profileData.showcasedMedals.length > 0) {
                        const achievementDefsSnap = await getDocs(collection(db, 'achievements'));
                        const achievementDefs = new Map(achievementDefsSnap.docs.map(doc => [doc.id, doc.data()]));

                        const userAchievementsSnap = await getDocs(collection(db, `users/${user.uid}/userAchievements`));
                        const userAchievements = new Map(userAchievementsSnap.docs.map(doc => [doc.id, doc.data()]));

                        const medals = profileData.showcasedMedals.map(id => {
                            const userAch = userAchievements.get(id);
                            const achDef = achievementDefs.get(id);
                            if (!userAch || !achDef) return null;
                            
                            const tierInfo = achDef.tiers.find(t => t.level === userAch.unlockedTier);
                            
                            return {
                                id: id,
                                name: tierInfo?.medalName || achDef.name,
                                tier: userAch.unlockedTier,
                            };
                        }).filter(Boolean);

                        setShowcasedMedals(medals);
                    }
                } catch (error) {
                    console.error("Error fetching profile data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return <ThemedLoader />;
    }

    return (
        <Card>
            <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <User size={48} className="text-gray-500" />
                </div>
                <h2 className="text-3xl font-bold">
                    {profile?.displayName || user?.displayName || 'Usuario'}
                </h2>
                <button 
                    onClick={() => navigate('/perfil/configurar')}
                    className="flex items-center gap-2 mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                    <Edit size={16} />
                    Editar Perfil Público
                </button>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex justify-center items-center mb-4">
                    <h3 className="text-xl font-semibold text-center">Medallas Destacadas</h3>
                    <button 
                        onClick={() => navigate('/perfil/medallas')}
                        className="ml-4 p-2 text-gray-500 hover:text-blue-500 rounded-full"
                        title="Editar medallas destacadas"
                    >
                        <Edit size={18} />
                    </button>
                </div>
                {showcasedMedals.length > 0 ? (
                    <div className="flex justify-center gap-4">
                        {showcasedMedals.map(medal => (
                            <div key={medal.id} className="text-center">
                                <Award size={48} className={
                                    medal.tier === 'Oro' ? 'text-yellow-500' :
                                    medal.tier === 'Plata' ? 'text-gray-400' : 'text-yellow-700'
                                }/>
                                <p className="text-xs font-semibold mt-1">{medal.name}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">No has destacado ninguna medalla.</p>
                )}
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-center mb-4">Estadísticas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                        <Dumbbell size={24} className="text-blue-500" />
                        <div>
                            <p className="text-2xl font-bold">{stats.routines}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Rutinas Creadas</p>
                        </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                        <Activity size={24} className="text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{stats.sessions}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sesiones Completadas</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}