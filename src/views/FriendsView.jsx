import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import useFirestoreDocument from '../hooks/useFirestoreDocument.jsx';
import { searchUsers, handleFriendAction, removeFriend, getProfile } from '../firebase/profileService.js';
import Card from '../components/Card.jsx';
import ThemedLoader from '../components/ThemedLoader.jsx';
import { Users, UserPlus, Search, Check, X, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserListItem = ({ user, status, onAction }) => {
    const { id, displayName } = user;
    return (
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Link to={`/perfil/${id}`} className="font-medium hover:underline hover:text-blue-500">
                {displayName}
            </Link>
            <div className="flex gap-2">
                {status === 'friend' && <button onClick={() => onAction(id, 'remove')} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><UserX size={18} /></button>}
                {status === 'received' && (
                    <>
                        <button onClick={() => onAction(id, 'reject')} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><X size={20} /></button>
                        <button onClick={() => onAction(id, 'accept')} className="p-2 text-green-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><Check size={20} /></button>
                    </>
                )}
                {status === 'sent' && <span className="text-xs text-gray-500 font-semibold px-2">Pendiente</span>}
                {status === 'none' && <button onClick={() => onAction(id, 'add')} className="p-2 text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><UserPlus size={18} /></button>}
            </div>
        </div>
    );
};

export default function FriendsView() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    
    const { document: profile, refetch: refetchProfile } = useFirestoreDocument(user ? `users/${user.uid}` : null);
    const [friendProfiles, setFriendProfiles] = useState([]);
    const [requestProfiles, setRequestProfiles] = useState([]);

    useEffect(() => {
        const fetchProfiles = async (ids) => {
            if (!ids || ids.length === 0) return [];
            const profiles = await Promise.all(ids.map(id => getProfile(id).then(p => (p ? { ...p, id } : null))));
            return profiles.filter(Boolean);
        };

        if (profile?.friends) { fetchProfiles(profile.friends).then(setFriendProfiles); } 
        else { setFriendProfiles([]); }
        
        if (profile?.receivedRequests) { fetchProfiles(profile.receivedRequests).then(setRequestProfiles); } 
        else { setRequestProfiles([]); }
    }, [profile]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoadingSearch(true);
        const results = await searchUsers(searchQuery, user.uid);
        setSearchResults(results);
        setLoadingSearch(false);
    };

    const handleAction = async (otherUserId, action) => {
        try {
            if (action === 'remove') {
                if(window.confirm(`¿Seguro que quieres eliminar a este amigo?`)) await removeFriend(user.uid, otherUserId);
            } else {
                await handleFriendAction(user.uid, otherUserId, action);
            }
            refetchProfile();
        } catch (error) {
            console.error(`Error en acción '${action}':`, error);
        }
    };
    
    const getStatus = (otherUserId) => {
        if (profile?.friends?.includes(otherUserId)) return 'friend';
        if (profile?.sentRequests?.includes(otherUserId)) return 'sent';
        if (profile?.receivedRequests?.includes(otherUserId)) return 'received';
        return 'none';
    };

    return (
        <Card>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Users /> Amigos</h2>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="flex gap-4">
                    <button onClick={() => setActiveTab('friends')} className={`py-2 px-1 text-sm font-medium ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Mis Amigos</button>
                    <button onClick={() => setActiveTab('requests')} className={`py-2 px-1 text-sm font-medium ${activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Solicitudes</button>
                    <button onClick={() => setActiveTab('search')} className={`py-2 px-1 text-sm font-medium ${activeTab === 'search' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>Buscar</button>
                </nav>
            </div>

            <div>
                {activeTab === 'friends' && (
                    <ul className="space-y-2">{friendProfiles.map(f => <UserListItem key={f.id} user={f} status="friend" onAction={handleAction}/>)}</ul>
                )}
                {activeTab === 'requests' && (
                    <ul className="space-y-2">{requestProfiles.map(r => <UserListItem key={r.id} user={r} status="received" onAction={handleAction}/>)}</ul>
                )}
                {activeTab === 'search' && (
                    <div>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por nombre de usuario..." className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 rounded-md"/>
                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-md"><Search/></button>
                        </form>
                        {loadingSearch ? <ThemedLoader /> : (
                            <ul className="space-y-2">{searchResults.map(u => <UserListItem key={u.id} user={u} status={getStatus(u.id)} onAction={handleAction}/>)}</ul>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}