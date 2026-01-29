import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Save,
    RotateCcw,
    Trash2,
    Calendar,
    User,
    DollarSign,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Printer,
    Search,
    ShieldAlert,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
// AlertDialog replaced by manual confirmation for compatibility
import { useCaja } from '@/contexts/CajaContext';

// Helper for currency formatting
const fmt = (val) => new Intl.NumberFormat('es-PY').format(val);

function CashAudit() {
    const { toast } = useToast();
    const { currentSession, closeRegister, hardResetSystem } = useCaja();

    const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'report'
    const [auditHistory, setAuditHistory] = useState([]);

    // Form State for Physical Count
    const [counts, setCounts] = useState({
        // Monedas
        m50: 0, m100: 0, m500: 0, m1000: 0,
        // Billetes
        b2000: 0, b5000: 0, b10000: 0, b20000: 0, b50000: 0, b100000: 0,
        // Otros
        checksTotal: 0,
        transfersTotal: 0,
        debitCardsTotal: 0,
        creditCardsTotal: 0,
        fixedFund: 0 // Fondo Fijo
    });

    useEffect(() => {
        loadHistory();
    }, [currentSession]); // Reload if session state changes

    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('cashClosingHistory') || '[]');
        setAuditHistory(history);
    };

    const handleCountChange = (field, value) => {
        setCounts(prev => ({
            ...prev,
            [field]: value === '' ? 0 : parseFloat(value) || 0
        }));
    };

    const calculateTotals = () => {
        const coins = (counts.m50 * 50) + (counts.m100 * 100) + (counts.m500 * 500) + (counts.m1000 * 1000);
        const bills = (counts.b2000 * 2000) + (counts.b5000 * 5000) + (counts.b10000 * 10000) +
            (counts.b20000 * 20000) + (counts.b50000 * 50000) + (counts.b100000 * 100000);

        const nonCash = counts.checksTotal + counts.transfersTotal + counts.debitCardsTotal + counts.creditCardsTotal;

        // El Fondo Fijo es parte del dinero físico que SE DEJA en caja, pero para el arqueo del día:
        // Arqueo = (Dinero Físico Total) - (Fondo Fijo) = Dinero disponible para retirar/depositar
        // O dependiendo de la lógica del negocio. 
        // Asumiremos: Total Físico Encontrado = Billetes + Monedas
        // El sistema valida Total Físico vs (Saldo Esperado).

        const physicalTotal = coins + bills;

        return { coins, bills, physicalTotal, nonCash };
    };

    const totals = calculateTotals();

    const handleCloseRegister = () => {
        if (!currentSession) {
            toast({ title: "Error", description: "No hay sesión activa para cerrar.", variant: "destructive" });
            return;
        }

        try {
            // Pasamos el total físico para que el Context calcule la diferencia
            // Podríamos pasar notas sobre el fondo fijo si fuera necesario
            const notes = `Fondo Fijo declarado: ${fmt(counts.fixedFund)}`;
            const result = closeRegister(totals.physicalTotal, notes);

            toast({
                title: "Caja Cerrada Exitosamente",
                description: `Diferencia: ${fmt(result.discrepancy)} Gs.`,
                className: result.discrepancy === 0 ? "bg-green-600 text-white" : "bg-yellow-600 text-white"
            });

            setViewMode('list');
            loadHistory();
        } catch (error) {
            toast({ title: "Error al cerrar", description: error.message, variant: "destructive" });
        }
    };

    const handleHardReset = () => {
        // Double confirmation is handled by UI dialog generally, but here we call the context
        hardResetSystem();
    };

    // --- RENDER HELPERS ---

    const StatsCard = ({ title, value, icon: Icon, colorClass, subtext }) => (
        <div className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-start justify-between ${colorClass}`}>
            <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">{title}</p>
                <h3 className="text-2xl font-black">{value}</h3>
                {subtext && <p className="text-[10px] mt-1 opacity-80 font-bold">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );

    // --- UI MODES ---

    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 p-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header with Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestión de Fondos</h1>
                            <p className="text-sm text-gray-500 font-medium">Historial de Cierres y Arqueos</p>
                        </div>
                        <div className="flex gap-4">
                            {/* DANGER ZONE */}
                            {/* DANGER ZONE - Using window.confirm for simplicity and compatibility */}
                            <Button
                                onClick={() => {
                                    if (window.confirm("¿Estás absolutamente seguro? Esta acción borrará TODOS los datos de cajas, ventas y sesiones anteriores. El sistema se reiniciará a cero. No se puede deshacer.")) {
                                        handleHardReset();
                                    }
                                }}
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 font-bold"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Resetear Sistema
                            </Button>

                            {/* MAIN ACTION */}
                            {currentSession ? (
                                <Button
                                    onClick={() => setViewMode('form')}
                                    className="bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-xl shadow-xl font-bold uppercase tracking-wide text-sm flex items-center gap-2"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    Realizar Cierre de Caja
                                </Button>
                            ) : (
                                <div className="px-6 py-4 bg-gray-200 rounded-xl font-bold text-gray-500 flex items-center gap-2">
                                    <XCircle className="w-5 h-5" />
                                    Caja Cerrada (Abrir nueva sesión)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatsCard
                            title="Estado Actual"
                            value={currentSession ? "SESIÓN ACTIVA" : "CERRADO"}
                            icon={currentSession ? CheckCircle2 : XCircle}
                            colorClass={currentSession ? "text-green-600" : "text-gray-500"}
                            subtext={currentSession ? `Resp: ${currentSession.responsible}` : "Sin asignación"}
                        />
                        <StatsCard
                            title="Total Cierres"
                            value={auditHistory.filter(Boolean).length}
                            icon={History}
                            colorClass="text-blue-600"
                        />
                        <StatsCard
                            title="Último Cierre"
                            value={auditHistory.filter(Boolean).length > 0 ? new Date(auditHistory.filter(Boolean)[0].closingDate).toLocaleDateString() : "-"}
                            icon={Calendar}
                            colorClass="text-purple-600"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-gray-400" />
                            <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Auditoría de Sesiones</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-8 py-5">Fecha Cierre</th>
                                        <th className="px-8 py-5">Responsable</th>
                                        <th className="px-8 py-5 text-right">Saldo Esperado (Sistema)</th>
                                        <th className="px-8 py-5 text-right">Saldo Declarado (Físico)</th>
                                        <th className="px-8 py-5 text-right">Diferencia</th>
                                        <th className="px-8 py-5 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {auditHistory.length === 0 || !auditHistory.some(Boolean) ? (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-12 text-center text-gray-400 italic font-medium">
                                                No hay registros históricos. Inicia una sesión para comenzar.
                                            </td>
                                        </tr>
                                    ) : (
                                        auditHistory.filter(Boolean).map((session, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5 text-xs font-bold text-gray-600">
                                                    {new Date(session.closingDate).toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-xs font-medium text-gray-500">
                                                    {session.responsible}
                                                </td>
                                                <td className="px-8 py-5 text-right text-xs font-bold text-blue-900">
                                                    {fmt(session.expectedCash)} Gs.
                                                </td>
                                                <td className="px-8 py-5 text-right text-xs font-bold text-gray-900">
                                                    {fmt(session.actualCash)} Gs.
                                                </td>
                                                <td className={`px-8 py-5 text-right text-xs font-black ${session.discrepancy === 0 ? 'text-green-400' : 'text-red-500'}`}>
                                                    {fmt(session.discrepancy)} Gs.
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide ${session.discrepancy === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {session.discrepancy === 0 ? "Perfecto" : "Descuadre"}
                                                    </span>
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
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Navbar */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" className="hover:bg-gray-200" onClick={() => setViewMode('list')}>
                        <ChevronDown className="w-6 h-6 rotate-90" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900">Arqueo de Caja</h2>
                        <p className="text-gray-500 font-medium">Sesión de: <span className="text-blue-600">{currentSession?.responsible}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Form */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Billetes Section */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Billetes
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { k: 'b100000', l: '100.000' }, { k: 'b50000', l: '50.000' },
                                    { k: 'b20000', l: '20.000' }, { k: 'b10000', l: '10.000' },
                                    { k: 'b5000', l: '5.000' }, { k: 'b2000', l: '2.000' }
                                ].map(({ k, l }) => (
                                    <div key={k}>
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{l} Gs.</Label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={counts[k]}
                                            onChange={e => handleCountChange(k, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Monedas Section */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-current" /> Monedas
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { k: 'm1000', l: '1.000' }, { k: 'm500', l: '500' },
                                    { k: 'm100', l: '100' }, { k: 'm50', l: '50' }
                                ].map(({ k, l }) => (
                                    <div key={k}>
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{l} Gs.</Label>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={counts[k]}
                                            onChange={e => handleCountChange(k, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Others Section */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Otros Medios & Fondo
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Fondo Fijo (Dinero Base en Caja)</Label>
                                    <input
                                        type="number"
                                        className="w-full bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-lg font-black text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="0"
                                        value={counts.fixedFund}
                                        onChange={e => handleCountChange('fixedFund', e.target.value)}
                                    />
                                    <p className="text-[10px] text-blue-400 mt-1 font-medium">Este monto se considera parte del efectivo base.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Summary & Actions */}
                    <div className="space-y-6">
                        <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Efectivo Físico</h3>
                            <div className="text-4xl font-black mb-1">{fmt(totals.physicalTotal)} <span className="text-lg text-gray-500">Gs.</span></div>
                            <div className="h-px bg-gray-800 my-6" />

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Billetes</span>
                                    <span className="font-bold">{fmt(totals.bills)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Monedas</span>
                                    <span className="font-bold">{fmt(totals.coins)}</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button onClick={handleCloseRegister} className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest py-6 rounded-xl text-lg shadow-lg hover:shadow-green-500/20 transition-all">
                                    CONFIRMAR CIERRE
                                </Button>
                                <Button onClick={() => setViewMode('list')} variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white font-bold uppercase text-xs">
                                    Cancelar Operación
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Importante</h4>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Al confirmar, el sistema comparará el monto físico ingresado con el registro digital digital. Cualquier diferencia será registrada como faltante o sobrante.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CashAudit;
