import React from 'react';
import Card from './Card.jsx';
import { X } from 'lucide-react';

export default function GenericModal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
                        <X />
                    </button>
                </div>
                {children}
            </Card>
        </div>
    );
}