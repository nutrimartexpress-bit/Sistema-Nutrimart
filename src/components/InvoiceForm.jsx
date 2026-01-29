
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Eye, LayoutTemplate, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRUCLookup } from '@/hooks/useRUCLookup';
import { Loader2 } from 'lucide-react';

function InvoiceForm({ formData, setFormData, errors, onGenerateTicket, onGenerateInvoice, onGenerateSale, onPreview, onEditLayout }) {
  const { searchRUC, loading } = useRUCLookup();
  const [rucStatus, setRucStatus] = useState('idle'); // idle, found, not_found

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset status if RUC changes manually
    if (field === 'ruc') {
        setRucStatus('idle');
    }
  };

  const handleRucKeyDown = async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const ruc = formData.ruc;
        if (!ruc) return;

        const name = await searchRUC(ruc);
        if (name) {
            setFormData(prev => ({ ...prev, clientName: name }));
            setRucStatus('found');
        } else {
            setRucStatus('not_found');
             document.getElementById('clientName')?.focus();
        }
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 transition-all duration-200";
  const labelClass = "block font-semibold text-sm text-gray-700 mb-1";
  
  // Placeholder options for selects
  const sellers = ["Vendedor 1", "Vendedor 2", "Vendedor 3", "LuccaGS"];
  const paymentMethods = ["Efectivo", "Tarjeta de Crédito", "Tarjeta de Débito", "Transferencia", "QR"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: Client Data */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="ruc" className={labelClass}>RUC (Presione Enter para buscar):</Label>
            <div className="relative">
                <input
                id="ruc"
                type="text"
                value={formData.ruc || ''}
                onChange={(e) => handleChange('ruc', e.target.value)}
                onKeyDown={handleRucKeyDown}
                className={`${inputClass} pr-10`}
                placeholder="0"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : rucStatus === 'found' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : rucStatus === 'not_found' ? (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
            </div>
            {rucStatus === 'not_found' && (
                <p className="text-xs text-orange-600 mt-1">No encontrado. Ingrese datos manualmente (se guardará al generar).</p>
            )}
             {rucStatus === 'found' && (
                <p className="text-xs text-green-600 mt-1">Cliente encontrado en base de datos.</p>
            )}
          </div>
          <div>
            <Label htmlFor="clientName" className={labelClass}>Razón Social:</Label>
            <input
              id="clientName"
              type="text"
              value={formData.clientName || ''}
              onChange={(e) => handleChange('clientName', e.target.value)}
              className={`${inputClass} ${rucStatus === 'found' ? 'bg-gray-100 text-gray-600' : ''}`}
              placeholder="SIN NOMBRE"
              readOnly={rucStatus === 'found'}
            />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
          </div>
          <div>
            <Label htmlFor="unitPrice" className={labelClass}>Precio Unitario:</Label>
            <input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice || ''}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="clientPhone" className={labelClass}>Tel.:</Label>
            <input
              id="clientPhone"
              type="tel"
              value={formData.clientPhone || ''}
              onChange={(e) => handleChange('clientPhone', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="clientAddress" className={labelClass}>Dirección:</Label>
            <input
              id="clientAddress"
              type="text"
              value={formData.clientAddress || ''}
              onChange={(e) => handleChange('clientAddress', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* COLUMN 2: Sale Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="invoiceDate" className={labelClass}>Fecha:</Label>
            <input
              id="invoiceDate"
              type="date"
              value={formData.invoiceDate || ''}
              onChange={(e) => handleChange('invoiceDate', e.target.value)}
              className={inputClass}
            />
             {errors.invoiceDate && <p className="text-xs text-red-500 mt-1">{errors.invoiceDate}</p>}
          </div>
          
          <div>
            <Label className={labelClass}>Cond. Venta:</Label>
            <div className="flex space-x-4 mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-4 w-4"
                  name="saleCondition"
                  value="Contado"
                  checked={formData.saleCondition === 'Contado'}
                  onChange={(e) => handleChange('saleCondition', e.target.value)}
                />
                <span className="ml-2 text-gray-700">Contado</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 h-4 w-4"
                  name="saleCondition"
                  value="Crédito"
                  checked={formData.saleCondition === 'Crédito'}
                  onChange={(e) => handleChange('saleCondition', e.target.value)}
                />
                <span className="ml-2 text-gray-700">Crédito</span>
              </label>
            </div>
          </div>

          <div>
             <Label htmlFor="vatRate" className={labelClass}>IVA (% Referencia):</Label>
             <input
               id="vatRate"
               type="number"
               min="0"
               max="100"
               value={formData.vatRate || 10}
               onChange={(e) => handleChange('vatRate', e.target.value)}
               className={inputClass}
               placeholder="10"
             />
             <p className="text-xs text-gray-500 mt-1">
                 Referencial. Cálculo usado: Total ÷ 11
             </p>
          </div>

          <div>
            <Label htmlFor="seller" className={labelClass}>Vendedor/a:</Label>
            <select
              id="seller"
              value={formData.seller || ''}
              onChange={(e) => handleChange('seller', e.target.value)}
              className={inputClass}
            >
              <option value="">Seleccionar...</option>
              {sellers.map((seller, idx) => (
                <option key={idx} value={seller}>{seller}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="deliveryCost" className={labelClass}>Delivery:</Label>
            <input
              id="deliveryCost"
              type="number"
              value={formData.deliveryCost || ''}
              onChange={(e) => handleChange('deliveryCost', e.target.value)}
              className={`${inputClass} bg-gray-100`}
              placeholder="0"
            />
          </div>
        </div>

        {/* COLUMN 3: Payment & Actions */}
        <div className="space-y-4 flex flex-col h-full">
          <div>
            <Label htmlFor="notes" className={labelClass}>Observaciones:</Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className={inputClass}
              rows="3"
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod" className={labelClass}>Método Pago:</Label>
            <select
              id="paymentMethod"
              value={formData.paymentMethod || ''}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              className={inputClass}
            >
              <option value="Efectivo">Efectivo</option>
              {paymentMethods.map((method, idx) => (
                <option key={idx} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="paymentMethod2" className={labelClass}>Método Pago 2:</Label>
            <select
              id="paymentMethod2"
              value={formData.paymentMethod2 || ''}
              onChange={(e) => handleChange('paymentMethod2', e.target.value)}
              className={inputClass}
            >
              <option value="">---------</option>
              {paymentMethods.map((method, idx) => (
                <option key={idx} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-3 pt-4">
            <Button 
              onClick={onGenerateTicket}
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
            >
              Generar Ticket
            </Button>
            
            <Button 
              onClick={onGenerateInvoice}
              className="w-full py-6 text-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-sm transition-colors"
            >
              Generar Factura
            </Button>
            
            <Button 
              onClick={onGenerateSale}
              className="w-full py-6 text-lg bg-purple-500 hover:bg-purple-600 text-white font-medium shadow-sm transition-colors"
            >
              Generar Solo Venta
            </Button>

            <div className="grid grid-cols-2 gap-3">
                 <Button 
                  onClick={onPreview}
                  variant="outline"
                  className="py-6 text-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Previa
                </Button>
                
                 <Button 
                  onClick={onEditLayout}
                  variant="outline"
                  className="py-6 text-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutTemplate className="w-5 h-5" />
                  Editar Diseño
                </Button>
            </div>
           
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default InvoiceForm;
