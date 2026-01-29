
import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Search, Barcode, ChevronDown } from 'lucide-react';

function QuickProductEntry({ onAddProduct }) {
    const [barcode, setBarcode] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const barcodeRef = useRef(null);

    // SCALE CONFIG (Based on user photo)
    const SCALE_PREFIX = '20';
    const SCALE_CODE_LENGTH = 4;
    const SCALE_DECIMALS = 3;

    useEffect(() => {
        if (searchTerm.length > 1) {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const filtered = products.filter(p =>
                p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.code.includes(searchTerm)
            ).slice(0, 10);
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchTerm]);

    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!barcode) return;

        const products = JSON.parse(localStorage.getItem('products') || '[]');
        let searchCode = barcode;
        let weight = 1;

        // EAN-13 SCALE PARSING
        if (barcode.length === 13 && barcode.startsWith(SCALE_PREFIX)) {
            // Extract code (4 digits after prefix)
            const codePart = barcode.substring(SCALE_PREFIX.length, SCALE_PREFIX.length + SCALE_CODE_LENGTH);
            // Trim zeros if enabled (logic implies numeric code match)
            searchCode = parseInt(codePart, 10).toString();

            // Extract weight (6 digits following)
            const weightPart = barcode.substring(SCALE_PREFIX.length + SCALE_CODE_LENGTH, 12);
            weight = parseFloat(weightPart) / Math.pow(10, SCALE_DECIMALS);
        }

        const found = products.find(p => p.code === searchCode);
        if (found) {
            onAddProduct({ ...found, quantity: weight });
            setBarcode('');
        } else {
            // Check if full barcode matches standard item
            const foundStandard = products.find(p => p.code === barcode);
            if (foundStandard) {
                onAddProduct({ ...foundStandard, quantity: 1 });
                setBarcode('');
            }
        }
    };

    const selectProduct = (p) => {
        onAddProduct({ ...p, quantity: 1 });
        setSearchTerm('');
        setShowSuggestions(false);
    };

    return (
        <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-gray-200 mb-6 flex flex-wrap items-end gap-6 shadow-sm">
            <div className="flex-1 min-w-[200px]">
                <Label className="text-[10px] uppercase font-black text-gray-400 mb-2 flex items-center gap-1.5">
                    <Barcode size={12} className="text-blue-500" /> Código de Barra
                </Label>
                <form onSubmit={handleBarcodeSubmit}>
                    <input
                        ref={barcodeRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="Escanee o escriba código..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                        autoFocus
                    />
                </form>
            </div>

            <div className="flex-[2] min-w-[300px] relative">
                <Label className="text-[10px] uppercase font-black text-gray-400 mb-2 flex items-center gap-1.5">
                    <Search size={12} className="text-green-500" /> Buscar Productos
                </Label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => searchTerm.length > 1 && setShowSuggestions(true)}
                        placeholder="Escriba nombre o código del producto..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold pr-10"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {suggestions.map(p => (
                            <div
                                key={p.id}
                                onClick={() => selectProduct(p)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                            >
                                <div>
                                    <div className="text-sm font-black uppercase text-gray-800">{p.description}</div>
                                    <div className="text-[10px] text-gray-400 font-bold italic">{p.code} - {p.unit}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-green-600">Gs. {new Intl.NumberFormat('es-PY').format(p.retailPrice)}</div>
                                    <div className="text-[9px] text-gray-400 uppercase">Stock: {p.stock}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showSuggestions && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSuggestions(false)}
                />
            )}
        </div>
    );
}

export default QuickProductEntry;
