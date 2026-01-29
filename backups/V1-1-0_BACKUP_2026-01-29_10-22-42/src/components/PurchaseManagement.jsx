
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, Save, X, Package,
    ChevronLeft, CheckCircle2, ShoppingBag, PlusCircle,
    User, FileText, DollarSign, ArrowRight, Zap, Edit2,
    Printer, Download, RotateCcw, AlertOctagon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PurchasePDF from './PurchasePDF';

function PurchaseManagement() {
    const { toast } = useToast();
    const [products, setProducts] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'form'
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);

    // Purchase Form State
    const [supplier, setSupplier] = useState('');
    const [invoiceNum, setInvoiceNum] = useState('');
    const [purchaseType, setPurchaseType] = useState('Compra'); // 'Compra' | 'Devolución'
    const [purchaseItems, setPurchaseItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const savedPurchases = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
        setProducts(savedProducts);
        setPurchases(savedPurchases);
    };

    const fmt = (val) => new Intl.NumberFormat('es-PY').format(val || 0);

    const filteredProducts = products.filter(p =>
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.includes(searchTerm)
    );

    const addItem = (p) => {
        const existingIdx = purchaseItems.findIndex(item => item.code === p.code);
        if (existingIdx > -1) {
            toast({ title: "Aviso", description: "El producto ya está en la lista" });
            return;
        }

        const newItem = {
            ...p,
            purchaseQty: 1,
            newCost: parseFloat(p.cost) || 0,
            newPercentage: parseFloat(p.percentage) || 0,
            newRetailPrice: parseFloat(p.retailPrice) || 0,
            newWholesalePrice: parseFloat(p.wholesalePrice) || 0,
            newTaxType: p.taxType || 'IVA 10%'
        };
        setPurchaseItems([...purchaseItems, newItem]);
        setSearchTerm('');
        setShowResults(false);
    };

    const addNewProduct = () => {
        if (purchaseType === 'Devolución') {
            toast({ title: "Error", description: "No se pueden crear productos nuevos en modo Devolución", variant: "destructive" });
            return;
        }
        const newItem = {
            id: Date.now() + Math.random(),
            code: searchTerm || '',
            description: searchTerm.toUpperCase() || 'NUEVO PRODUCTO',
            type: 'Articulo',
            brand: '',
            stock: '0',
            minStock: '1',
            wholesaleQty: '2',
            unit: 'Unid',
            cost: '0',
            percentage: '0',
            retailPrice: '0',
            wholesalePrice: '0',
            taxType: 'IVA 10%',
            purchaseQty: 1,
            newCost: 0,
            newPercentage: 0,
            newRetailPrice: 0,
            newWholesalePrice: 0,
            newTaxType: 'IVA 10%',
            isNew: true
        };
        setPurchaseItems([...purchaseItems, newItem]);
        setSearchTerm('');
        setShowResults(false);
    };

    const updateItem = (index, field, value) => {
        const updated = [...purchaseItems];
        updated[index][field] = value;

        if (field === 'newCost' || field === 'newPercentage') {
            const cost = parseFloat(field === 'newCost' ? value : updated[index].newCost) || 0;
            const pct = parseFloat(field === 'newPercentage' ? value : updated[index].newPercentage) || 0;
            updated[index].newRetailPrice = Math.round(cost * (1 + pct / 100));
            updated[index].newWholesalePrice = Math.round(cost * (1 + (pct * 0.8) / 100));
        }

        setPurchaseItems(updated);
    };

    const removeItem = (index) => {
        setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return purchaseItems.reduce((acc, item) => acc + (parseFloat(item.newCost) * parseFloat(item.purchaseQty)), 0);
    };

    const handleSavePurchase = () => {
        if (!supplier) {
            toast({ title: "Error", description: "Debe ingresar un proveedor", variant: "destructive" });
            return;
        }
        if (purchaseItems.length === 0) {
            toast({ title: "Error", description: "Debe agregar al menos un producto", variant: "destructive" });
            return;
        }

        const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = [...currentProducts];

        // 1. Revertir stock si es EDICION
        if (editingPurchaseId) {
            const oldPurchase = purchases.find(p => p.id === editingPurchaseId);
            if (oldPurchase && oldPurchase.detailedItems) {
                const multiplier = oldPurchase.type === 'Devolución' ? 1 : -1;
                // Si era compra, restamos stock (-1). Si era devolución, sumamos stock (+1).
                oldPurchase.detailedItems.forEach(oldItem => {
                    const pIdx = updatedProducts.findIndex(p => p.code === oldItem.code);
                    if (pIdx > -1) {
                        const currentStock = parseFloat(updatedProducts[pIdx].stock.toString().replace(',', '.')) || 0;
                        const oldQty = parseFloat(oldItem.purchaseQty) || 0;
                        updatedProducts[pIdx].stock = (currentStock + (oldQty * multiplier)).toString().replace('.', ',');
                    }
                });
            }
        }

        // 2. Aplicar nuevos items
        const currentMultiplier = purchaseType === 'Devolución' ? -1 : 1;

        purchaseItems.forEach(item => {
            const idx = updatedProducts.findIndex(p => p.code === item.code);

            const productData = {
                id: item.id,
                code: item.code,
                description: item.description,
                type: item.type,
                brand: item.brand,
                unit: item.unit,
                cost: item.newCost.toString(),
                percentage: item.newPercentage.toString(),
                retailPrice: item.newRetailPrice.toString(),
                wholesalePrice: item.newWholesalePrice.toString(),
                taxType: item.newTaxType,
                minStock: item.minStock,
                wholesaleQty: item.wholesaleQty,
                location: item.location || 'Matriz'
            };

            if (idx > -1) {
                const currentStock = parseFloat(updatedProducts[idx].stock.toString().replace(',', '.')) || 0;
                const addedStock = parseFloat(item.purchaseQty) || 0;
                updatedProducts[idx] = {
                    ...updatedProducts[idx],
                    ...productData,
                    stock: (currentStock + (addedStock * currentMultiplier)).toString().replace('.', ',')
                };
            } else if (purchaseType === 'Compra') {
                updatedProducts.push({
                    ...productData,
                    stock: item.purchaseQty.toString().replace('.', ',')
                });
            }
        });

        localStorage.setItem('products', JSON.stringify(updatedProducts));

        const purchaseData = {
            id: editingPurchaseId || Date.now(),
            date: editingPurchaseId ? purchases.find(p => p.id === editingPurchaseId).date : new Date().toLocaleDateString(),
            time: editingPurchaseId ? purchases.find(p => p.id === editingPurchaseId).time : new Date().toLocaleTimeString(),
            supplier,
            invoiceNum,
            type: purchaseType,
            total: calculateTotal(),
            items: purchaseItems.length,
            detailedItems: purchaseItems
        };

        let updatedPurchases;
        if (editingPurchaseId) {
            updatedPurchases = purchases.map(p => p.id === editingPurchaseId ? purchaseData : p);
        } else {
            updatedPurchases = [purchaseData, ...purchases];
        }

        localStorage.setItem('purchaseHistory', JSON.stringify(updatedPurchases));

        toast({ title: "Éxito", description: `${purchaseType} procesada correctamente.` });
        resetForm();
        setPurchases(updatedPurchases);
        setViewMode('list');
        loadData();
    };

    const deletePurchase = (id) => {
        if (!window.confirm('¿Está seguro de eliminar este registro? El stock se revertirá.')) return;

        const purchaseToDelete = purchases.find(p => p.id === id);
        if (!purchaseToDelete) return;

        const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
        const updatedProducts = [...currentProducts];

        if (purchaseToDelete.detailedItems) {
            const multiplier = purchaseToDelete.type === 'Devolución' ? 1 : -1;
            // Eliminar Compra -> Restar stock. Eliminar Devolución -> Sumar stock.
            purchaseToDelete.detailedItems.forEach(item => {
                const pIdx = updatedProducts.findIndex(p => p.code === item.code);
                if (pIdx > -1) {
                    const currentStock = parseFloat(updatedProducts[pIdx].stock.toString().replace(',', '.')) || 0;
                    const qtyToRevert = parseFloat(item.purchaseQty) || 0;
                    updatedProducts[pIdx].stock = (currentStock + (qtyToRevert * multiplier)).toString().replace('.', ',');
                }
            });
        }

        const updatedPurchases = purchases.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        localStorage.setItem('purchaseHistory', JSON.stringify(updatedPurchases));

        setPurchases(updatedPurchases);
        toast({ title: "Registro eliminado", description: "El stock ha sido revertido." });
        loadData();
    };

    const startEditPurchase = (p) => {
        setEditingPurchaseId(p.id);
        setSupplier(p.supplier);
        setInvoiceNum(p.invoiceNum);
        setPurchaseType(p.type || 'Compra');
        setPurchaseItems(p.detailedItems || []);
        setViewMode('form');
    };

    const resetForm = () => {
        setSupplier('');
        setInvoiceNum('');
        setPurchaseType('Compra');
        setPurchaseItems([]);
        setSearchTerm('');
        setEditingPurchaseId(null);
    };

    const inputClass = "px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold italic focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all";

    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-black text-center text-blue-700 mb-8 uppercase tracking-widest flex items-center justify-center gap-4">
                        <ShoppingBag className="w-10 h-10" />
                        Registro de Compras y Devoluciones
                    </h1>

                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2">
                            <Button onClick={() => { resetForm(); setPurchaseType('Compra'); setViewMode('form'); }} className="bg-blue-600 font-black uppercase text-xs">
                                <Plus size={16} className="mr-2" /> Nueva Compra
                            </Button>
                            <Button onClick={() => { resetForm(); setPurchaseType('Devolución'); setViewMode('form'); }} variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 font-black uppercase text-xs">
                                <RotateCcw size={16} className="mr-2" /> Devolución
                            </Button>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Balance en Movimientos:</span>
                            <div className="text-xl text-blue-900">
                                {fmt(purchases.reduce((acc, p) => p.type === 'Devolución' ? acc - p.total : acc + p.total, 0))} Gs.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 italic">
                        <table className="w-full text-center">
                            <thead className="bg-[#333a44] text-white text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-5">TIPO / FECHA</th>
                                    <th className="px-6 py-5 text-left">PROVEEDOR / FACTURA</th>
                                    <th className="px-6 py-5">ITEMS</th>
                                    <th className="px-6 py-5 text-right">TOTAL</th>
                                    <th className="px-6 py-5">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px] font-black italic uppercase text-gray-700">
                                {purchases.length === 0 ? (
                                    <tr><td colSpan="5" className="py-20 text-gray-400">No hay movimientos registrados.</td></tr>
                                ) : (
                                    purchases.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className={`text-[9px] px-2 py-0.5 rounded-full inline-block mb-1 ${p.type === 'Devolución' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {p.type || 'Compra'}
                                                </div>
                                                <div className="text-blue-600">{p.date}</div>
                                                <div className="text-[9px] text-gray-400">{p.time}</div>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="uppercase">{p.supplier}</div>
                                                <div className="text-[10px] text-gray-400 font-bold">FA: {p.invoiceNum || 'S/N'}</div>
                                            </td>
                                            <td className="px-6 py-4">{p.items}</td>
                                            <td className={`px-6 py-4 text-right font-black ${p.type === 'Devolución' ? 'text-red-700' : 'text-blue-900'}`}>
                                                {p.type === 'Devolución' ? '-' : ''}{fmt(p.total)} Gs.
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <PDFDownloadLink document={<PurchasePDF purchaseData={p} />} fileName={`${p.type || 'Compra'}_${p.id}.pdf`}>
                                                        {({ loading }) => (
                                                            <button className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all shadow-sm">
                                                                <Printer size={14} />
                                                            </button>
                                                        )}
                                                    </PDFDownloadLink>
                                                    <button onClick={() => startEditPurchase(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all shadow-sm">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => deletePurchase(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all shadow-sm">
                                                        <Trash2 size={14} />
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
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
            <div className="max-w-7xl mx-auto">
                <div onClick={() => { resetForm(); setViewMode('list'); }} className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-blue-600 transition-all w-fit">
                    <ChevronLeft size={20} />
                    <span className="text-xs uppercase font-black tracking-widest">Volver al Historial</span>
                </div>

                <div className={`bg-white p-8 rounded-[35px] shadow-2xl border-2 transition-all ${purchaseType === 'Devolución' ? 'border-red-100' : 'border-blue-100'} mb-8`}>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className={`text-2xl font-black uppercase flex items-center gap-3 ${purchaseType === 'Devolución' ? 'text-red-600' : 'text-blue-700'}`}>
                            {purchaseType === 'Devolución' ? <RotateCcw className="w-8 h-8" /> : (editingPurchaseId ? <Edit2 className="w-8 h-8" /> : <PlusCircle className="w-8 h-8" />)}
                            {editingPurchaseId ? `Editar ${purchaseType}` : `Cargar Nueva ${purchaseType}`}
                        </h2>

                        {!editingPurchaseId && (
                            <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                                <button onClick={() => setPurchaseType('Compra')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${purchaseType === 'Compra' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>Compra</button>
                                <button onClick={() => setPurchaseType('Devolución')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${purchaseType === 'Devolución' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Devolución</button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-2 block font-black flex items-center gap-2 tracking-widest">
                                <User size={12} /> Proveedor
                            </Label>
                            <input
                                type="text"
                                value={supplier}
                                onChange={e => setSupplier(e.target.value.toUpperCase())}
                                className={inputClass + " w-full uppercase"}
                                placeholder="NOMBRE DEL PROVEEDOR"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-2 block font-black flex items-center gap-2 tracking-widest">
                                <FileText size={12} /> N° Factura / Boleta
                            </Label>
                            <input
                                type="text"
                                value={invoiceNum}
                                onChange={e => setInvoiceNum(e.target.value)}
                                className={inputClass + " w-full"}
                                placeholder="000-000-0000000"
                            />
                        </div>
                    </div>

                    <div className="relative mb-8">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto a procesar..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setShowResults(true);
                                    }}
                                    className={inputClass + " w-full pl-10 h-12 text-sm"}
                                />
                            </div>
                            {purchaseType === 'Compra' && (
                                <Button onClick={addNewProduct} className="bg-blue-600 h-12 px-6">
                                    <Plus size={20} />
                                </Button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showResults && searchTerm && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto"
                                >
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => addItem(p)}
                                            className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 font-bold"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase text-gray-800">{p.description}</span>
                                                <span className="text-[9px] text-blue-500 font-bold tracking-tighter">Cod: {p.code} | STOCK DISP: {p.stock}</span>
                                            </div>
                                            <span className="text-xs text-blue-600 font-black">{fmt(p.retailPrice)} Gs.</span>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && purchaseType === 'Compra' && (
                                        <div className="p-4 text-center text-gray-400 text-xs uppercase cursor-pointer hover:text-blue-600" onClick={addNewProduct}>
                                            No se encontró. Clic para crear producto nuevo.
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="overflow-x-auto mb-10 border rounded-3xl overflow-hidden shadow-inner">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400 border-b">
                                <tr>
                                    <th className="px-4 py-5 text-left">PRODUCTO</th>
                                    <th className="px-4 py-5 w-20">CANT.</th>
                                    <th className="px-4 py-5 w-32">COSTO UNI.</th>
                                    <th className="px-4 py-5 w-20">UTIL %</th>
                                    <th className="px-4 py-5 w-32">P. VENTA</th>
                                    <th className="px-4 py-5 w-24">IVA</th>
                                    <th className="px-4 py-5 w-32 text-right">SUBTOTAL</th>
                                    <th className="px-4 py-5 w-12 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchaseItems.length === 0 ? (
                                    <tr><td colSpan="8" className="py-20 text-center text-gray-300 text-xs uppercase font-black tracking-widest italic">Por favor agregue productos a la {purchaseType.toLowerCase()}</td></tr>
                                ) : (
                                    purchaseItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 group transition-all">
                                            <td className="px-4 py-4">
                                                <div className="text-xs font-black uppercase text-gray-700">{item.description}</div>
                                                <div className="text-[9px] text-gray-400 font-bold">Cod: {item.code} {item.isNew && <span className="text-emerald-500 ml-2">★ NUEVO</span>}</div>
                                            </td>
                                            <td className="px-2 py-4">
                                                <input
                                                    type="number"
                                                    value={item.purchaseQty}
                                                    onChange={e => updateItem(idx, 'purchaseQty', e.target.value)}
                                                    className={`w-full p-2 border-b border-gray-200 text-center text-xs focus:ring-0 outline-none font-black ${purchaseType === 'Devolución' ? 'text-red-600' : 'text-blue-600'}`}
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <input
                                                    type="number"
                                                    value={item.newCost}
                                                    onChange={e => updateItem(idx, 'newCost', e.target.value)}
                                                    className="w-full p-2 border-b border-gray-200 text-center text-xs focus:ring-0 outline-none font-black text-gray-700"
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <input
                                                    type="number"
                                                    value={item.newPercentage}
                                                    onChange={e => updateItem(idx, 'newPercentage', e.target.value)}
                                                    className="w-full p-2 border-b border-gray-200 text-center text-xs focus:ring-0 outline-none font-black text-gray-400"
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <input
                                                    type="number"
                                                    value={item.newRetailPrice}
                                                    onChange={e => updateItem(idx, 'newRetailPrice', e.target.value)}
                                                    className="w-full p-2 border-b border-gray-200 text-center text-xs focus:ring-0 outline-none font-black text-green-700"
                                                />
                                            </td>
                                            <td className="px-2 py-4">
                                                <select
                                                    value={item.newTaxType}
                                                    onChange={e => updateItem(idx, 'newTaxType', e.target.value)}
                                                    className="w-full p-1 border-b border-gray-200 text-[10px] focus:ring-0 outline-none font-black text-gray-500"
                                                >
                                                    <option value="IVA 10%">10%</option>
                                                    <option value="IVA 5%">5%</option>
                                                    <option value="Exento">EX</option>
                                                </select>
                                            </td>
                                            <td className={`px-4 py-4 text-right text-xs font-black ${purchaseType === 'Devolución' ? 'text-red-700' : 'text-blue-900'}`}>
                                                {fmt(parseFloat(item.newCost) * parseFloat(item.purchaseQty))} Gs.
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button onClick={() => removeItem(idx)} className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className={`${purchaseType === 'Devolución' ? 'bg-red-50' : 'bg-blue-50'} p-6 rounded-3xl flex items-center gap-4 w-full md:w-auto transition-colors`}>
                            {purchaseType === 'Devolución' ? <RotateCcw className="text-red-600 w-8 h-8" /> : <DollarSign className="text-blue-600 w-8 h-8" />}
                            <div>
                                <span className={`text-[10px] uppercase font-black tracking-widest ${purchaseType === 'Devolución' ? 'text-red-400' : 'text-blue-400'}`}>
                                    Total {purchaseType === 'Devolución' ? 'a Descontar' : 'a Pagar'}
                                </span>
                                <div className={`text-3xl font-black ${purchaseType === 'Devolución' ? 'text-red-900' : 'text-blue-900'}`}>
                                    {purchaseType === 'Devolución' ? '-' : ''}{fmt(calculateTotal())} Gs.
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button onClick={() => { resetForm(); setViewMode('list'); }} variant="outline" className="flex-1 py-6 rounded-3xl text-xs font-black uppercase h-14 border-gray-200 tracking-widest hover:bg-gray-50 transition-all">
                                <X size={18} className="mr-2" /> Cancelar
                            </Button>
                            <Button onClick={handleSavePurchase} className={`flex-1 py-6 rounded-3xl text-sm font-black uppercase h-14 shadow-xl transition-all ${purchaseType === 'Devolución' ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-green-600 shadow-green-100 hover:bg-green-700'}`}>
                                <Save size={20} className="mr-2" />
                                {editingPurchaseId ? 'Guardar Cambios' : `Finalizar ${purchaseType}`}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-4 text-[10px] text-gray-300 font-black uppercase tracking-widest italic">
                    <AlertOctagon size={16} className="text-yellow-400" />
                    Protocolo de Sincronización v1.1.0 - Horizon Advanced Pos
                </div>
            </div>
        </div>
    );
}

export default PurchaseManagement;
