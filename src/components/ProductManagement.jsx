
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, RotateCcw, Trash2, Edit2, Save, X, Package,
    ChevronLeft, Image as ImageIcon, CheckCircle2, AlertCircle, Filter, Zap,
    Upload, Download, FileSpreadsheet, Settings2, Table, Info, Eye, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

function ProductManagement() {
    const { toast } = useToast();
    const [viewMode, setViewMode] = useState('list'); // 'list', 'form', 'import'
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // --- CSV IMPORT STATE ---
    const [csvFile, setCsvFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvPreview, setCsvPreview] = useState([]);
    const [delimiter, setDelimiter] = useState(',');

    const [mapping, setMapping] = useState({
        name: '',
        productGroup: '',
        sku: '',
        barcode: '',
        unit: '',
        cost: '',
        profit: '',
        price: '',
        tax: '',
        priceIncludesTax: '',
        allowPriceChange: '',
        useDefaultQty: '',
        isService: '',
        isEnabled: '',
        description: '',
        quantity: '',
        supplier: '',
        reorderPoint: '',
        preferredQty: '',
        lowStockAlert: '',
        lowStockQty: ''
    });

    const [importOptions, setImportOptions] = useState({
        ignoreDuplicates: true,
        mergeDuplicates: false,
        createFrom: 'Inventory Count' // 'Inventory Count' or 'Purchase'
    });

    const [formData, setFormData] = useState({
        id: null,
        code: '',
        type: '',
        brand: '',
        description: '',
        color: '',
        stock: '0,0',
        minStock: '1,0',
        wholesaleQty: '2,0',
        unit: 'Unid',
        cost: '1',
        percentage: '0',
        location: 'Matriz',
        wholesalePrice: '1',
        retailPrice: '1',
        taxType: 'IVA 10%',
        image: null
    });

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('products') || '[]');
        setProducts(saved);
    }, []);

    const fmt = (val) => new Intl.NumberFormat('es-PY').format(parseFloat(val) || 0);

    const handleSave = () => {
        if (!formData.description) {
            toast({ title: "Error", description: "La descripción es obligatoria", variant: "destructive" });
            return;
        }

        const newProducts = [...products];
        const dataToSave = { ...formData, id: formData.id || Date.now() };

        if (formData.id) {
            const idx = newProducts.findIndex(p => p.id === formData.id);
            newProducts[idx] = dataToSave;
        } else {
            newProducts.push(dataToSave);
        }

        localStorage.setItem('products', JSON.stringify(newProducts));
        setProducts(newProducts);
        setViewMode('list');
        resetForm();
        toast({ title: "Éxito", description: "Producto guardado correctamente" });
    };

    const resetForm = () => {
        setFormData({
            id: null, code: '', type: '', brand: '', description: '', color: '',
            stock: '0,0', minStock: '1,0', wholesaleQty: '2,0', unit: 'Unid',
            cost: '1', percentage: '0', location: 'Matriz', wholesalePrice: '1',
            retailPrice: '1', taxType: 'IVA 10%', image: null
        });
        setIsEditing(false);
    };

    const startEdit = (p) => {
        setFormData(p);
        setIsEditing(true);
        setViewMode('form');
    };

    const deleteProduct = (id) => {
        if (window.confirm('¿Eliminar este producto?')) {
            const filtered = products.filter(p => p.id !== id);
            localStorage.setItem('products', JSON.stringify(filtered));
            setProducts(filtered);
        }
    };

    // --- CSV LOGIC ---
    // --- EXCEL/CSV LOGIC ---
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // header: 1 devuelve un array de arrays
                const fullData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                if (fullData.length === 0) {
                    toast({ title: "Archivo vacío", description: "No se detectaron datos.", variant: "destructive" });
                    return;
                }

                // BUSCADOR DE CABECERAS: Busca la primera fila con al menos 2 celdas con texto
                let headerRowIndex = 0;
                for (let i = 0; i < Math.min(fullData.length, 10); i++) {
                    const row = fullData[i];
                    if (row && row.filter(cell => cell !== undefined && cell !== null && cell.toString().trim() !== "").length >= 2) {
                        headerRowIndex = i;
                        break;
                    }
                }

                const rawHeaders = fullData[headerRowIndex];
                const headers = rawHeaders.map(h => (h || '').toString().replace(/[\n\r\t]/g, ' ').trim());
                const dataRows = fullData.slice(headerRowIndex + 1);

                setCsvHeaders(headers);
                setCsvPreview(dataRows.slice(0, 5));
                setCsvFile(dataRows);

                const newMap = { ...mapping };
                headers.forEach(h => {
                    const lowH = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "").trim();

                    // Diccionario industrial optimizado
                    if (/^(name|nombre|producto|articulo|description|descripcion|item)$/i.test(lowH)) newMap.name = h;
                    if (/^(price|precio|p\.?venta|p\.?minorista|minorista|p1)$/i.test(lowH)) newMap.price = h;
                    if (/^(cost|costo|compra|p\.?compra|costo\.?unitario)$/i.test(lowH)) newMap.cost = h;
                    if (/^(sku|codigo|code|barcode|cod\.?barras|barra)$/i.test(lowH)) newMap.sku = h;
                    if (/^(quantity|cantidad|stock|existencia|qty|cant)$/i.test(lowH)) newMap.quantity = h;
                    if (/^(unit|unid|u\.?m|medida|unidad)$/i.test(lowH)) newMap.unit = h;
                    if (/^(productgroup|grupo|categoria|brand|marca)$/i.test(lowH)) newMap.productGroup = h;
                    if (lowH.includes('tax') || lowH === 'iva') newMap.tax = h;
                });
                setMapping(newMap);
            } catch (err) {
                console.error("Error leyendo Excel:", err);
                toast({ title: "Error", description: "No se pudo leer el archivo Excel.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const cleanNum = (val) => {
        if (val === undefined || val === null || val === "") return "0";
        if (typeof val === 'number') return val.toString(); // Respetar número nativo

        let str = val.toString().trim();
        str = str.replace(/[^\d,.-]/g, '');
        const lastComma = str.lastIndexOf(',');
        const lastDot = str.lastIndexOf('.');
        if (lastComma > lastDot) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else if (lastDot > lastComma) {
            // Inteligencia para miles vs decimales (ej 1.000 -> 1000)
            const parts = str.split('.');
            if (parts.length === 2 && parts[1].length === 3 && lastComma === -1) {
                str = str.replace(/\./g, '');
            } else {
                str = str.replace(/,/g, '');
            }
        } else if (lastComma !== -1) {
            str = str.replace(',', '.');
        }
        const num = parseFloat(str);
        return isNaN(num) ? "0" : num.toString();
    };

    const processImport = () => {
        const nameKey = mapping.name || mapping.description;
        if (!nameKey) {
            toast({ title: "Falta Mapeo", description: "Debes mapear la columna que contiene el Nombre o Descripción.", variant: "destructive" });
            return;
        }

        if (!csvFile || csvFile.length === 0) {
            toast({ title: "Sin datos", description: "No hay datos para importar.", variant: "destructive" });
            return;
        }

        toast({ title: "Procesando...", description: "Iniciando carga de productos." });

        const newProducts = [...products];
        let importedCount = 0;

        const cleanBool = (val) => {
            if (val === undefined || val === null || val === "") return "No";
            const low = val.toString().toLowerCase().trim();
            if (low === 'true' || low === 'yes' || low === 'si' || low === '1' || low === 'habilidado' || low === '✓' || low === 'activo' || low === 'habilitado') return "Sí";
            return "No";
        };

        csvFile.forEach(cells => {
            if (!cells || cells.length === 0) return;
            const rowData = {};
            csvHeaders.forEach((h, i) => rowData[h] = cells[i]);

            // RESOLUCIÓN DE NAME/DESCRIPTION (Crítico usuario)
            const productName = rowData[mapping.name] || rowData[mapping.description] || rowData['Name'] || rowData['Nombre'] || rowData['Description'] || rowData['Producto'];
            if (!productName || productName.toString().trim() === "") return;

            const item = {
                id: Date.now() + Math.random(),
                description: productName.toString().toUpperCase().trim(),
                brand: (rowData[mapping.productGroup] || rowData['ProductGroup'] || rowData['Grupo'] || '').toString().toUpperCase(),
                sku: (rowData[mapping.sku] || rowData['SKU'] || rowData['Codigo'] || '').toString(),
                code: (rowData[mapping.barcode] || rowData[mapping.sku] || rowData['Barcode'] || rowData['SKU'] || '').toString(),
                unit: (rowData[mapping.unit] || rowData['MeasurementUnit'] || rowData['Unidad'] || 'Unid').toString(),
                cost: cleanNum(rowData[mapping.cost] || rowData['Cost'] || rowData['Costo']),
                percentage: cleanNum(rowData[mapping.profit] || rowData['Markup'] || rowData['Ganancia']),
                retailPrice: cleanNum(rowData[mapping.price] || rowData['Price'] || rowData['Precio'] || rowData['Pventa']),
                wholesalePrice: cleanNum(rowData[mapping.price] || rowData['Price'] || rowData['Precio'] || rowData['Pventa']),
                taxType: (rowData[mapping.tax] || rowData['Tax'] || rowData['IVA'] || 'IVA 10%').toString().toUpperCase(),
                isTaxInclusive: cleanBool(rowData[mapping.priceIncludesTax] || rowData['IsTaxInclusivePrice']),
                allowPriceChange: cleanBool(rowData[mapping.allowPriceChange] || rowData['IsPriceChangeAllowed']),
                isService: cleanBool(rowData[mapping.isService] || rowData['IsService']),
                isEnabled: cleanBool(rowData[mapping.isEnabled] || rowData['IsEnabled']),
                stock: cleanNum(rowData[mapping.quantity] || rowData[mapping.stock] || rowData['Quantity'] || rowData['Cantidad']),
                supplier: (rowData[mapping.supplier] || rowData['Supplier'] || rowData['Proveedor'] || '').toString().toUpperCase(),
                minStock: cleanNum(rowData[mapping.reorderPoint] || rowData['ReorderPoint'] || '1'),
                preferredQty: cleanNum(rowData[mapping.preferredQty] || rowData['PreferredQuantity']),
                location: 'Matriz',
                type: cleanBool(rowData[mapping.isService] || rowData['IsService']) === 'Sí' ? 'SERVICIO' : 'ARTICULO'
            };

            const existingIdx = newProducts.findIndex(p =>
                (p.description === item.description) ||
                (item.code !== '' && p.code !== '' && p.code === item.code)
            );

            if (existingIdx > -1) {
                if (importOptions.mergeDuplicates) {
                    newProducts[existingIdx].stock = (parseFloat(newProducts[existingIdx].stock) + parseFloat(item.stock)).toString();
                } else if (!importOptions.ignoreDuplicates) {
                    newProducts[existingIdx] = { ...newProducts[existingIdx], ...item };
                }
            } else {
                newProducts.push(item);
            }
            importedCount++;
        });

        localStorage.setItem('products', JSON.stringify(newProducts));
        setProducts(newProducts);
        toast({ title: "Importación Exitosa", description: `Se cargaron ${importedCount} productos correctamente.` });
        setViewMode('list');
    };

    const exportToCSV = () => {
        if (products.length === 0) return;
        const headers = ["Código", "Descripción", "Stock", "Precio"];
        const rows = products.map(p => [p.code, p.description, p.stock, p.retailPrice].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "catalogo.csv");
        link.click();
    };

    const inputClass = "px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold italic focus:ring-1 focus:ring-green-500 bg-white shadow-sm transition-all";

    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-black text-center text-green-700 mb-8 uppercase tracking-widest">Lista de Productos</h1>

                    {/* Filter Section */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-center gap-6 mb-8 translate-y-0 hover:shadow-md transition-all">
                        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 min-w-[300px]">
                            <Search className="text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por código, descripción o marca..."
                                className="bg-transparent border-none text-xs p-1 outline-none w-full font-bold italic text-gray-700 placeholder:text-gray-300"
                            />
                            {searchTerm && (
                                <X
                                    size={16}
                                    className="text-gray-400 cursor-pointer hover:text-red-500 transition-colors"
                                    onClick={() => setSearchTerm('')}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setSearchTerm('')}
                                className="text-[10px] uppercase font-black text-gray-400 hover:text-green-600 flex items-center gap-2"
                            >
                                <RotateCcw size={14} /> Limpiar
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-3">
                            <Button onClick={() => { resetForm(); setViewMode('form'); }} className="bg-blue-600 font-black uppercase text-[10px]"><Plus size={14} className="mr-1" /> Nuevo</Button>
                            <Button onClick={() => setViewMode('import')} className="bg-emerald-600 font-black uppercase text-[10px]"><Upload size={14} className="mr-1" /> Importar CSV</Button>
                        </div>
                        <Button onClick={exportToCSV} variant="outline" className="border-gray-800 text-gray-800 font-black uppercase text-[10px]"><Download size={14} className="mr-1" /> Exportar</Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-center">
                                <thead className="bg-[#333a44] text-white text-[9px] uppercase font-black italic tracking-widest">
                                    <tr>
                                        <th className="px-4 py-5 font-black">N°</th>
                                        <th className="px-4 py-5 font-black">Código</th>
                                        <th className="px-4 py-5 text-left font-black">Descripción</th>
                                        <th className="px-4 py-5 font-black">Stock</th>
                                        <th className="px-4 py-5 font-black text-right">Precio</th>
                                        <th className="px-4 py-5 font-black">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[11px] font-black italic uppercase text-gray-700">
                                    {products.filter(p => {
                                        const search = searchTerm.toLowerCase();
                                        return (
                                            (p.description || '').toLowerCase().includes(search) ||
                                            (p.code || '').toLowerCase().includes(search) ||
                                            (p.brand || '').toLowerCase().includes(search)
                                        );
                                    }).map((p, i) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-4">{p.code}</td>
                                            <td className="px-4 py-4 text-left">{p.description}</td>
                                            <td className="px-4 py-4 text-blue-600">{p.stock}</td>
                                            <td className="px-4 py-4 text-right">{fmt(p.retailPrice)} Gs.</td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => startEdit(p)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={13} /></button>
                                                    <button onClick={() => deleteProduct(p.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'import') {
        return (
            <div className="min-h-screen bg-[#1a1c1e] text-gray-300 py-10 px-6 italic font-bold scrollbar-hide">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
                        <div onClick={() => setViewMode('list')} className="flex items-center gap-3 cursor-pointer group hover:text-white transition-all">
                            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="uppercase font-black text-sm tracking-widest">Volver</span>
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Importador Dinámico Pro</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* LEFT: MAPPING */}
                        <div className="lg:col-span-2 space-y-4 bg-[#25282c] p-10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[750px] scrollbar-thin scrollbar-thumb-gray-700 border border-gray-700/50">
                            <label className="flex items-center gap-5 bg-[#1a1c1e] border-2 border-dashed border-gray-700 p-8 rounded-3xl cursor-pointer hover:border-emerald-500 hover:bg-[#1a1c1e]/80 transition-all mb-10 w-full">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl"><FileSpreadsheet className="text-emerald-500" size={32} /></div>
                                <div className="text-left">
                                    <h3 className="text-white uppercase font-black text-sm italic">Subir Excel o CSV</h3>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Formatos soportados: .xlsx, .xls, .csv</p>
                                </div>
                                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileSelect} className="hidden" />
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 pt-5">
                                {[
                                    { label: 'Nombre *', key: 'name', req: true },
                                    { label: 'Grupo de productos', key: 'productGroup' },
                                    { label: 'SKU', key: 'sku' },
                                    { label: 'Código de barras', key: 'barcode' },
                                    { label: 'Unidad de medida', key: 'unit' },
                                    { label: 'Costo', key: 'cost' },
                                    { label: 'Ganancia', key: 'profit' },
                                    { label: 'Precio', key: 'price' },
                                    { label: 'Tax', key: 'tax' },
                                    { label: 'Precio incluye impuestos', key: 'priceIncludesTax' },
                                    { label: 'Cambio de precio permitido', key: 'allowPriceChange' },
                                    { label: 'Utilizando cantidad predeterminada', key: 'useDefaultQty' },
                                    { label: 'Servicio (no usa stock)', key: 'isService' },
                                    { label: 'Habilitado', key: 'isEnabled' },
                                    { label: 'Descripción', key: 'description' },
                                    { label: 'Cantidad / Stock', key: 'quantity' },
                                    { label: 'Proveedor', key: 'supplier' },
                                    { label: 'Punto de pedido', key: 'reorderPoint' },
                                    { label: 'Cantidad preferida', key: 'preferredQty' },
                                    { label: 'Advertencia de stock bajo', key: 'lowStockAlert' },
                                    { label: 'Cantidad de stock bajo', key: 'lowStockQty' }
                                ].map(f => (
                                    <div key={f.key} className="flex flex-col gap-1.5">
                                        <Label className={`text-[10px] uppercase font-black italic ${f.req ? 'text-emerald-400' : 'text-gray-500'}`}>{f.label}</Label>
                                        <select
                                            value={mapping[f.key]}
                                            onChange={e => setMapping({ ...mapping, [f.key]: e.target.value })}
                                            className="w-full bg-[#1a1c1e] border-none rounded-xl p-3 text-xs text-white focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner font-bold"
                                        >
                                            <option value="">(No mapeado)</option>
                                            {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* PREVIEW TABLE */}
                            {csvPreview.length > 0 && (
                                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h4 className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-4 flex items-center gap-2"><Table size={12} /> Vista Previa de Datos</h4>
                                    <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-black/20">
                                        <table className="w-full text-[9px] text-left">
                                            <thead className="bg-[#1a1c1e] text-gray-500 uppercase font-black">
                                                <tr>
                                                    {csvHeaders.slice(0, 6).map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
                                                    {csvHeaders.length > 6 && <th className="px-4 py-3">...</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800 text-gray-400 italic">
                                                {csvPreview.map((row, ri) => (
                                                    <tr key={ri} className="hover:bg-white/5">
                                                        {row.slice(0, 6).map((cell, ci) => <td key={ci} className="px-4 py-3 truncate max-w-[100px]">{cell}</td>)}
                                                        {row.length > 6 && <td className="px-4 py-3">...</td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: CONFIG & ACTIONS */}
                        <div className="space-y-10 lg:sticky lg:top-10">
                            <div className="bg-[#25282c] p-10 rounded-[40px] border border-gray-700/50 space-y-8 shadow-xl">
                                <section className="space-y-6">
                                    <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-800 pb-4 flex items-center gap-2"><Settings2 size={12} /> Configuración de Duplicados</h4>

                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div onClick={() => setImportOptions({ ...importOptions, ignoreDuplicates: !importOptions.ignoreDuplicates })} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${importOptions.ignoreDuplicates ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-800'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${importOptions.ignoreDuplicates ? 'left-7' : 'left-1'}`} />
                                        </div>
                                        <span className="text-[11px] uppercase tracking-tighter group-hover:text-white transition-colors">Ignorar duplicados</span>
                                    </label>

                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div onClick={() => setImportOptions({ ...importOptions, mergeDuplicates: !importOptions.mergeDuplicates })} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${importOptions.mergeDuplicates ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-800'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${importOptions.mergeDuplicates ? 'left-7' : 'left-1'}`} />
                                        </div>
                                        <span className="text-[11px] uppercase tracking-tighter group-hover:text-white transition-colors">Sumar stocks (Merge)</span>
                                    </label>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-gray-800 pb-4 flex items-center gap-2"><Table size={12} /> Origen del Documento</h4>
                                    <div className="space-y-4">
                                        {['Inventory count', 'Purchase'].map(opt => (
                                            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                                                <div onClick={() => setImportOptions({ ...importOptions, createFrom: opt })} className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${importOptions.createFrom === opt ? 'border-emerald-500' : 'border-gray-700 group-hover:border-gray-500'}`}>
                                                    {importOptions.createFrom === opt && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-tighter transition-all ${importOptions.createFrom === opt ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </section>

                                <div className="pt-10 flex flex-col gap-4 border-t border-gray-800">
                                    <button className="flex-1 flex items-center justify-center gap-3 bg-[#1a1c1e] hover:bg-black py-5 rounded-3xl text-xs uppercase font-black tracking-widest transition-all shadow-lg text-emerald-400 border border-emerald-500/20 active:scale-95">
                                        <Eye size={18} /> Preview
                                    </button>
                                    <button onClick={processImport} className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 py-5 rounded-3xl text-sm uppercase font-black tracking-widest transition-all shadow-[0_10px_40px_rgba(5,150,105,0.3)] text-white active:scale-95">
                                        <LogIn size={18} /> Iniciar Importación
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-start gap-4 italic font-bold">
                                <Info className="text-blue-500 shrink-0 mt-1" />
                                <p className="text-[10px] text-blue-200 leading-relaxed">
                                    Asegúrate de que los encabezados del CSV sean reconocibles. Los campos marcados con (*) son obligatorios para guardar. El proceso no se puede deshacer una vez iniciado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- FORM VIEW ---
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 italic font-bold">
            <div className="max-w-6xl mx-auto">
                <div onClick={() => setViewMode('list')} className="flex items-center gap-2 mb-6 cursor-pointer text-gray-400 hover:text-green-600 transition-all w-fit">
                    <ChevronLeft size={20} />
                    <span className="text-xs uppercase font-black tracking-widest">Volver al catálogo</span>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-[35px] shadow-2xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-blue-500" />

                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-green-700 uppercase tracking-tighter">Formulario de Productos</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        {/* Fila 1 */}
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Código</Label>
                            <input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className={inputClass + " w-full"} placeholder="Ej: 145635" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Tipo</Label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass + " w-full"}><option value="">---------</option><option value="Articulo">Artículo</option><option value="Servicio">Servicio</option></select>
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Marca</Label>
                            <select value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className={inputClass + " w-full"}><option value="">---------</option></select>
                        </div>

                        {/* Fila 2 */}
                        <div className="md:col-span-1">
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Descripción</Label>
                            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClass + " w-full"} placeholder="Ej: PRODUCTO X" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Color</Label>
                            <select value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className={inputClass + " w-full"}><option value="">---------</option></select>
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Stock</Label>
                            <input type="text" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} className={inputClass + " w-full"} placeholder="0,0" />
                        </div>

                        {/* Fila 3 */}
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Cantidad Mínima</Label>
                            <input type="text" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} className={inputClass + " w-full"} placeholder="1,0" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Cantidad Mayorista</Label>
                            <input type="text" value={formData.wholesaleQty} onChange={e => setFormData({ ...formData, wholesaleQty: e.target.value })} className={inputClass + " w-full"} placeholder="2,0" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Unidad de Medida</Label>
                            <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className={inputClass + " w-full"}><option value="">---------</option><option value="Unid">Unid</option><option value="Kg">Kg</option></select>
                        </div>

                        {/* Fila 4 */}
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Costo</Label>
                            <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} className={inputClass + " w-full font-black text-blue-700"} placeholder="1" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Porcentaje</Label>
                            <input type="number" value={formData.percentage} onChange={e => setFormData({ ...formData, percentage: e.target.value })} className={inputClass + " w-full"} placeholder="0" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Local</Label>
                            <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className={inputClass + " w-full"}><option value="Matriz">Matriz</option></select>
                        </div>

                        {/* Fila 5 */}
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Precio Mayorista</Label>
                            <input type="number" value={formData.wholesalePrice} onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })} className={inputClass + " w-full font-black text-green-700"} placeholder="1" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Precio Minorista</Label>
                            <input type="number" value={formData.retailPrice} onChange={e => setFormData({ ...formData, retailPrice: e.target.value })} className={inputClass + " w-full font-black text-blue-900"} placeholder="1" />
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-400 uppercase mb-1.5 block font-black">Tipo de IVA</Label>
                            <select value={formData.taxType} onChange={e => setFormData({ ...formData, taxType: e.target.value })} className={inputClass + " w-full"}><option value="IVA 10%">IVA 10%</option><option value="IVA 5%">IVA 5%</option><option value="Exento">Exento</option></select>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-50">
                        <Label className="text-[10px] text-gray-400 uppercase mb-4 block font-black">Seleccionar Imágenes:</Label>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-gray-300 italic text-[10px]">
                                <ImageIcon size={24} />
                                <span>no img</span>
                            </div>
                            <input type="file" className="text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                        </div>
                    </div>

                    <div className="mt-12 flex justify-center gap-6">
                        <button onClick={handleSave} className="bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                            <Save size={28} />
                        </button>
                        <button onClick={() => setViewMode('list')} className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
                            <X size={28} />
                        </button>
                    </div>
                </motion.div>

                <div className="mt-8 flex justify-center items-center gap-4 text-[11px] text-gray-400 font-black uppercase tracking-widest">
                    <Zap size={16} className="text-yellow-400 fill-yellow-400 animate-bounce" />
                    GESTIÓN DE PRODUCTOS AUTOMATIZADA - HORIZON 2026
                </div>
            </div>
        </div>
    );
}

export default ProductManagement;
