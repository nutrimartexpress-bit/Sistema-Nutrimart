
import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, GripVertical, RotateCcw, Save } from 'lucide-react';

const SECTIONS = [
  { id: 'header', label: 'Encabezado (Fecha, Nro)' },
  { id: 'client', label: 'Datos del Cliente' },
  { id: 'table', label: 'Tabla de Productos' },
  { id: 'totals', label: 'Totales y Subtotales' },
  { id: 'amountText', label: 'Monto en Letras' }
];

const InvoiceEditor = ({ isOpen, onClose, currentLayout, onSave }) => {
  const [items, setItems] = useState(SECTIONS);

  useEffect(() => {
    if (currentLayout && currentLayout.length > 0) {
      const orderedItems = currentLayout
        .map(id => SECTIONS.find(s => s.id === id))
        .filter(Boolean);
        
      // Add any missing items (in case structure changed)
      const missing = SECTIONS.filter(s => !currentLayout.includes(s.id));
      setItems([...orderedItems, ...missing]);
    } else {
      setItems(SECTIONS);
    }
  }, [currentLayout, isOpen]);

  const handleReset = () => {
    setItems(SECTIONS);
  };

  const handleSave = () => {
    const layoutIds = items.map(item => item.id);
    onSave(layoutIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Editor de Diseño</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
            <p className="text-sm text-gray-500 mb-4">
              Arrastra y suelta los elementos para reordenar las secciones de la factura.
            </p>

            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
              {items.map((item) => (
                <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.label}</h3>
                    </div>
                    {/* Visual preview placeholder */}
                    <div className="w-12 h-8 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                       <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
            <Button variant="outline" onClick={handleReset} className="text-gray-600">
              <RotateCcw className="mr-2 h-4 w-4" />
              Restablecer
            </Button>
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Diseño
                </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InvoiceEditor;
