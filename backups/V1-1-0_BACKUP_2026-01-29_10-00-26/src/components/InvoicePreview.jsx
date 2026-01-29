
import React from 'react';

// A4 Width in pixels at 72dpi is approx 595px.
// Screen pixels are roughly equivalent for preview purposes.

function InvoicePreview({ formData, items, taxRate, discount, layout }) {
  // Use layout or fallback if not provided
  const config = layout || {};

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const itemDisc = parseFloat(item.discount) || 0;
      const lineTotal = (qty * price) * (1 - itemDisc / 100);
      subtotal += lineTotal;
    });
    const globalDiscountAmount = subtotal * ((parseFloat(discount) || 0) / 100);
    const finalTotal = subtotal - globalDiscountAmount;
    const ivaAmount = Math.floor(finalTotal / 11);

    return { subtotal, total: finalTotal, iva: ivaAmount };
  };

  const totals = calculateTotals();

  const fmt = (n) => new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0 }).format(n);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Helper to get style safely
  const getStyle = (key) => {
    const pos = config[key] || { x: 0, y: 0, fontSize: 10, isVisible: true };

    // Ensure both x and y are present and NOT 0
    if (pos.isVisible === false || !pos.x || !pos.y || pos.x === 0 || pos.y === 0) {
      return { display: 'none' };
    }

    return {
      position: 'absolute',
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      fontSize: `${pos.fontSize || 9}px`,
      fontWeight: pos.fontWeight || 'normal',
      fontStyle: pos.fontStyle || 'normal',
      textDecoration: pos.textDecoration || 'none',
      color: pos.color || '#000000',
      textAlign: pos.textAlign || 'left',
      transform: 'translateY(-50%)', // Center vertically on the point
      whiteSpace: 'nowrap',
      // Special handling for width-constrained elements to support text-align
      width: ['invoiceNumber', 'subtotal', 'vat', 'vat_2', 'total'].includes(key) ? '120px' :
        ['amountText', 'clientName'].includes(key) ? '300px' : 'auto',
      // Adjust transform for alignment if width is fixed
      transformOrigin: 'top left',
      // If aligned right and width set, we shift left to anchor on the point correctly? 
      // Actually, let's keep it simple: The Point (x,y) is top-left of the box usually.
      // Actually, let's keep it simple: The Point (x,y) is top-left of the bounding box.
      // To make X represent the "Right Edge" for right-aligned items would require logic change.
      // Standard approach: X/Y is Top-Left of the bounding box.
    };
  };

  const isVisible = (key) => {
    const pos = config[key] || {};
    return pos.isVisible !== false && pos.x > 0 && pos.y > 0;
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Vista Previa (Diseño)</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          IVA: {totals.iva} Gs.
        </span>
      </div>

      <div className="flex justify-center bg-gray-100 p-6 overflow-hidden rounded-md border border-gray-200">
        <div
          className="bg-white shadow-xl relative"
          style={{
            width: '595px',
            height: '420px',
            fontFamily: 'Helvetica, Arial, sans-serif'
          }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}>
          </div>

          {isVisible('date') && <div style={getStyle('date')}>{formatDate(formData.invoiceDate)}</div>}
          {isVisible('xMark') && <div style={getStyle('xMark')}>X</div>}
          {isVisible('invoiceNumber') && <div style={getStyle('invoiceNumber')}>{formData.invoiceNumber}</div>}
          {isVisible('clientName') && <div style={getStyle('clientName')}>{formData.clientName}</div>}
          {isVisible('ruc') && <div style={getStyle('ruc')}>{formData.ruc}</div>}

          {/* Table needs special handling as it's multiple lines */}
          {isVisible('table') && (
            <div style={{
              position: 'absolute',
              left: `${config.table?.x || 40}px`,
              top: `${config.table?.y || 130}px`,
              width: '500px',
              fontSize: `${config.table?.fontSize || 9}px`,
              color: config.table?.color || '#000',
            }}>
              {items.slice(0, 8).map((item, i) => (
                <div key={i} className="flex mb-1 border-b border-gray-100 pb-1">
                  <span className="w-[15%]">{item.code || '-'}</span>
                  <span className="w-[60%] truncate">{item.description}</span>
                  <span className="w-[25%] text-right">{fmt(item.unitPrice)}</span>
                </div>
              ))}
              {items.length > 8 && (
                <div className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 p-1 rounded border border-blue-100 animate-pulse">
                  ⚠️ Límite de hoja excedido. Se generarán {Math.ceil(items.length / 8)} páginas en el PDF.
                </div>
              )}
            </div>
          )}

          {isVisible('subtotal') && <div style={getStyle('subtotal')}>{fmt(totals.subtotal)}</div>}
          {isVisible('vat') && <div style={getStyle('vat')}>{fmt(totals.iva)}</div>}
          {isVisible('vat_2') && <div style={getStyle('vat_2')}>{fmt(totals.iva)}</div>}
          {isVisible('total') && <div style={getStyle('total')}>{fmt(totals.total)}</div>}
          {isVisible('amountText') && <div style={getStyle('amountText')}>*** {fmt(totals.total)} GUARANIES ***</div>}

        </div>
      </div>
    </div>
  );
}

export default InvoicePreview;
