
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart,
    Search,
    RotateCcw,
    Trash2,
    Printer,
    Download,
    Filter,
    Edit2,
    Save,
    X,
    CheckCircle2,
    ChevronLeft,
    Plus,
    Table,
    FileText,
    DollarSign,
    Info,
    Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function SalesHistory() {
    const { toast } = useToast();
    const [sales, setSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'edit'
    const [selectedSale, setSelectedSale] = useState(null);
    const [editForm, setEditForm] = useState({ clientName: '', ruc: '', paymentMethod: '', total: 0 });
    const [selectedIds, setSelectedIds] = useState([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = () => {
        try {
            const savedSales = JSON.parse(localStorage.getItem('salesHistory') || '[]');
            const validSales = Array.isArray(savedSales) ? savedSales : [];

            // Sort by Date + Time Descending (Newest First)
            validSales.sort((a, b) => {
                const dateA = new Date(`${a.date || '1970-01-01'}T${a.time || '00:00:00'}`);
                const dateB = new Date(`${b.date || '1970-01-01'}T${b.time || '00:00:00'}`);
                return dateB - dateA;
            });

            setSales(validSales);
        } catch (error) {
            console.error("Error loading sales history:", error);
            setSales([]);
        }
    };

    const returnStock = (items) => {
        if (!items || !Array.isArray(items)) return;
        const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = [...currentProducts];

        items.forEach(soldItem => {
            const productIdx = updatedProducts.findIndex(p => p.code === soldItem.code);
            if (productIdx > -1) {
                const currentStockStr = (updatedProducts[productIdx].stock || '0').toString().replace(',', '.');
                const currentStockNum = parseFloat(currentStockStr);
                const soldQtyNum = parseFloat(soldItem.quantity) || 0;

                const newStock = currentStockNum + soldQtyNum;
                updatedProducts[productIdx].stock = newStock.toFixed(2).replace('.', ',');
            }
        });

        localStorage.setItem('products', JSON.stringify(updatedProducts));
    };

    const deleteSale = (id) => {
        if (window.confirm('¿Desea eliminar este registro de venta?')) {
            const updatedSales = sales.filter(s => s.id !== id);
            localStorage.setItem('salesHistory', JSON.stringify(updatedSales));
            setSales(updatedSales);

            const savedTransactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
            const updatedTransactions = savedTransactions.filter(t => t.id !== id);
            localStorage.setItem('cashTransactions', JSON.stringify(updatedTransactions));

            setSelectedIds(prev => prev.filter(sid => sid !== id));
            toast({ title: "Venta eliminada", description: "Registro borrado de ventas y caja." });
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Desea eliminar los ${selectedIds.length} registros seleccionados?`)) {
            // Return stock for all selected sales
            selectedIds.forEach(id => {
                const sale = sales.find(s => s.id === id);
                if (sale) returnStock(sale.items);
            });

            const updatedSales = sales.filter(s => !selectedIds.includes(s.id));
            localStorage.setItem('salesHistory', JSON.stringify(updatedSales));
            setSales(updatedSales);

            const savedTransactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
            const updatedTransactions = savedTransactions.filter(t => !selectedIds.includes(t.id));
            localStorage.setItem('cashTransactions', JSON.stringify(updatedTransactions));

            setSelectedIds([]);
            toast({
                title: "Ventas eliminadas",
                description: "Se han borrado los registros seleccionados de ventas y caja."
            });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSales.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSales.map(s => s.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const startEdit = (sale) => {
        setEditingId(sale.id);
        setSelectedSale({ ...sale });
        setEditForm({
            clientName: sale.clientName,
            ruc: sale.ruc,
            paymentMethod: sale.paymentMethod,
            total: sale.total,
            items: [...(sale.items || [])]
        });
        setViewMode('edit');
    };

    const updateItemQty = (index, newQty) => {
        const updatedItems = [...editForm.items];
        updatedItems[index].quantity = parseFloat(newQty) || 0;

        // Recalcular total de la venta
        const newTotal = updatedItems.reduce((acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            const disc = parseFloat(item.discount) || 0;
            const gross = qty * price;
            return acc + (gross - (gross * (disc / 100)));
        }, 0);

        setEditForm({ ...editForm, items: updatedItems, total: newTotal });
    };

    const handleUpdate = () => {
        if (!editingId) return;

        const originalSale = sales.find(s => s.id === editingId);
        if (!originalSale) return;

        // 1. Revertir Stock Anterior
        const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
        let updatedProducts = [...currentProducts];

        if (Array.isArray(originalSale.items)) {
            originalSale.items.forEach(oldItem => {
                const pIdx = updatedProducts.findIndex(p => p.code === oldItem.code);
                if (pIdx > -1) {
                    const currentStockStr = (updatedProducts[pIdx].stock || '0').toString().replace(',', '.');
                    const currentStockNum = parseFloat(currentStockStr) || 0;
                    const oldQtyNum = parseFloat(oldItem.quantity) || 0;
                    updatedProducts[pIdx].stock = (currentStockNum + oldQtyNum).toFixed(2).replace('.', ',');
                }
            });
        }

        // 2. Aplicar Nuevo Stock
        editForm.items.forEach(newItem => {
            const pIdx = updatedProducts.findIndex(p => p.code === newItem.code);
            if (pIdx > -1) {
                const currentStockStr = (updatedProducts[pIdx].stock || '0').toString().replace(',', '.');
                const currentStockNum = parseFloat(currentStockStr) || 0;
                const newQtyNum = parseFloat(newItem.quantity) || 0;
                updatedProducts[pIdx].stock = Math.max(0, currentStockNum - newQtyNum).toFixed(2).replace('.', ',');
            }
        });

        localStorage.setItem('products', JSON.stringify(updatedProducts));

        // 3. Actualizar Historial de Ventas
        const updatedSales = sales.map(s =>
            s.id === editingId ? { ...s, ...editForm } : s
        );
        localStorage.setItem('salesHistory', JSON.stringify(updatedSales));
        setSales(updatedSales);

        // 4. Sincronizar con Flujo de Caja
        const savedTransactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
        const updatedTransactions = savedTransactions.map(t => {
            if (t.id === editingId) {
                return {
                    ...t,
                    description: `${t.description.split(' - ')[0]} - ${editForm.clientName}`,
                    amount: editForm.total,
                    paymentMethod: editForm.paymentMethod
                };
            }
            return t;
        });
        localStorage.setItem('cashTransactions', JSON.stringify(updatedTransactions));

        setEditingId(null);
        setViewMode('list');
        toast({ title: "Venta actualizada", description: "Se ajustaron los productos, el total y el stock correctamente." });
    };

    const fmt = (val) => new Intl.NumberFormat('es-PY').format(val);

    const filteredSales = sales.filter(s => {
        const matchesSearch = (s.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.ruc || '').toString().includes(searchTerm) ||
            (s.type || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const saleDate = new Date(s.date || '1970-01-01');

        if (dateFrom) {
            const from = new Date(dateFrom);
            if (saleDate < from) return false;
        }

        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59); // Include the whole end day
            if (saleDate > to) return false;
        }

        return true;
    });

    const paymentMethods = ["Efectivo", "Tarjeta de Crédito", "Tarjeta de Débito", "Transferencia", "QR"];

    if (viewMode === 'edit') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-2 mb-6 text-gray-400 hover:text-blue-600 transition-all uppercase text-[10px] font-black"
                    >
                        <ChevronLeft size={16} /> Volver al Listado
                    </button>

                    <div className="bg-white rounded-[35px] shadow-2xl border border-blue-50 overflow-hidden">
                        <div className="bg-blue-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <DollarSign size={80} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                                <Edit2 size={24} /> Editar Comprobante
                            </h2>
                            <p className="text-blue-100 text-[10px] uppercase font-bold tracking-tighter mt-1">
                                ID: {editingId} | {selectedSale?.date} - {selectedSale?.time}
                            </p>
                        </div>

                        <div className="p-8">
                            {/* Header Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 uppercase font-black px-1">Cliente / Razón Social</label>
                                    <input
                                        type="text"
                                        value={editForm.clientName}
                                        onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-inner uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 uppercase font-black px-1">RUC / Documento</label>
                                    <input
                                        type="text"
                                        value={editForm.ruc}
                                        onChange={(e) => setEditForm({ ...editForm, ruc: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 uppercase font-black px-1">Método de Pago</label>
                                    <select
                                        value={editForm.paymentMethod}
                                        onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-blue-500 shadow-inner"
                                    >
                                        {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 uppercase font-black px-1">Estado</label>
                                    <div className="bg-green-50 text-green-700 rounded-2xl px-5 py-3 text-xs flex items-center gap-2">
                                        <CheckCircle2 size={16} /> VENTA COMPLETADA
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#333a44] text-white uppercase text-[9px] font-black">
                                        <tr>
                                            <th className="px-5 py-4">Descripción</th>
                                            <th className="px-5 py-4 text-center">Cant.</th>
                                            <th className="px-5 py-4 text-right">Precio</th>
                                            <th className="px-5 py-4 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {editForm.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 group">
                                                <td className="px-5 py-4">
                                                    <div className="font-black uppercase text-gray-700">{item.description}</div>
                                                    <div className="text-[8px] text-gray-400 font-mono italic">COD: {item.code}</div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemQty(idx, e.target.value)}
                                                        className="w-16 bg-blue-50/50 border-none rounded-lg text-center font-black text-blue-700 py-1 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-gray-500">
                                                    {fmt(item.unitPrice)}
                                                </td>
                                                <td className="px-5 py-4 text-right font-black text-blue-900">
                                                    {fmt(item.quantity * item.unitPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Summary */}
                            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 rounded-[30px] p-8 text-white">
                                <div className="mb-4 md:mb-0">
                                    <div className="text-[10px] uppercase text-blue-400 font-black mb-1">Total del Comprobante</div>
                                    <div className="text-4xl font-black">{fmt(editForm.total)} <span className="text-xl">Gs.</span></div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <X size={16} className="inline mr-2" /> Cancelar
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Guardar Cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-black text-center text-blue-700 mb-8 uppercase tracking-widest">Historial de Ventas</h1>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
                        <div className="text-[10px] uppercase text-gray-400">Documentos</div>
                        <div className="text-2xl text-blue-800">{sales.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-600">
                        <div className="text-[10px] uppercase text-gray-400">Total Facturado</div>
                        <div className="text-2xl text-green-700">{fmt(sales.reduce((acc, s) => acc + s.total, 0))} Gs.</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                        <div className="text-[10px] uppercase text-gray-400">Ticket Promedio</div>
                        <div className="text-2xl text-orange-600">
                            {sales.length > 0 ? fmt(sales.reduce((acc, s) => acc + s.total, 0) / sales.length) : 0} Gs.
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, RUC o tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-blue-50 rounded-lg text-sm italic focus:ring-1 focus:ring-blue-400"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border border-blue-50 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:ring-1 focus:ring-blue-400"
                            title="Desde"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border border-blue-50 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:ring-1 focus:ring-blue-400"
                            title="Hasta"
                        />
                    </div>

                    <div className="flex gap-2">
                        {selectedIds.length > 0 && (
                            <Button
                                onClick={handleBulkDelete}
                                className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Borrar ({selectedIds.length})
                            </Button>
                        )}
                        <Button variant="outline" className="flex items-center gap-2 border-gray-200" onClick={loadSales}>
                            <RotateCcw className="w-4 h-4 text-green-500" />
                            Refrescar
                        </Button>
                        <Button className="bg-blue-600 font-black uppercase text-xs">Exportar</Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead className="bg-[#333a44] text-white text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={filteredSales.length > 0 && selectedIds.length === filteredSales.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4">FECHA</th>
                                    <th className="px-6 py-4">HORA</th>
                                    <th className="px-6 py-4">TIPO</th>
                                    <th className="px-6 py-4 text-left">CLIENTE / RUC</th>
                                    <th className="px-6 py-4">MÉTODO</th>
                                    <th className="px-6 py-4 text-right">TOTAL GS.</th>
                                    <th className="px-6 py-4">ESTADO</th>
                                    <th className="px-6 py-4">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-bold italic">
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-gray-400 text-sm font-normal">Sin registros.</td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const isEditing = editingId === sale.id;
                                        return (
                                            <tr key={sale.id} className={`hover:bg-gray-50/50 transition-colors ${isEditing ? 'bg-blue-50' : ''} ${selectedIds.includes(sale.id) ? 'bg-blue-50/50' : ''}`}>
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(sale.id)}
                                                        onChange={() => toggleSelect(sale.id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-[10px] text-gray-500 font-bold">{sale.date || 'N/A'}</td>
                                                <td className="px-6 py-4 text-[10px] text-gray-400 font-mono italic">{sale.time}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${sale.type === 'INVOICE' ? 'text-blue-600 border-blue-600' : 'text-purple-600 border-purple-600'
                                                        }`}>
                                                        {sale.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    {isEditing ? (
                                                        <div className="space-y-1">
                                                            <input type="text" value={editForm.ruc} onChange={(e) => setEditForm({ ...editForm, ruc: e.target.value })} className="w-full text-[9px] border p-1 italic" placeholder="RUC" />
                                                            <input type="text" value={editForm.clientName} onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })} className="w-full text-xs border p-1 uppercase italic" placeholder="Nombre" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="text-[10px] text-gray-400">{sale.ruc}</div>
                                                            <div className="text-xs uppercase">{sale.clientName}</div>
                                                            <div className="text-[8px] text-blue-400">Items: {Array.isArray(sale.items) ? sale.items.length : sale.items || 0}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-[10px] uppercase">
                                                    {isEditing ? (
                                                        <select value={editForm.paymentMethod} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })} className="text-[9px] border italic">
                                                            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    ) : (
                                                        sale.paymentMethod
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-black text-blue-900 text-right">
                                                    {isEditing ? (
                                                        <input type="number" value={editForm.total} onChange={(e) => setEditForm({ ...editForm, total: e.target.value })} className="w-24 text-right border italic" />
                                                    ) : (
                                                        `${fmt(sale.total)} Gs.`
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="flex items-center justify-center gap-1 text-[9px] text-green-600 font-black">
                                                        <CheckCircle2 className="w-3 h-3" /> LISTO
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={() => handleUpdate(sale.id)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                                                                    <Save className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => setEditingId(null)} className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEdit(sale)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => deleteSale(sale.id)} className="p-2 bg-red-50 text-white rounded-lg hover:bg-red-600">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SalesHistory;
