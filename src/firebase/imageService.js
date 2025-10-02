import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sube un archivo de imagen a Firebase Storage.
 * @param {File} file El archivo de imagen a subir.
 * @param {string} path La ruta dentro de Storage donde se guardará (ej. 'exercise_images').
 * @returns {Promise<string>} La URL de descarga pública de la imagen.
 */
export const uploadImage = async (file, path) => {
    if (!file) throw new Error("No se proporcionó ningún archivo.");

    const storage = getStorage();
    const fileName = `${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
};