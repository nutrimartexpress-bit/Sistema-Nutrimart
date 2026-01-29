
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

function InvoiceItems({ items, setItems, errors, defaultUnitPrice }) {
  const { toast } = useToast();
  // Sincronizar precio unitario cuando cambia en el formulario
  useEffect(() => {
    if (defaultUnitPrice !== undefined && defaultUnitPrice !== '') {
      const price = parseFloat(defaultUnitPrice) || 0;
      if (items.length > 0) {
        setItems(items.map(item => ({ ...item, unitPrice: price })));
      }
    }
  }, [defaultUnitPrice]);

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      code: '',
      quantity: 1,
      um: 'Unid',
      description: '',
      unitPrice: parseFloat(defaultUnitPrice) || 0,
      discount: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    let updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );

    // Búsqueda automática de productos
    if (field === 'code' || field === 'description') {
      const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const found = savedProducts.find(p =>
        (field === 'code' && p.code === value && value !== '') ||
        (field === 'description' && p.description.toLowerCase() === value.toLowerCase())
      );

      if (found) {
        updatedItems = updatedItems.map(item =>
          item.id === id ? {
            ...item,
            code: found.code,
            description: found.description,
            unitPrice: found.retailPrice,
            um: found.unit || found.um
          } : item
        );
        toast({
          title: "Producto Encontrado",
          description: `${found.name} cargado con éxito.`,
        });
      }
    }

    setItems(updatedItems);
  };

  const calculateLineTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discountPercent = parseFloat(item.discount) || 0;

    const gross = qty * price;
    const discountAmount = gross * (discountPercent / 100);
    return gross - discountAmount;
  };

  // VAT Calculation per item: Math.floor(Total / 11)
  const calculateIVA = (item) => {
    const total = calculateLineTotal(item);
    return Math.floor(total / 11);
  };

  const inputClass = "w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm";

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Productos</h2>
        <Button
          onClick={addItem}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-[#2d3436] text-white text-[10px] font-black uppercase tracking-widest">
              <th className="py-4 px-4 text-left border-r border-white/10">Código</th>
              <th className="py-4 px-4 text-left border-r border-white/10">Cantidad</th>
              <th className="py-4 px-4 text-left border-r border-white/10">UM</th>
              <th className="py-4 px-4 text-left border-r border-white/10">Descripción</th>
              <th className="py-4 px-4 text-right border-r border-white/10">Pr. Unitario</th>
              <th className="py-4 px-4 text-center border-r border-white/10">Desc.(%)</th>
              <th className="py-4 px-4 text-right border-r border-white/10">Total</th>
              <th className="py-4 px-4 text-right border-r border-white/10">IVA</th>
              <th className="py-4 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, opacity: 0 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.code || ''}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      className={inputClass}
                      placeholder="001"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.um || 'Unid'}
                      onChange={(e) => updateItem(item.id, 'um', e.target.value)}
                      className={inputClass}
                    >
                      <option value="Unid">Unid</option>
                      <option value="Kg">Kg</option>
                      <option value="Mts">Mts</option>
                      <option value="Lts">Lts</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className={inputClass}
                      placeholder="Nombre del producto"
                    />
                    {errors[`item${index}Description`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item${index}Description`]}</p>
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                      className={`${inputClass} text-right`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                      className={`${inputClass} text-center`}
                    />
                  </td>
                  <td className="p-2 text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('es-PY').format(calculateLineTotal(item))}
                  </td>
                  <td className="p-2 text-right text-gray-400 text-sm italic">
                    {new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(calculateIVA(item))}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-500">
                  No hay productos en la lista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InvoiceItems;
