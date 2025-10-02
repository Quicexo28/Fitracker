// src/views/RegisterView.jsx
import React from 'react';
import Card from '../components/Card.jsx';

export default function RegisterView() { // <-- Asegúrate de que exporta por defecto
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <Card>
                <h1 className="text-3xl font-bold text-center mb-6">Registro</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Aquí irá el formulario de registro.
                </p>
            </Card>
        </div>
    );
}