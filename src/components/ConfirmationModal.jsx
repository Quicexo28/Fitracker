import React from 'react';
import Card from './Card.jsx';
import { X } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, title, message, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X /></button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                        No
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-500">
                        Sí, finalizar
                    </button>
                </div>
            </Card>
        </div>
    );
}