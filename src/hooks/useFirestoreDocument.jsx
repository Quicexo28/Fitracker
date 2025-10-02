import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default function useFirestoreDocument(path) {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!path) {
            setDocument(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, path);
        
        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setDocument({ id: doc.id, ...doc.data() });
            } else {
                setDocument(null);
                setError("El documento no existe.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Error obteniendo el documento:", err);
            setError("Error al obtener los datos.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [path]);

    return { document, loading, error };
}