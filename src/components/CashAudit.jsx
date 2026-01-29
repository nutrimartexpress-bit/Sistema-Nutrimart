/* VERSION 5.0 - ULTRA RESILIENTE - 09:30 */
import React, { useState, useEffect, useMemo } from 'react';
import { useCaja } from '@/contexts/CajaContext';

// Formateador estable de moneda
const formatMoney = (val) => {
    try {
        const num = parseFloat(val);
        if (isNaN(num)) return "0";
        return new Intl.NumberFormat('es-PY').format(num);
    } catch (e) {
        return "0";
    }
};

const CashAudit = () => {
    // Uso del contexto con fallback para evitar errores si el provider falla
    const context = useCaja();
    const { currentSession, transactions, closeRegister, hardResetSystem, isLoading } = context || {};

    const [view, setView] = useState('list'); // 'list' o 'form'
    const [history, setHistory] = useState([]);

    // Estado de los conteos
    const [counts, setCounts] = useState({
        b100000: '', b50000: '', b20000: '', b10000: '', b5000: '', b2000: '',
        m1000: '', m500: '', m100: '', m50: '',
        fixedFund: ''
    });

    // Cargar historial al iniciar
    useEffect(() => {
        try {
            const saved = localStorage.getItem('cashClosingHistory');
            if (saved) {
                const parsed = JSON.parse(saved);
                setHistory(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error("Error cargando historial", e);
        }
    }, [currentSession]);

    const handleChange = (field, value) => {
        // Solo números
        if (value !== '' && isNaN(value)) return;
        setCounts(prev => ({ ...prev, [field]: value }));
    };

    // Cálculos de totales físicos
    const physTotal = useMemo(() => {
        const p = (v) => parseFloat(v) || 0;
        const total = (p(counts.b100000) * 100000) +
            (p(counts.b50000) * 50000) +
            (p(counts.b20000) * 20000) +
            (p(counts.b10000) * 10000) +
            (p(counts.b5000) * 5000) +
            (p(counts.b2000) * 2000) +
            (p(counts.m1000) * 1000) +
            (p(counts.m500) * 500) +
            (p(counts.m100) * 100) +
            (p(counts.m50) * 50) +
            p(counts.fixedFund);
        return total;
    }, [counts]);

    // Dinero esperado por el sistema
    const sysBalance = useMemo(() => {
        if (!Array.isArray(transactions)) return 0;
        const aperture = parseFloat(currentSession?.openingAmount) || 0;
        const incomes = transactions
            .filter(t => t.type === 'income' && t.paymentMethod === 'Efectivo' && !t.isSystem)
            .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        return aperture + incomes - expenses;
    }, [transactions, currentSession]);

    const diff = physTotal - sysBalance;

    const handleConfirmClose = () => {
        if (!currentSession) return;
        if (window.confirm(`¿Cerrar caja hoy?\nTotal Auditado: ${formatMoney(physTotal)} Gs.\nDiferencia: ${formatMoney(diff)} Gs.`)) {
            try {
                closeRegister(physTotal, `Cierre realizado con arqueo. Fondo fijo: ${counts.fixedFund}`);
                window.location.reload(); // Recarga para limpiar estados globales
            } catch (e) {
                alert("Error al cerrar: " + e.message);
            }
        }
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center font-bold text-gray-400">Cargando...</div>;
    }

    // VISTA DE LISTA (Historial)
    if (view === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans antialiased text-gray-900">
                <div className="max-w-6xl mx-auto space-y-6">
                    <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Gestión de Arqueo</h1>
                            <p className="text-gray-400 text-xs font-bold">Control de saldos y cierres diarios</p>
                        </div>
                        <div className="flex gap-2">
                            {currentSession ? (
                                <button
                                    onClick={() => setView('form')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-lg transition-transform active:scale-95"
                                >
                                    REALIZAR ARQUEO
                                </button>
                            ) : (
                                <div className="bg-gray-200 text-gray-400 px-6 py-3 rounded-2xl font-black uppercase text-xs">Caja Cerrada</div>
                            )}
                            <button
                                onClick={() => { if (confirm("¿Reiniciar sistema?")) hardResetSystem(); }}
                                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                title="Reset total"
                            >
                                ↺
                            </button>
                        </div>
                    </header>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Fecha</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Cajero</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Sistema</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Físico</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.length === 0 ? (
                                    <tr><td colSpan="5" className="p-16 text-center text-gray-300 italic font-bold">No hay cierres registrados.</td></tr>
                                ) : (
                                    history.map((h, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-500">{new Date(h.closingDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium">{h.responsible}</td>
                                            <td className="px-6 py-4 text-sm text-right font-black text-gray-400">{formatMoney(h.expectedCash)}</td>
                                            <td className="px-6 py-4 text-sm text-right font-black text-gray-900">{formatMoney(h.actualCash)}</td>
                                            <td className={`px-6 py-4 text-sm text-right font-black ${h.discrepancy === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {h.discrepancy > 0 ? '+' : ''}{formatMoney(h.discrepancy)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // FORMULARIO DE ARQUEO
    return (
        <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-gray-900">
            <div className="max-w-6xl mx-auto">
                <header className="flex items-center gap-6 mb-10">
                    <button
                        onClick={() => setView('list')}
                        className="p-4 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all font-bold"
                    >
                        ✕
                    </button>
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Arqueo de Efectivo</h2>
                        <p className="text-gray-400 font-bold uppercase text-[10px]">Auditando sesión de: <span className="text-blue-600">{currentSession?.responsible}</span></p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* ENTRADAS */}
                    <div className="space-y-8">
                        <section className="bg-gray-50 p-6 rounded-[35px]">
                            <h3 className="text-xs font-black uppercase text-gray-400 mb-6 border-b pb-2 italic">Billetes y Monedas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100, 50].map(v => (
                                    <div key={v} className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400">{v.toLocaleString()} Gs.</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={counts[v >= 2000 ? `b${v}` : `m${v}`]}
                                            onChange={(e) => handleChange(v >= 2000 ? `b${v}` : `m${v}`, e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="0"
                                            className="w-full bg-white border border-transparent focus:border-blue-500 rounded-xl p-4 text-lg font-black outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-blue-50 p-6 rounded-[35px] border-2 border-dashed border-blue-200">
                            <h3 className="text-xs font-black uppercase text-blue-400 mb-2">Fondo de Caja (Cambio inicial)</h3>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={counts.fixedFund}
                                onChange={(e) => handleChange('fixedFund', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                placeholder="0"
                                className="w-full bg-white border-none rounded-2xl p-6 text-3xl font-black text-blue-900 shadow-xl shadow-blue-500/5 outline-none"
                            />
                        </section>
                    </div>

                    {/* RESUMEN */}
                    <div className="space-y-8">
                        <div className="bg-blue-600 text-white p-10 rounded-[50px] shadow-2xl space-y-6">
                            <h3 className="text-xs font-black uppercase opacity-60 border-b border-blue-400 pb-2 italic">Saldo de Sistema</h3>
                            <div className="space-y-4 font-bold text-sm">
                                <div className="flex justify-between"><span>Apertura de Caja</span><span>{formatMoney(currentSession?.openingAmount)}</span></div>
                                <div className="flex justify-between text-blue-200"><span>Ventas registradas</span><span>{formatMoney(sysBalance - (parseFloat(currentSession?.openingAmount) || 0))}</span></div>
                                <div className="pt-6 border-t border-blue-500 flex justify-between items-end">
                                    <span className="text-xs uppercase opacity-70">Esperado en Caja</span>
                                    <div className="text-4xl font-black tracking-tighter italic">{formatMoney(sysBalance)} Gs.</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 text-white p-10 rounded-[50px] shadow-2xl space-y-10 border-t-8 border-blue-600">
                            <div>
                                <h3 className="text-xs font-black uppercase text-gray-500 mb-2 tracking-widest">Total Auditado Actual</h3>
                                <div className="text-6xl font-black tracking-tighter text-white">{formatMoney(physTotal)}</div>
                            </div>

                            <div className={`p-8 rounded-[35px] border-4 ${diff === 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                <h4 className="text-[10px] font-black uppercase opacity-40 mb-1">Diferencia de Caja</h4>
                                <div className={`text-5xl font-black ${diff === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {diff > 0 ? '+' : ''}{formatMoney(diff)}
                                </div>
                                <div className={`text-[9px] font-black uppercase mt-3 inline-block px-3 py-1 rounded-full ${diff === 0 ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                                    {diff === 0 ? "Perfecto" : diff > 0 ? "Sobraría dinero" : "Faltaría dinero"}
                                </div>
                            </div>

                            <button
                                onClick={handleConfirmClose}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white py-8 rounded-3xl text-xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                            >
                                CONFIRMAR CIERRE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashAudit;
