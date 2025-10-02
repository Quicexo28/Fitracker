// Importa las herramientas de Firebase Admin
const admin = require('firebase-admin');

// ¡IMPORTANTE! Apunta a tu archivo de clave de servicio que descargaste
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa la conexión con tu proyecto de Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- AQUÍ PUEDES AÑADIR TODOS LOS LOGROS QUE QUIERAS ---
const achievements = [
    {
        id: 'workouts-completed',
        data: {
            name: "Constancia de Acero",
            description: "Completa un cierto número de entrenamientos.",
            type: "WORKOUTS_COMPLETED",
            tiers: [
                { level: "Bronce", threshold: 10, medalName: "Atleta Principiante" },
                { level: "Plata", threshold: 50, medalName: "Guerrero del Gym" },
                { level: "Oro", threshold: 100, medalName: "Leyenda del Hierro" }
            ]
        }
    },
    {
        id: 'personal-records',
        data: {
            name: "Rompiendo Barreras",
            description: "Consigue un nuevo Récord Personal (PR).",
            type: "PERSONAL_RECORDS_SET",
            tiers: [
                { level: "Bronce", threshold: 1, medalName: "Rompehielos" },
                { level: "Plata", threshold: 25, medalName: "Destructor de Límites" },
                { level: "Oro", threshold: 50, medalName: "Imparable" }
            ]
        }
    },
    {
        id: 'create-routines',
        data: {
            name: "Arquitecto del Fitness",
            description: "Crea tus propias rutinas de entrenamiento.",
            type: "ROUTINES_CREATED",
            tiers: [
                { level: "Bronce", threshold: 1, medalName: "El Planificador" },
                { level: "Plata", threshold: 5, medalName: "El Estratega" },
                { level: "Oro", threshold: 10, medalName: "Maestro del Diseño" }
            ]
        }
    }
    // ¡Puedes añadir más logros aquí!
];

// Función que sube los logros a Firestore
async function seedAchievements() {
  console.log('Iniciando la siembra de logros...');
  const achievementsCollection = db.collection('achievements');
  
  for (const achievement of achievements) {
    try {
      await achievementsCollection.doc(achievement.id).set(achievement.data);
      console.log(`✅ Logro '${achievement.data.name}' añadido con éxito.`);
    } catch (error) {
      console.error(`❌ Error al añadir el logro '${achievement.data.name}':`, error);
    }
  }
  
  console.log('\n¡Siembra de logros completada!');
}

// Ejecuta la función
seedAchievements();