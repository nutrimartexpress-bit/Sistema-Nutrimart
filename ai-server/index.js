
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Configuración de almacenamiento para archivos subidos
const upload = multer({ dest: 'uploads/' });

// --- AGENTE 1: DocumentVisionAgent ---

app.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ninguna imagen' });

        console.log('--- DocumentVisionAgent: Iniciando OCR ---');
        const imagePath = req.file.path;

        // Skill 1: OCRExtractor
        const { data: { text } } = await Tesseract.recognize(imagePath, 'spa');
        console.log('Texto extraído:', text.substring(0, 100) + '...');

        // Skill 2 & 3: Understanding & Mapping via Ollama (Hardened Prompt)
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: 'llama3',
                prompt: `Analiza este texto OCR de una factura y responde ÚNICAMENTE con un objeto JSON válido. 
                NO incluyas introducciones, NO incluyas explicaciones, NO incluyas bloques de código markdown.
                Solo el JSON puro con esta estructura:
                {
                  "cliente": "Razón Social",
                  "fecha": "YYYY-MM-DD",
                  "items": [
                    {"descripcion": "Nombre del producto", "cantidad": 1, "precio_unitario": 0}
                  ],
                  "total": 0
                }
                TEXTO: 
                ${text}`,
                stream: false
            })
        });

        const ollamaData = await ollamaResponse.json();

        // Sanitización agresiva del JSON
        let cleanResponse = ollamaData.response.trim();
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
        }

        let structuredData = null;
        try {
            structuredData = JSON.parse(cleanResponse);
        } catch (e) {
            console.error("Fallo al parsear JSON de la IA:", cleanResponse);
            // Fallback: tratar de extraer items con regex si el JSON falla
        }

        // Limpiar archivo temporal
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        res.json({
            success: true,
            agent: 'DocumentVisionAgent',
            data: structuredData,
            rawText: text
        });

    } catch (error) {
        console.error('Error en /analyze-image:', error);
        res.status(500).json({ error: 'Error procesando la imagen', details: error.message });
    }
});

// --- AGENTE 2: VoiceCommandAgent ---

app.post('/process-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No se subió ningún audio' });

        console.log('--- VoiceCommandAgent: Procesando Comando ---');
        // NOTA: Para Whisper nativo local se requiere el binario de whisper.cpp o similar.
        // Aquí implementamos el flujo para que use una API local compatible (como LocalAI o Faster-Whisper)
        // Por ahora simularemos la transcripción con un placeholder o hook para Whisper.

        // Placeholder: Si el usuario tiene un servidor Whisper en localhost:8080
        // const transcription = await transcribeLocally(req.file.path);

        const transcription = "Simulación: Agregar 2 empanadas y 1 coca cola"; // Esto debe ser reemplazado por el resultado de Whisper

        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: 'llama3',
                prompt: `Interpreta la siguiente transcripción de voz para un sistema de facturación.
                Devuelve SOLO un objeto JSON con la acción y los datos correspondientes.
                Acciones válidas: agregar_producto, eliminar_producto, guardar_factura, asignar_cliente.
                TEXTO: "${transcription}"
                
                EJEMPLO DE SALIDA:
                {
                  "accion": "agregar_producto",
                  "datos": {"descripcion": "aceite", "cantidad": 2}
                }`,
                stream: false
            })
        });

        const ollamaData = await ollamaResponse.json();
        const jsonMatch = ollamaData.response.match(/\{[\s\S]*\}/);
        const intent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            agent: 'VoiceCommandAgent',
            transcription,
            intent
        });

    } catch (error) {
        console.error('Error en /process-audio:', error);
        res.status(500).json({ error: 'Error procesando el audio', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 AGENTIC AI SERVER corriendo en http://localhost:${PORT}`);
    console.log(`- Endpoint Vision: http://localhost:${PORT}/analyze-image`);
    console.log(`- Endpoint Voz: http://localhost:${PORT}/process-audio`);
});
