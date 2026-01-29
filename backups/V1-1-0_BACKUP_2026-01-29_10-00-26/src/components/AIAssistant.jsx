
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, Zap, Activity, ShieldCheck, Image as ImageIcon } from 'lucide-react';

/**
 * Horizon AI - Versión Llama 3 (Powered by Groq)
 * Una IA extremadamente rápida, gratuita y abierta para tu gestión.
 */
function AIAssistant({ activeItem, setActiveItem }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy Horizon AI. Me mudé a Llama 3 (Meta) para darte una experiencia mucho más rápida y sin errores. ¿Cómo puedo ayudarte hoy con tu negocio?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Obtenemos la nueva clave de Groq
    const groqKey = (import.meta.env.VITE_GROQ_API_KEY || "").trim();
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    const getSystemData = () => {
        try {
            const s = JSON.parse(localStorage.getItem('salesHistory') || '[]');
            const t = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
            const o = JSON.parse(localStorage.getItem('cashOpening') || 'null');
            const p = JSON.parse(localStorage.getItem('products') || '[]');

            const totalEfectivo = o ? (parseFloat(o.openingAmount) + t.filter(x => x.paymentMethod === 'Efectivo').reduce((a, b) => a + b.amount, 0) - t.filter(x => x.type === 'expense').reduce((a, b) => a + b.amount, 0)) : 0;

            return `Ventas hoy: ${s.length} tickets, total ${s.reduce((a, b) => a + b.total, 0)} Gs. Caja: ${o ? 'Abierta' : 'Cerrada'}. Plata en caja: ${totalEfectivo} Gs. Stock: ${p.length} productos.`;
        } catch (e) { return 'Datos offline.'; }
    };

    const [selectedImage, setSelectedImage] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const getProductsForAI = () => {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const activeProducts = products
                .filter(p => !p.isHidden && (parseFloat(p.stock) > 0 || p.type === 'SERVICIO'))
                .slice(0, 50) // Limit to top 50 to avoid token limits
                .map(p => `- ${p.description} (Stock: ${p.stock}, Precio: ${p.retailPrice} Gs, Rubro: ${p.brand || 'General'})`)
                .join('\n');
            return activeProducts || "No hay productos registrados aún.";
        } catch (e) { return "Error leyendo productos."; }
    };

    // --- AUDIO HANDLING ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ No pude acceder al micrófono. Verifica los permisos.' }]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (audioBlob) => {
        setIsTyping(true);
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-large-v3');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${groqKey}` }, // Content-Type is auto-set with FormData
                body: formData
            });

            const data = await response.json();
            if (data.text) {
                setInput(prev => prev + (prev ? ' ' : '') + data.text);
            } else {
                throw new Error('No transcription returned');
            }
        } catch (error) {
            console.error("Transcription error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error transcribiendo audio.' }]);
        }
        setIsTyping(false);
    };

    // --- IMAGE HANDLING ---
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result); // Base64
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (manualMsg = null) => {
        const textToSend = manualMsg || input;
        if (!textToSend.trim() && !selectedImage) return;

        const userMsg = textToSend;

        // Optimistic UI update
        const newMsg = { role: 'user', content: userMsg };
        if (selectedImage) newMsg.image = selectedImage;

        setMessages(prev => [...prev, newMsg]);
        setInput('');
        const currentImage = selectedImage; // Capture/closure for async
        setSelectedImage(null);
        setIsTyping(true);

        if (!groqKey || groqKey.length < 10) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Falta la Clave de Groq. Por favor, generá una nueva en https://console.groq.com/keys y pegala en el .env como VITE_GROQ_API_KEY.' }]);
            setIsTyping(false);
            return;
        }

        try {
            let model = "llama-3.3-70b-versatile";
            let messagesPayload = [];

            // DETECTAR INTENCIÓN DE MARKETING (Solo si es texto puro, Vision no soporta system prompt complejo igual)
            const lowMsg = userMsg.toLowerCase();
            const isMarketing = lowMsg.includes('oferta') || lowMsg.includes('promo') || lowMsg.includes('marketing') || lowMsg.includes('idea') || lowMsg.includes('vender') || lowMsg.includes('publicidad') || lowMsg.includes('tendencia') || lowMsg.includes('combo') || lowMsg.includes('armame');

            // Navegación Inteligente
            if (!isMarketing && !currentImage) {
                // Si menciona historial, va a ventas
                if (lowMsg.includes('historial')) {
                    setActiveItem('ventas');
                }
                // Si menciona carrito, vender o nueva venta, va a facturacion
                else if (lowMsg.includes('carrito') || lowMsg.includes('vender') || lowMsg.includes('venta') || lowMsg.includes('factura')) {
                    setActiveItem('facturacion');
                }

                if (lowMsg.includes('producto') || lowMsg.includes('stock')) setActiveItem('productos');
                if (lowMsg.includes('arqueo') || lowMsg.includes('cierre')) setActiveItem('arqueo-caja');
                if (lowMsg.includes('caja') || lowMsg.includes('flujo') || lowMsg.includes('movimiento')) setActiveItem('flujo-caja');
            }
            let systemPrompt = `Eres Horizon AI, un asistente de gestión de negocios experto en Paraguay.
                            Respondes con tono profesional pero cercano.
                            TU CONTEXTO ACTUAL: ${getSystemData()}.`;

            if (isMarketing && !currentImage) {
                systemPrompt = `ACTÚA COMO UN ESPECIALISTA EN MARKETING E INTELIGENCIA DE NEGOCIO.
                TU OBJETIVO: Analizar el inventario del usuario y sugerir promociones o combos que aumenten la rentabilidad.
                
                TIENES ACCESO AL INVENTARIO REAL:
                ${getProductsForAI()}
                
                INSTRUCCIÓN DE AUTOMATIZACIÓN (CRÍTICA):
                Si el usuario te pide una sugerencia de promo o que le "armes" algo, genera tu respuesta normal y AL FINAL incluye un bloque JSON exacto con la etiqueta [SMART_CART] para que el sistema cargue los productos automáticamente.
                
                EJEMPLO DE CIERRE:
                Disfruta de esta promo! 
                [SMART_CART]
                {
                  "action": "ADD_ITEMS",
                  "items": [
                    { "code": "CODIGO1", "qty": 1 },
                    { "code": "CODIGO2", "qty": 2 }
                  ]
                }
                [/SMART_CART]

                FORMATO DE RESPUESTA VISUAL:
                1. 🔍 **Análisis de Oportunidad**: ...
                2. 💡 **Estrategia (Combo/Promo)**: ... 
                3. 🚀 **Copy Sugerido**: ...`;
            }

            if (currentImage) {
                model = "llama-4-scout-17b"; // Nueva generación Llama 4 Vision
                // Vision models don't support System prompts effectively in some APIs, so we simulate it or prepend.
                messagesPayload = [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userMsg || "Analiza esta imagen." },
                            { type: "image_url", image_url: { url: currentImage } }
                        ]
                    }
                ];
            } else {
                // Standard Text Chat
                messagesPayload = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMsg }
                ];
            }

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messagesPayload,
                    temperature: 0.7,
                    max_tokens: 800
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const aiText = data.choices[0].message.content;

            setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);

            // PARSE SMART CART ACTIONS
            if (aiText.includes('[SMART_CART]')) {
                try {
                    const jsonMatch = aiText.match(/\[SMART_CART\]([\s\S]*?)\[\/SMART_CART\]/);
                    if (jsonMatch && jsonMatch[1]) {
                        const cartData = JSON.parse(jsonMatch[1]);
                        if (cartData.action === 'ADD_ITEMS' && cartData.items) {
                            // FALLBACK: Save to localStorage in case InvoiceGenerator is unmounted
                            localStorage.setItem('pendingAIItems', JSON.stringify(cartData.items));

                            // Dispatch event to InvoiceGenerator
                            const event = new CustomEvent('HORIZON_AI_ADD_ITEMS', { detail: cartData.items });
                            window.dispatchEvent(event);

                            // Visual confirmation in chat
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: '✨ **Acción Confirmada**: He cargado los productos de la promoción directamente en tu **Carrito**. ¡Puedes finalizar la venta ahora en el Punto de Venta!'
                            }]);

                            // Switch to proper invoicing view (Carrito)
                            setActiveItem('facturacion');
                        }
                    }
                } catch (e) {
                    console.error("Error parsing smart cart:", e);
                }
            }
        } catch (err) {
            console.error("Groq Error:", err);
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
        }
        setIsTyping(false);
    };

    return (
        <>
            <motion.div className="fixed bottom-6 right-6 z-50">
                <button onClick={() => setIsOpen(!isOpen)} className={`p-4 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
                    {isOpen ? <X className="text-white w-6 h-6" /> : <Bot className="text-white w-8 h-8" />}
                    {!isOpen && <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white animate-pulse"><Sparkles className="w-3 h-3 text-white fill-white" /></div>}
                </button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col z-50 overflow-hidden border border-emerald-50">
                        <div className="bg-gradient-to-br from-emerald-700 to-teal-900 p-5 text-white">
                            <div className="flex items-center justify-between mb-1 opacity-80">
                                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-300" /> Powered by Llama 3.2 Vision + Whisper</span>
                                <Activity size={12} className="text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">Horizon AI Multimodal <Zap size={14} className="fill-yellow-400 text-yellow-400 animate-pulse" /></h3>
                            <p className="text-[10px] text-emerald-200 font-bold uppercase mt-1">Voz e Imágenes Activas</p>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                            {messages.map((m, i) => (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-4 rounded-2xl text-[12px] font-bold italic leading-relaxed shadow-sm max-w-[85%] flex flex-col gap-2 ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-gray-700 border border-emerald-50 rounded-tl-none'}`}>
                                        {m.image && <img src={m.image} alt="User upload" className="rounded-lg max-h-40 object-cover border border-white/20" />}
                                        <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && <div className="flex gap-1.5 p-2"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div><div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div></div>}
                        </div>

                        {/* SUGGESTION CHIPS */}
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto scrollbar-hide">
                            <button onClick={() => handleSend("📢 Sugiere una promo con los productos disponibles y armame el carrito")} className="whitespace-nowrap px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wide hover:bg-purple-200 transition-colors flex items-center gap-1">
                                <Sparkles size={10} /> Sugerir Promo & Cargar
                            </button>
                            <button onClick={() => handleSend("Analiza mi caja de hoy")} className="whitespace-nowrap px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wide hover:bg-blue-200 transition-colors">
                                💰 Analizar Caja
                            </button>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 mb-2">
                            {/* IMAGE PREVIEW */}
                            {selectedImage && (
                                <div className="mb-2 relative w-16 h-16 group">
                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" />
                                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12} /></button>
                                </div>
                            )}

                            <div className="flex gap-2 items-center bg-gray-50 rounded-2xl p-1 shadow-inner border border-gray-100">
                                {/* IMAGE BUTTON */}
                                <label className="cursor-pointer p-2 rounded-xl hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600">
                                    <ImageIcon size={18} />
                                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                </label>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    placeholder={isRecording ? "Escuchando..." : "Escribe o habla..."}
                                    className={`flex-1 bg-transparent border-none rounded-xl px-2 py-2 text-xs font-bold italic focus:ring-0 text-gray-700 ${isRecording ? 'animate-pulse text-red-500' : ''}`}
                                    disabled={isRecording}
                                />

                                {/* MIC BUTTON */}
                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white scale-110 shadow-red-500/50 shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <div className={isRecording ? 'animate-pulse' : ''}>
                                        {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Zap size={18} className="rotate-12" />}
                                    </div>
                                </button>

                                <button onClick={() => handleSend()} className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"><Send size={18} /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default AIAssistant;
