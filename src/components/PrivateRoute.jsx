import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        // Puedes mostrar un loader aquí si prefieres
        return <div>Cargando...</div>;
    }

    // Si hay un usuario, muestra el contenido de la ruta.
    // Si no, redirige a la página de login.
    return user ? <Outlet /> : <Navigate to="/login" />;
}