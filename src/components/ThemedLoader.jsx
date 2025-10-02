import React from 'react';
import { Loader } from 'lucide-react';

export default function ThemedLoader() {
    return (
        <div className="flex justify-center items-center py-10">
            <Loader className="mx-auto animate-spin text-blue-500" />
        </div>
    );
}