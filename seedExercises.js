// seedExercises.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// --- PASO 1: Cargar .env.local ANTES que cualquier cosa de Firebase ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env.local');
dotenv.config({ path: envPath });

// --- PASO 2: Validación Temprana ---
if (!process.env.VITE_FIREBASE_API_KEY || !process.env.VITE_FIREBASE_PROJECT_ID) {
  console.error('¡ERROR FATAL! No se encontraron las variables de entorno en ".env.local".');
  console.error('Asegúrate de que el archivo existe y las variables (ej. VITE_FIREBASE_API_KEY) están escritas correctamente.');
  process.exit(1); // Detiene el script
}

// --- PASO 3: Función principal asíncrona ---
async function main() {
  try {
    // --- PASO 4: IMPORTACIÓN DINÁMICA (¡Con 'doc' añadido!) ---
    const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore'); // <--- CORRECCIÓN AQUÍ
    const { db } = await import('./src/firebase/config.js');

    // --- PASO 5: Leer el JSON ---
    const jsonPath = join(__dirname, 'src', 'exercisesData.json');
    const fileContent = readFileSync(jsonPath, 'utf8');
    const exercisesData = JSON.parse(fileContent);

    // --- PASO 6: Lógica del Script de Sembrado ---
    const exercisesCollection = collection(db, 'exercises');
    
    console.log('Verificando si la colección "exercises" ya existe...');
    const snapshot = await getDocs(exercisesCollection);
    
    if (!snapshot.empty) {
      console.log('La colección "exercises" ya contiene datos. No se necesita sembrado.');
      return;
    }

    console.log('La colección está vacía. Empezando el sembrado...');
    const batch = writeBatch(db);
    let exerciseCount = 0;

    // Iteramos sobre el Array de grupos (ej. "Abdominales", "Bíceps")
    exercisesData.forEach((group) => {
      // Iteramos sobre el Array de 'items' (ejercicios) dentro de cada grupo
      group.items.forEach((exercise) => {
        const exerciseWithGroup = {
          ...exercise,
          groupName: group.group
        };
        
        // --- INICIO DE LA CORRECCIÓN DE SINTAXIS ---
        // La forma correcta en v9 de crear un doc con ID auto-generado
        const docRef = doc(collection(db, 'exercises')); // <--- CORRECCIÓN AQUÍ
        // --- FIN DE LA CORRECCIÓN DE SINTAXIS ---

        batch.set(docRef, exerciseWithGroup);
        exerciseCount++;
      });
    });

    await batch.commit();
    
    console.log(`¡Éxito! 🔥 Se han subido ${exerciseCount} ejercicios a Firestore.`);

  } catch (error) {
    console.error('Error al sembrar la base de datos:', error);
  }
}

// --- PASO 7: Ejecutar la función ---
main();