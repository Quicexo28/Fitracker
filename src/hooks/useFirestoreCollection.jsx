import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default function useFirestoreCollection(path, options = { orderBy: 'createdAt', direction: 'desc' }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Si no hay una ruta válida, no intentes conectarte a Firestore.
        if (!path) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Construye la consulta a la base de datos con las opciones de ordenamiento.
        const q = query(collection(db, path), orderBy(options.orderBy, options.direction));

        // onSnapshot crea un "listener" en tiempo real.
        // Cada vez que algo cambia en la colección (se añade, borra o edita un documento),
        // esta función se ejecuta de nuevo con los datos actualizados.
        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Mapeamos los documentos recibidos al formato que usamos en la app.
            setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            console.error(`Error en el listener de Firestore para la ruta: ${path}`, err);
            setLoading(false);
        });

        // Esta es la función de "limpieza". Se ejecuta cuando el componente
        // que usa este hook ya no está en pantalla, y cierra la conexión
        // en tiempo real para ahorrar recursos.
        return () => unsubscribe();
    }, [path, options.orderBy, options.direction]);

    return { data, loading };
}