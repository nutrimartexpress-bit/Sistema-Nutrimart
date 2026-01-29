import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Search,
    RotateCcw,
    FileText,
    Download,
    Eye,
    Edit3,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
    Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useCaja } from '@/contexts/CajaContext';
import * as XLSX from 'xlsx';

const fmt = (val) => new Intl.NumberFormat('es-PY').format(val || 0);

function CashFlow() {
    const { toast } = useToast();
    const { currentSession, transactions, history, addTransaction } = useCaja();

    // --- VIEW STATE ---
    const [viewMode, setViewMode] = useState('SESSION'); // 'SESSION' or 'REPORT'
    const [isAdding, setIsAdding] = useState(false);
    const [newMovement, setNewMovement] = useState({
        type: 'income',
        description: '',
        amount: '',
        concept: '',
        clientName: '',
        invoiceNumber: '',
        destination: 'Caja'
    });

    // --- FILTERS STATE ---
    const [filters, setFilters] = useState({
        day: '',
        month: '',
        year: new Date().getFullYear().toString(),
        type: '',
        origin: '',
        method: '',
        invoice: '',
        concept: '',
        description: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- DATA CONSOLIDATION ---
    // Combined data for Report mode
    const allHistoricalTransactions = useMemo(() => {
        const past = (history || []).filter(Boolean).flatMap(h => h?.transactionsSnapshot || []);
        const current = transactions || [];
        return [...current, ...past].sort((a, b) => new Date(b.timestamp || b.id) - new Date(a.timestamp || a.id));
    }, [history, transactions]);

    const activeData = viewMode === 'SESSION' ? transactions : allHistoricalTransactions;

    // --- FILTERING LOGIC ---
    const filteredResults = useMemo(() => {
        return activeData.filter(t => {
            const matchDay = !filters.day || t.date?.split('-')[2] === filters.day.padStart(2, '0');
            const matchMonth = !filters.month || t.date?.split('-')[1] === filters.month.padStart(2, '0');
            const matchYear = !filters.year || t.date?.includes(filters.year);
            const matchType = !filters.type || t.type === (filters.type === 'Ingreso' ? 'income' : 'expense');
            const matchOrigin = !filters.origin || t.destination === filters.origin;
            const matchMethod = !filters.method || t.paymentMethod?.toLowerCase().includes(filters.method.toLowerCase());
            const matchInvoice = !filters.invoice || t.invoiceNumber?.toLowerCase().includes(filters.invoice.toLowerCase());
            const matchConcept = !filters.concept || t.concept?.toLowerCase().includes(filters.concept.toLowerCase());
            const matchDescription = !filters.description || t.description?.toLowerCase().includes(filters.description.toLowerCase());

            return matchDay && matchMonth && matchYear && matchType && matchOrigin && matchMethod && matchInvoice && matchConcept && matchDescription;
        });
    }, [activeData, filters]);

    // --- CALCULATIONS ---
    const filteredIncome = filteredResults.filter(t => t.type === 'income').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
    const filteredExpense = filteredResults.filter(t => t.type === 'expense').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);

    const paginatedItems = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

    const handleExportExcel = () => {
        const dataToExport = filteredResults.map((t, i) => ({
            'N°': i + 1,
            'Fecha': t.date,
            'Hora': t.time,
            'Concepto': t.concept || (t.isManual ? 'Manual' : 'Factura'),
            'Descripción': t.description,
            'N° Fact/Ticket': t.invoiceNumber || '',
            'Razón Social': t.clientName || 'Sin Nombre',
            'Canal': t.paymentMethod,
            'Origen': t.destination || 'Caja',
            'Ingreso': t.type === 'income' ? t.amount : 0,
            'Egreso': t.type === 'expense' ? t.amount : 0
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Flujo de Caja");
        XLSX.writeFile(wb, `Reporte_Caja_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: "Exportación Exitosa", description: "Se ha descargado el reporte en Excel." });
    };

    const handleAddMovement = () => {
        addTransaction({ ...newMovement, amount: parseFloat(newMovement.amount), isManual: true });
        setIsAdding(false);
        setNewMovement({ type: 'income', description: '', amount: '', concept: 'MANUAL', clientName: '', invoiceNumber: '', destination: 'Caja' });
        toast({ title: "Registro exitoso", description: "Movimiento añadido correctamente." });
    };

    if (!currentSession && viewMode === 'SESSION') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-red-100 max-w-md">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-gray-800 uppercase mb-2">Caja Cerrada</h2>
                    <p className="text-gray-500 mb-6">Debe abrir una sesión para ver el flujo actual, o cambie al modo Reportes.</p>
                    <Button onClick={() => setViewMode('REPORT')} className="bg-blue-600 text-white font-black uppercase rounded-xl">Ver Reportes Históricos</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans text-gray-700">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Mode Toggle Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                    <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            onClick={() => setViewMode('SESSION')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'SESSION' ? 'bg-[#2e7d32] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            Flujo Sesión
                        </button>
                        <button
                            onClick={() => setViewMode('REPORT')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'REPORT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            Reportes Diarios
                        </button>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-black text-[#2e7d32] uppercase tracking-tighter shadow-green-500/10">Flujo de Caja</h1>
                    </div>
                </div>

                {/* Filter Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 shadow-gray-200/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Día</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.day} onChange={e => setFilters({ ...filters, day: e.target.value })}>
                                <option value="">---</option>
                                {[...Array(31)].map((_, i) => <option key={i + 1} value={(i + 1).toString()}>{i + 1}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Mes</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                                <option value="">---</option>
                                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => <option key={i} value={(i + 1).toString()}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Año</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Ingreso/Egreso</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                <option value="">---------</option>
                                <option value="Ingreso">Ingreso</option>
                                <option value="Egreso">Egreso</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Origen</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.origin} onChange={e => setFilters({ ...filters, origin: e.target.value })}>
                                <option value="">---------</option>
                                <option value="Caja">Caja</option>
                                <option value="Fondo Fijo">Fondo Fijo</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Método</label>
                            <select className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" value={filters.method} onChange={e => setFilters({ ...filters, method: e.target.value })}>
                                <option value="">---------</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Transferencia">Transferencia</option>
                            </select>
                        </div>
                        <div className="lg:col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400">Nro factura</label>
                            <input type="text" className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="..." value={filters.invoice} onChange={e => setFilters({ ...filters, invoice: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 text-center block">Concepto:</label>
                            <input type="text" className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: VENTA, GASTO..." value={filters.concept} onChange={e => setFilters({ ...filters, concept: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-gray-400 text-center block">Descripción:</label>
                            <input type="text" className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-green-500" placeholder="Búsqueda libre..." value={filters.description} onChange={e => setFilters({ ...filters, description: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-blue-500 shadow-sm"><Search size={20} /></button>
                        <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-green-500 shadow-sm" onClick={() => setFilters({ day: '', month: '', year: '2026', type: '', origin: '', method: '', invoice: '', concept: '', description: '' })}><RotateCcw size={20} /></button>
                        <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-full transition-colors text-orange-600 shadow-sm" onClick={handleExportExcel} title="Exportar a Excel"><Download size={20} /></button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <select className="bg-gray-50 border-none rounded-lg text-xs font-bold p-2" onChange={() => setCurrentPage(1)}>
                                <option>10</option>
                                <option>50</option>
                                <option>200</option>
                            </select>
                            <span className="text-[10px] uppercase font-black text-gray-400">Registros por página</span>
                        </div>
                        <div className="flex gap-2">
                            {viewMode === 'SESSION' && (
                                <button onClick={() => setIsAdding(true)} className="bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black uppercase text-[10px] px-6 py-2.5 rounded-xl shadow-lg border-2 border-white">Nuevo Movimiento</button>
                            )}
                            <button onClick={() => setViewMode('REPORT')} className="bg-[#343a40] hover:bg-black text-white font-black uppercase text-[10px] px-6 py-2.5 rounded-xl shadow-lg border-2 border-white">Reportes</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#343a40] text-white text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-5 py-4">N°</th>
                                    <th className="px-5 py-4">Fecha/Hora</th>
                                    <th className="px-5 py-4">Concepto</th>
                                    <th className="px-5 py-4">Descripción</th>
                                    <th className="px-5 py-4">N° Fact/Ticket</th>
                                    <th className="px-5 py-4">Razón Social</th>
                                    <th className="px-5 py-4">Canal</th>
                                    <th className="px-5 py-4">Origen</th>
                                    <th className="px-5 py-4 text-right">Ingreso</th>
                                    <th className="px-5 py-4 text-right">Egreso</th>
                                    <th className="px-5 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-[11px] font-bold">
                                {paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="px-5 py-12 text-center text-gray-400 italic font-medium">No se encontraron movimientos con los filtros aplicados.</td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((t, i) => (
                                        <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-4">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                            <td className="px-5 py-4">
                                                <span className="block text-gray-400 text-[9px] mb-0.5">{t.date}</span>
                                                <span>{t.time}</span>
                                            </td>
                                            <td className="px-5 py-4 text-blue-600">{t.concept || (t.isManual ? 'MANUAL' : (t.invoiceNumber ? 'FACTURA' : 'SISTEMA'))}</td>
                                            <td className="px-5 py-4 max-w-[200px] truncate" title={t.description}>{t.description}</td>
                                            <td className="px-5 py-4 font-mono text-gray-400 text-[10px]">{t.invoiceNumber || '---'}</td>
                                            <td className="px-5 py-4 truncate max-w-[150px]">{t.clientName || (t.isSystem ? 'SISTEMA' : 'GLOBAL')}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${t.paymentMethod === 'Efectivo' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {t.paymentMethod || 'Efectivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-400">{t.destination || 'Caja'}</td>
                                            <td className="px-5 py-4 text-right text-green-600">{t.type === 'income' ? fmt(t.amount) : '0'}</td>
                                            <td className="px-5 py-4 text-right text-red-600">{t.type === 'expense' ? fmt(t.amount) : '0'}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Eye size={12} /></button>
                                                    <button className="p-1.5 bg-gray-50 text-gray-400 rounded-lg"><Edit3 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase text-gray-400">
                        <div>Viendo registros {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredResults.length)} de un total de {filteredResults.length}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30" disabled={currentPage === 1}><ChevronLeft size={14} /></button>
                            {[...Array(totalPages)].slice(0, 5).map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg transition-all ${currentPage === i + 1 ? 'bg-[#2e7d32] text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>
                            ))}
                            {totalPages > 5 && <span className="self-center">...</span>}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30" disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
                        </div>
                    </div>
                </div>

                {/* Footers / Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Filtered Summary */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-blue-400">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Ingresos Filtrados</p>
                                <p className="text-sm font-black text-gray-800">{fmt(filteredIncome)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Egresos Filtrados</p>
                                <p className="text-sm font-black text-gray-800">{fmt(filteredExpense)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Diferencia neta</p>
                                <p className="text-sm font-black text-blue-600">{fmt(filteredIncome - filteredExpense)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">% del Total</p>
                                <p className="text-sm font-black">100%</p>
                            </div>
                        </div>
                    </div>

                    {/* Overall Session Summary (If available) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 border-l-4 border-l-green-400">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Ingresos de Sesión</p>
                                <p className="text-base font-black text-green-700">{fmt(transactions.filter(t => t.type === 'income').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0))}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Egresos de Sesión</p>
                                <p className="text-base font-black text-red-600">{fmt(transactions.filter(t => t.type === 'expense').reduce((a, b) => a + (parseFloat(b.amount) || 0), 0))}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Saldo Real Actual</p>
                                <p className="text-lg font-black text-blue-900">{fmt(transactions.reduce((a, b) => a + (b.type === 'income' ? parseFloat(b.amount) : -parseFloat(b.amount)), 0))}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Manual Add Overlay */}
                <AnimatePresence>
                    {isAdding && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl space-y-6">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-800">Cargar Movimiento</h3>
                                    <button onClick={() => setIsAdding(false)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={24} /></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setNewMovement({ ...newMovement, type: 'income' })} className={`py-5 rounded-[25px] font-black uppercase text-xs border-2 transition-all ${newMovement.type === 'income' ? 'bg-green-500 text-white border-green-600 shadow-lg scale-[1.02]' : 'bg-white text-green-600 border-green-500 hover:bg-green-50'}`}>Ingreso</button>
                                        <button onClick={() => setNewMovement({ ...newMovement, type: 'expense' })} className={`py-5 rounded-[25px] font-black uppercase text-xs border-2 transition-all ${newMovement.type === 'expense' ? 'bg-red-500 text-white border-red-600 shadow-lg scale-[1.02]' : 'bg-white text-red-600 border-red-500 hover:bg-red-50'}`}>Egreso</button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Concepto / Motivo</label>
                                            <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="EJ: PAGO PROVEEDOR, VENTA EXTRA..." value={newMovement.description} onChange={e => setNewMovement({ ...newMovement, description: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block ml-2">Monto Gs.</label>
                                            <input type="number" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-blue-900 text-3xl text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" value={newMovement.amount} onChange={e => setNewMovement({ ...newMovement, amount: e.target.value })} />
                                        </div>
                                    </div>
                                    <Button className="w-full bg-[#343a40] hover:bg-black text-white py-8 rounded-[25px] font-black uppercase tracking-[3px] text-base shadow-xl active:scale-95 transition-all" onClick={handleAddMovement}>Confirmar y Registrar</Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

export default CashFlow;
