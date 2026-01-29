import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Plus,
    Search,
    RotateCcw,
    FileText,
    Trash2,
    ChevronLeft,
    X,
    Save,
    Edit2,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useCaja } from '@/contexts/CajaContext';

function CashOpening() {
    const { toast } = useToast();
    const { openRegister, currentSession } = useCaja(); // USE CONTEXT

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
    const [isEditing, setIsEditing] = useState(false);
    const [openingHistory, setOpeningHistory] = useState([]);

    const [formData, setFormData] = useState({
        openingAmount: '',
        responsible: 'HugoBC',
        notes: '',
        openingDate: '',
        openingTime: ''
    });

    useEffect(() => {
        loadData();
    }, [currentSession]); // Reload when session changes

    const loadData = () => {
        const history = JSON.parse(localStorage.getItem('cashOpeningHistory') || '[]');
        setOpeningHistory(history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));

        // If there is an active session in context and we are in form mode, show it?
        // Actually, if active session exists, we should probably default to showing it or blocking new ones
        if (currentSession && viewMode === 'form') {
            // Logic: If already open, potentially show details or block
        }
    };

    const fmt = (val) => new Intl.NumberFormat('es-PY').format(val);

    const initializeDateTime = () => {
        // Logic Architect Validation: Check if already open via Context
        if (currentSession) {
            toast({
                title: "Caja ya abierta",
                description: "Debe cerrar la caja actual antes de abrir una nueva.",
                variant: "destructive"
            });
            // Don't switch to form mode if blocked
            return false;
        }

        const now = new Date();
        setFormData(prev => ({
            ...prev,
            openingDate: now.toISOString().split('T')[0],
            openingTime: now.toTimeString().slice(0, 5)
        }));
        return true;
    };

    const handleSave = () => {
        if (!formData.openingAmount || parseFloat(formData.openingAmount) < 0) {
            toast({ title: "Error", description: "Ingrese un monto válido", variant: "destructive" });
            return;
        }

        try {
            // CALL CONTEXT ACTION
            openRegister(formData.openingAmount, formData.responsible, formData.notes);

            setIsEditing(false);
            setViewMode('list');
            toast({ title: "Guardado", description: "La apertura de caja ha sido registrada" });
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const deleteOpening = (id) => {
        // Only allow deleting history, not active session through this maybe?
        // Converting to legacy behavior for history management
        if (window.confirm('¿Desea eliminar este registro de historial?')) {
            const newHistory = openingHistory.filter(h => h.id !== id);
            localStorage.setItem('cashOpeningHistory', JSON.stringify(newHistory));
            setOpeningHistory(newHistory);
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-black text-center text-blue-600 mb-8 uppercase tracking-widest">Aperturas de Caja</h1>

                    {/* Active Session Alert */}
                    {currentSession && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold uppercase text-xs">Caja Abierta Actual</p>
                                <p className="text-sm font-black">{currentSession.responsible} - {fmt(currentSession.openingAmount)} Gs.</p>
                            </div>
                            <div className="text-xs italic">{currentSession.openingTime}</div>
                        </div>
                    )}

                    {/* Filters Area */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-6 mb-8 mt-4">
                        <div className="flex flex-wrap justify-center gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Día:</span>
                                <select className="border-b border-gray-300 px-2 py-1 text-xs focus:outline-none w-16 italic font-bold">
                                    <option>----</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Mes:</span>
                                <select className="border-b border-gray-300 px-2 py-1 text-xs focus:outline-none w-20 italic font-bold">
                                    <option>----</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Año:</span>
                                <select className="border-b border-gray-300 px-2 py-1 text-xs focus:outline-none w-20 italic font-bold">
                                    <option>----</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Search className="w-5 h-5 text-blue-400 cursor-pointer" />
                            <RotateCcw className="w-5 h-5 text-green-400 cursor-pointer" />
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="p-4 flex justify-between items-center border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const canOpen = initializeDateTime();
                                        if (canOpen) {
                                            setIsEditing(true);
                                            setViewMode('form');
                                        }
                                    }}
                                    className={`p-1.5 rounded-full shadow-lg transition-all ${currentSession ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Nueva Apertura</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Buscar...</span>
                                <input type="text" className="border border-gray-200 rounded px-3 py-1 text-xs focus:outline-none italic" />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead className="bg-[#333a44] text-white text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">N°</th>
                                        <th className="px-6 py-4">FECHA</th>
                                        <th className="px-6 py-4">MONTO APERTURA</th>
                                        <th className="px-6 py-4">RESPONSABLE</th>
                                        <th className="px-6 py-4">ESTADO</th>
                                        <th className="px-6 py-4">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-600">
                                    {openingHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-gray-400 italic text-sm">No hay registros de apertura.</td>
                                        </tr>
                                    ) : (
                                        openingHistory.map((h, idx) => (
                                            <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-xs">{openingHistory.length - idx}</td>
                                                <td className="px-6 py-4 text-xs font-medium">{h.openingDate} {h.openingTime}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-700">{fmt(h.openingAmount)} Gs.</td>
                                                <td className="px-6 py-4 text-xs font-semibold">{h.responsible}</td>
                                                <td className="px-6 py-4">
                                                    {/* Check if this history item matches current session ID */}
                                                    {currentSession && currentSession.id === h.id ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase">ACTIVA</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">Histórico</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 h-full">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <button
                                                            onClick={() => deleteOpening(h.id)}
                                                            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm"
                                                        >
                                                            <X className="w-4 h-4 font-black" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // FORM MODE
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-blue-600 transition-colors" onClick={() => setViewMode('list')}>
                    <ChevronLeft className="w-6 h-6" />
                    <span className="font-bold text-sm uppercase">Volver al Listado</span>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Wallet className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Nueva Apertura</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Label className="block font-bold text-[10px] text-gray-400 uppercase mb-2">Monto inicial (Gs.)</Label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={formData.openingAmount}
                                    onChange={(e) => setFormData({ ...formData, openingAmount: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 italic"
                                />
                            ) : (
                                <div className="w-full border border-gray-100 rounded-lg px-4 py-3 bg-gray-50 text-lg font-bold text-gray-700 italic">
                                    {fmt(formData.openingAmount)} Gs.
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="block font-bold text-[10px] text-gray-400 uppercase mb-2">Responsable</Label>
                            <input
                                type="text"
                                value={formData.responsible}
                                readOnly={!isEditing}
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm italic font-bold"
                            />
                        </div>

                        <div>
                            <Label className="block font-bold text-[10px] text-gray-400 uppercase mb-2">Fecha y Hora</Label>
                            <div className="w-full border border-gray-100 rounded-lg px-4 py-3 bg-gray-50 text-sm font-bold text-gray-500 italic">
                                {formData.openingDate} {formData.openingTime}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        {isEditing && (
                            <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 uppercase italic">Confirmar Apertura</Button>
                        )}
                        <Button onClick={() => setViewMode('list')} variant="outline" className="border-2 border-gray-200 font-bold py-4 uppercase italic hover:bg-gray-50">Cancelar</Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default CashOpening;
