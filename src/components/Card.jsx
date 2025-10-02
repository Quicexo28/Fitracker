import React from 'react';

export default function Card({ children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg ${className}`}>
            {children}
        </div>
    );
}