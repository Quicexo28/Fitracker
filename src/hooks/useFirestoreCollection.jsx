import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy as fbOrderBy, where as fbWhere, limit as fbLimit } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default function useFirestoreCollection(_collection, _queryOptions = {}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Memoizamos las opciones para evitar re-crear la consulta innecesariamente
    // Usamos una dependencia estable si _queryOptions está vacío
    const queryOptionsString = _queryOptions && Object.keys(_queryOptions).length > 0 ? JSON.stringify(_queryOptions) : '{}';

    useEffect(() => {
        // Si la ruta de la colección no es válida, no hacemos nada.
        if (typeof _collection !== 'string' || !_collection) {
            setLoading(false);
            setData([]);
            // Podrías poner setError aquí si prefieres indicar un error de ruta inválida
            // setError("Ruta de colección inválida o no proporcionada.");
            return; // Salimos del efecto temprano
        }

        setLoading(true);
        setError(null);
        let unsubscribe = () => {};

        try {
            const collectionRef = collection(db, _collection);
            let q;

            const options = [];
            const { orderBy, direction = 'asc', where, limit } = JSON.parse(queryOptionsString);

            if (where && where.length > 0) options.push(fbWhere(...where));
            if (orderBy) options.push(fbOrderBy(orderBy, direction));
            if (limit) options.push(fbLimit(limit));

            if (options.length > 0) {
                q = query(collectionRef, ...options);
            } else {
                q = collectionRef;
            }

            unsubscribe = onSnapshot(q, (snapshot) => {
                // --- INICIO DE DEBUG DETALLADO ---
                console.log(`[useFirestoreCollection] Snapshot recibido para "${_collection}"`);
                console.log(`[useFirestoreCollection] ¿Snapshot vacío? ${snapshot.empty}`);
                console.log(`[useFirestoreCollection] Número de documentos: ${snapshot.size}`); // O snapshot.docs.length

                if (snapshot.size > 0) {
                     // Loguea los primeros 1-2 documentos para ver su estructura
                     console.log("[useFirestoreCollection] Primeros documentos recibidos:", snapshot.docs.slice(0, 2).map(d => ({ id: d.id, ...d.data() })));
                }
                // --- FIN DE DEBUG DETALLADO ---

                const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setData(docs);
                setLoading(false);
            }, (err) => { // El callback de error
                console.error(`[useFirestoreCollection] Error en onSnapshot para "${_collection}":`, err);
                setError(`Error al obtener datos: ${err.message}`);
                setLoading(false);
            });

        } catch (err) {
            console.error(`[useFirestoreCollection] Error configurando Firestore listener para "${_collection}":`, err);
            setError(`Error de configuración: ${err.message}`);
            setLoading(false);
        }

        return () => unsubscribe();

    }, [_collection, queryOptionsString]); // Dependencias: la colección y las opciones

    return { data, loading, error };
}