
import React from 'react';
import { motion } from 'framer-motion';

function InvoiceSummary({ items, discount, vatRate = 10, cashReceived, setCashReceived }) {

  const calculateTotals = () => {
    let subtotal = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const itemDisc = parseFloat(item.discount) || 0;
      const lineTotal = (qty * price) * (1 - itemDisc / 100);
      subtotal += lineTotal;
    });

    const globalDiscountPercent = parseFloat(discount) || 0;
    const globalDiscountAmount = subtotal * (globalDiscountPercent / 100);
    const finalTotal = subtotal - globalDiscountAmount;
    const ivaAmount = Math.floor(finalTotal / 11);

    const cash = parseFloat(cashReceived) || 0;
    const change = Math.max(0, cash - finalTotal);

    return {
      subtotal: subtotal,
      globalDiscount: globalDiscountAmount,
      iva: ivaAmount,
      total: finalTotal,
      change: change
    };
  };

  const totals = calculateTotals();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-xl bg-black rounded-[25px] overflow-hidden shadow-2xl border border-gray-800"
    >
      <div className="bg-black py-4 px-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-white italic">Resumen de Venta:</h2>
      </div>

      <div className="space-y-0.5">
        {/* TOTAL FLOW */}
        <div className="bg-[#27ae60] p-6 flex justify-between items-center border-b border-black/10">
          <span className="text-white text-xs font-black uppercase tracking-tighter">Monto Total de Venta:</span>
          <span className="text-white text-3xl font-black">
            Gs. {new Intl.NumberFormat('es-PY').format(totals.total)}
          </span>
        </div>

        {/* CASH INPUT */}
        <div className="bg-[#27ae60] p-6 flex justify-between items-center border-b border-black/10">
          <span className="text-white text-xs font-black uppercase tracking-tighter">Monto Efectivo:</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-3xl font-black">Gs.</span>
            <input
              type="text"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value.replace(/[^\d]/g, ''))}
              className="bg-transparent border-none text-white text-3xl font-black focus:ring-0 w-48 text-right placeholder:text-white/30"
              placeholder="0"
            />
          </div>
        </div>

        {/* CHANGE DISPLAY */}
        <div className="bg-[#27ae60] p-6 flex justify-between items-center group">
          <span className="text-white text-xs font-black uppercase tracking-tighter">Vuelto:</span>
          <span className={`text-white text-3xl font-black transition-all ${totals.change > 0 ? 'scale-110' : ''}`}>
            Gs. {new Intl.NumberFormat('es-PY').format(totals.change)}
          </span>
        </div>
      </div>

      <div className="bg-[#1a1c1e] p-4 flex justify-between items-center px-8 border-t border-gray-800">
        <span className="text-gray-500 text-[9px] uppercase font-bold italic tracking-widest">Liquidación IVA Incluida (Total/11)</span>
        <span className="text-gray-400 text-[10px] font-black italic">Gs. {new Intl.NumberFormat('es-PY').format(totals.iva)}</span>
      </div>
    </motion.div>
  );
}

export default InvoiceSummary;
