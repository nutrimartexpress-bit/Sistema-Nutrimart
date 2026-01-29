
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Zap, Loader2, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AIScanner = ({ onDataReceived, onCommandReceived }) => {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const API_URL = 'http://localhost:5000';

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_URL}/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success && result.data) {
                try {
                    onDataReceived(result.data);
                    toast({
                        title: "DocumentVisionAgent",
                        description: "Documento analizado con éxito.",
                        variant: "success"
                    });
                } catch (procError) {
                    console.error("Error en procesamiento de datos IA:", procError);
                    toast({
                        title: "Error de Formato",
                        description: "No se pudieron procesar todos los ítems del documento.",
                        variant: "warning"
                    });
                }
            } else {
                throw new Error(result.error || 'Error analizando imagen');
            }
        } catch (error) {
            console.error("Fallo de comunicación IA:", error);
            toast({
                title: "Error de Escaneo",
                description: "Fallo de conexión o formato inválido. Revisa el servidor local.",
                variant: "destructive"
            });
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
                await sendAudioToAI(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo acceder al micrófono.", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToAI = async (audioBlob) => {
        setIsScanning(true);
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const response = await fetch(`${API_URL}/process-audio`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success && result.intent) {
                try {
                    onCommandReceived(result.intent);
                    toast({
                        title: "VoiceCommandAgent",
                        description: `Comando detectado: ${result.intent.accion}`,
                    });
                } catch (cmdError) {
                    console.error("Error ejecutando comando IA:", cmdError);
                }
            }
        } catch (error) {
            console.error("Fallo de audio IA:", error);
            toast({ title: "Error", description: "Fallo al procesar el audio.", variant: "destructive" });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-2xl mb-6 border border-slate-700 shadow-2xl overflow-hidden relative">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f6,transparent)] animate-pulse" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Zap className="text-white fill-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase text-sm tracking-widest italic">Horizon Neuro-Link v1.5</h3>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">IA Modular Open Source Activa</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isScanning ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Camera size={16} className="text-blue-400" />}
                        Escanear Documento
                    </button>

                    <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={isScanning}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-50 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                    >
                        <Mic size={16} className={isRecording ? 'text-white' : 'text-emerald-400'} />
                        {isRecording ? 'Escuchando...' : 'Comando de Voz'}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3"
                    >
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-[9px] text-slate-400 font-black uppercase italic tracking-widest">
                            {isRecording ? 'Capturando audio para VoiceCommandAgent...' : 'DocumentVisionAgent procesando OCR y LLM local...'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIScanner;
