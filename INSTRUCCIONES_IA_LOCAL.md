# 🧠 Guía de Instalación: IA Local "Neuro-Link" Horizon

Has activado la arquitectura de IA más avanzada para tu sistema. Sigue estos pasos para que todo funcione de forma local y gratuita.

## 1. Requisitos Previos

### A. Ollama (El cerebro)
1. Descarga e instala **Ollama** desde [ollama.com](https://ollama.com).
2. Abre una terminal y descarga el modelo Llama 3:
   ```bash
   ollama run llama3
   ```

### B. Node.js (El servidor)
Ya he configurado la carpeta `ai-server`. Para iniciar la inteligencia:
1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta: `cd ai-server; node index.js`

## 2. Capacidades Activas

### 📸 DocumentVisionAgent
- Sube una foto de una factura en el Punto de Venta.
- El sistema usará **Tesseract.js** (integrado) para leer el texto.
- **Llama 3** (tu IA local) interpretará el texto para llenar el cliente, fecha e ítems automáticamente.

### 🎙️ VoiceCommandAgent
- Haz clic en "Comando de Voz" y habla.
- El sistema procesará tu intención vía **Ollama**.
- Comandos soportados:
  - *"Agregar 2 Coca Cola"*
  - *"Factura para Juan Perez"*
  - *"Borrar último"*
  - *"Guardar factura"*

### 🧠 BusinessLogicAssistant
- Valida que los nombres de productos de las fotos coincidan con tu inventario real.
- Si no existe el producto, lo agrega como un ítem de escaneo genérico.

## 🚀 Inicio Rápido
He creado un archivo llamado `INICIAR_IA.bat` en la raíz. Solo hazle doble clic para activar los agentes.
