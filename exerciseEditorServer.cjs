// exerciseEditorServer.cjs (Versión con soporte para añadir Variaciones - Nivel 2)

const express = require('express');
const fs = require('fs-extra');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');

const app = express();
const port = 3000;
const JSON_PATH = path.join(__dirname, 'src', 'exercisesData.json');

app.use(bodyParser.urlencoded({ extended: true }));

// --- Página Principal (GET '/') ---
app.get('/', async (req, res) => {
    try {
        const exerciseData = await fs.readJson(JSON_PATH);
        const groups = [...new Set(exerciseData.map(g => g.group))].sort();

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editor Ejercicios Fitracker</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: auto; line-height: 1.6; background-color: #f8f9fa; color: #212529; }
                    h1, h2 { color: #0d6efd; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;}
                    form { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
                    label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; color: #495057; }
                    input[type="text"], input[type="url"], select { width: 100%; padding: 10px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ced4da; border-radius: 4px; font-size: 1rem; }
                    input[type="checkbox"] { margin-right: 8px; transform: scale(1.2); }
                    button { background-color: #0d6efd; color: white; padding: 12px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 25px; font-size: 1rem; transition: background-color 0.2s ease; }
                    button:hover { background-color: #0b5ed7; }
                    button.add-variation { background-color: #198754; font-size: 0.9rem; padding: 8px 12px; margin-top: 10px; }
                    button.add-variation:hover { background-color: #157347; }
                    .info { font-size: 0.9em; color: #6c757d; margin-top: 15px; }
                    .success, .error { padding: 15px; border-radius: 5px; margin-top: 20px; }
                    .success { background-color: #d1e7dd; color: #0f5132; border: 1px solid #badbcc; }
                    .error { background-color: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }
                    a { color: #0d6efd; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    #variations-container { margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 15px; }
                    .variation-group { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin-bottom: 10px; }
                    .variation-group label { margin-top: 5px; }
                </style>
            </head>
            <body>
                <h1>Añadir Ejercicio Global</h1>
                <form action="/add-exercise" method="POST">
                    <h2>Ejercicio Base (Nivel 1)</h2>
                    <label for="group">Grupo Muscular:</label>
                    <input list="group-list" id="group" name="group" required placeholder="Ej: Pecho">
                    <datalist id="group-list">
                        ${groups.map(g => `<option value="${g}"></option>`).join('')}
                    </datalist>

                    <label for="baseId">ID Base (único, minúsculas, guiones):</label>
                    <input type="text" id="baseId" name="baseId" required pattern="[a-z0-9-]+" placeholder="ej: curl-biceps">

                    <label for="baseName">Nombre Base (mostrado en Nivel 1):</label>
                    <input type="text" id="baseName" name="baseName" required placeholder="ej: Curl de Bíceps">

                    <h2>Variaciones (Nivel 2: Tipo/Equipamiento)</h2>
                    <div id="variations-container">
                        </div>
                    <button type="button" class="add-variation" onclick="addVariation()">+ Añadir Variación (Nivel 2)</button>

                    <p class="info">Para añadir Sub-Variaciones (Nivel 3) o Tipos de Ejecución (Nivel 4), edita manualmente <code>src/exercisesData.json</code> después de guardar.</p>

                    <button type="submit">Guardar Ejercicio y Variaciones</button>
                </form>

                <script>
                    let variationCounter = 0;
                    function addVariation() {
                        variationCounter++;
                        const container = document.getElementById('variations-container');
                        const div = document.createElement('div');
                        div.className = 'variation-group';
                        div.innerHTML = \`
                            <h4>Variación #\${variationCounter}</h4>
                            <label for="varId\${variationCounter}">ID Variación (único):</label>
                            <input type="text" id="varId\${variationCounter}" name="variations[\${variationCounter-1}][id]" required pattern="[a-z0-9-]+" placeholder="ej: con-mancuernas">

                            <label for="varName\${variationCounter}">Nombre Variación:</label>
                            <input type="text" id="varName\${variationCounter}" name="variations[\${variationCounter-1}][name]" required placeholder="ej: con Mancuernas">
                            
                            <label for="varImageUrl\${variationCounter}">URL de Imagen (Opcional):</label>
                            <input type="url" id="varImageUrl\${variationCounter}" name="variations[\${variationCounter-1}][imageUrl]" placeholder="https://...">

                            <label>
                                <input type="checkbox" name="variations[\${variationCounter-1}][isUnilateral]" value="true">
                                ¿Es Unilateral? (Marcar si aplica a este nivel)
                            </label>
                        \`;
                        container.appendChild(div);
                    }
                    // Añadir la primera variación por defecto
                    addVariation(); 
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Error al cargar la página principal:", error);
        res.status(500).send('Error al leer los datos de ejercicios. Revisa la consola del servidor.');
    }
});

// --- Ruta POST '/add-exercise' ---
app.post('/add-exercise', async (req, res) => {
    const { group, baseId, baseName, variations } = req.body;

    if (!group || !baseId || !baseName || !/^[a-z0-9-]+$/.test(baseId)) {
        // ... (mensaje de error igual que antes)
    }

    try {
        const exerciseData = await fs.readJson(JSON_PATH);
        let groupIndex = exerciseData.findIndex(g => g.group.toLowerCase() === group.toLowerCase());
        if (groupIndex === -1) {
            exerciseData.push({ group: group, items: [] });
            groupIndex = exerciseData.length - 1;
        }

        // --- VALIDACIÓN DE IDs ---
        const allIds = new Set();
        exerciseData.forEach(g => g.items.forEach(item => {
            allIds.add(item.id);
            item.variations?.forEach(v => {
                allIds.add(v.id);
                v.subVariations?.forEach(sv => {
                    allIds.add(sv.id);
                    sv.executionTypes?.forEach(et => allIds.add(et.id));
                });
            });
        }));

        if (allIds.has(baseId)) {
             return res.status(400).send(`<h1 class="error">Error: El ID Base '${baseId}' ya existe.</h1>...`);
        }
        if (variations) {
            for (const v of variations) {
                if (!v.id || !/^[a-z0-9-]+$/.test(v.id)) return res.status(400).send(`<h1 class="error">Error: ID de Variación inválido.</h1>...`);
                if (allIds.has(v.id)) return res.status(400).send(`<h1 class="error">Error: El ID de Variación '${v.id}' ya existe.</h1>...`);
                allIds.add(v.id); // Añadir al set para validar duplicados dentro del mismo form
            }
        }
        // --- FIN VALIDACIÓN ---


        const newExercise = {
            id: baseId,
            name: baseName,
            variations: (variations || []).map(v => ({
                id: v.id,
                name: v.name,
                imageUrl: v.imageUrl || '', // Asegurar que siempre exista
                isUnilateral: v.isUnilateral === 'true', // Convertir checkbox a boolean
                // Aquí es donde manualmente añadirías subVariations si es necesario
                // subVariations: [] 
            }))
        };
        
        // Si no se añadieron variaciones en el form, elimina la propiedad 'variations'
        if (newExercise.variations.length === 0) {
            delete newExercise.variations;
        }

        exerciseData[groupIndex].items.push(newExercise);
        exerciseData.sort((a, b) => a.group.localeCompare(b.group));
        exerciseData[groupIndex].items.sort((a, b) => a.name.localeCompare(b.name));

        await fs.writeJson(JSON_PATH, exerciseData, { spaces: 2 }); 

        console.log(`✅ Ejercicio '${baseName}' (ID: ${baseId}) con ${newExercise.variations?.length || 0} variaciones añadido al grupo '${group}'.`);
        res.send(`
            <!DOCTYPE html><html lang="es">...
            <body>
                <h1 class="success">¡Ejercicio añadido!</h1>
                <p>Se añadió <strong>${baseName}</strong> con sus variaciones iniciales.</p>
                <p>Puedes editar <code>src/exercisesData.json</code> para añadir niveles más profundos (Sub-Variaciones, Tipos de Ejecución).</p>
                <p><strong>Importante:</strong> Reinicia Vite y reconstruye/redespliega tu app para ver los cambios.</p>
                <a href="/">Añadir otro ejercicio</a>
            </body></html>
        `);

    } catch (error) {
        console.error("Error al procesar /add-exercise:", error);
        res.status(500).send(/* ... mensaje de error del servidor ... */);
    }
});

// --- Iniciar el Servidor ---
app.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 Servidor Editor de Ejercicios corriendo.`);
    console.log(`   Puedes editar el archivo JSON directamente en: ${JSON_PATH}`);
    console.log(`\n   Accede a la herramienta desde tu navegador en:`);
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach(name => {
        interfaces[name].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   - http://${iface.address}:${port}  (Accesible desde tu red local/móvil)`);
            }
        });
    });
    console.log(`   - http://localhost:${port}          (Solo desde esta computadora)`);
    console.log(`\nPara detener el servidor, presiona Ctrl + C en esta terminal.`);
});