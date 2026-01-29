
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

function convertNumberToText(num) {
  if (Math.floor(num) === 0) return "CERO";
  const units = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const tens = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const teens = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];

  function convertGroup(n) {
    let output = "";
    if (n === 100) return "CIEN";
    if (n >= 100) {
      const h = Math.floor(n / 100);
      const remainder = n % 100;
      if (h === 1) output += "CIENTO ";
      else if (h === 5) output += "QUINIENTOS ";
      else if (h === 7) output += "SETECIENTOS ";
      else if (h === 9) output += "NOVECIENTOS ";
      else output += units[h] + "CIENTOS ";
      n = remainder;
    }
    if (n >= 20) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (n === 20) output += "VEINTE";
      else if (n < 30) output += "VEINTI" + units[u];
      else {
        output += tens[t];
        if (u > 0) output += " Y " + units[u];
      }
    } else if (n >= 10) {
      output += teens[n - 10];
    } else if (n > 0) {
      output += units[n];
    }
    return output;
  }

  let result = "";
  num = Math.floor(num);
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    if (millions === 1) result += "UN MILLON ";
    else result += convertGroup(millions) + " MILLONES ";
    num %= 1000000;
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) result += "MIL ";
    else result += convertGroup(thousands) + " MIL ";
    num %= 1000;
  }
  if (num > 0) {
    result += convertGroup(num);
  }
  return result.trim();
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 8,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    marginBottom: 2,
  },
  // PARAGUAYAN STANDARD 6 COLUMNS
  colQty: { width: '10%', textAlign: 'left' },
  colDesc: { width: '40%', textAlign: 'left' },
  colPrice: { width: '15%', textAlign: 'right', paddingRight: 5 },
  colEx: { width: '11%', textAlign: 'right', paddingRight: 2 },
  col5: { width: '11%', textAlign: 'right', paddingRight: 2 },
  col10: { width: '13%', textAlign: 'right', paddingRight: 5 },
});

const InvoiceInstance = ({ formData, items, totals, layout, offset }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}-${m}-${y}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatQuantity = (qty) => {
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(qty);
  };

  // Helper to extract style props for PDF
  const getStyle = (key, defaultWidth = 100) => {
    const pos = layout[key] || {};
    // Ensure both x and y are present and NOT 0
    if (pos.isVisible === false || !pos.x || !pos.y || pos.x === 0 || pos.y === 0) {
      return { display: 'none' };
    }

    return {
      position: 'absolute',
      left: pos.x || 0,
      top: (pos.y || 0) + offset,
      fontSize: pos.fontSize || 9,
      fontWeight: pos.fontWeight === 'bold' ? 'bold' : 'normal',
      fontStyle: pos.fontStyle === 'italic' ? 'italic' : 'normal',
      textDecoration: pos.textDecoration === 'underline' ? 'underline' : 'none',
      color: pos.color || '#000000',
      textAlign: pos.textAlign || 'left',
      width: defaultWidth,
    };
  };
  const isVisible = (key) => {
    const pos = layout[key] || {};
    return pos.isVisible !== false && pos.x > 0 && pos.y > 0;
  };

  return (
    <>
      {isVisible('date') && (
        <View style={getStyle('date', 100)}>
          <Text>{formatDate(formData.invoiceDate)}</Text>
        </View>
      )}

      {isVisible('xMark') && (
        <View style={getStyle('xMark', 30)}>
          <Text>X</Text>
        </View>
      )}

      {isVisible('invoiceNumber') && (
        <View style={getStyle('invoiceNumber', 150)}>
          <Text>{formData.invoiceNumber || '001'}</Text>
        </View>
      )}

      {isVisible('clientName') && (
        <View style={getStyle('clientName', 300)}>
          <Text>{formData.clientName || 'CONSUMIDOR FINAL'}</Text>
        </View>
      )}

      {isVisible('ruc') && (
        <View style={getStyle('ruc', 150)}>
          <Text>{formData.ruc || '0'}</Text>
        </View>
      )}

      {/* 6-COLUMN TABLE */}
      {isVisible('table') && (
        <View style={{
          position: 'absolute',
          left: layout.table?.x || 40,
          top: (layout.table?.y || 130) + offset,
          width: 520,
          fontSize: layout.table?.fontSize || 9,
          color: layout.table?.color || '#000'
        }}>
          {items.map((item, index) => {
            const price = parseFloat(item.unitPrice) || 0;
            const qty = parseFloat(item.quantity) || 0;
            const lineTotal = qty * price;

            // Logic for tax columns placement
            const isExenta = (item.taxType || '').toLowerCase().includes('exenta');
            const is5 = (item.taxType || '').includes('5%');
            const is10 = !isExenta && !is5; // Default 10%

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colQty}>{formatQuantity(qty)}</Text>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colPrice}>{formatCurrency(price)}</Text>

                <Text style={styles.colEx}>{isExenta ? formatCurrency(lineTotal) : '0'}</Text>
                <Text style={styles.col5}>{is5 ? formatCurrency(lineTotal) : '0'}</Text>
                <Text style={styles.col10}>{is10 ? formatCurrency(lineTotal) : '0'}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Totals Section */}
      {isVisible('subtotal') && (
        <View style={getStyle('subtotal', 100)}>
          <Text>{formatCurrency(totals.subtotal)}</Text>
        </View>
      )}

      {isVisible('vat') && (
        <View style={getStyle('vat', 100)}>
          <Text>{formatCurrency(totals.iva)}</Text>
        </View>
      )}

      {isVisible('vat_2') && (
        <View style={getStyle('vat_2', 100)}>
          <Text>{formatCurrency(totals.iva)}</Text>
        </View>
      )}

      {isVisible('total') && (
        <View style={getStyle('total', 100)}>
          <Text>{formatCurrency(totals.total)}</Text>
        </View>
      )}

      {isVisible('amountText') && (
        <View style={getStyle('amountText', 400)}>
          <Text>{convertNumberToText(totals.total)}</Text>
        </View>
      )}
    </>
  );
};

function InvoicePDF({ formData, items, discount, layout }) {

  const calculateTotals = () => {
    let grossTotal = 0;
    let itemDiscounts = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const itemDiscPercent = parseFloat(item.discount) || 0;

      const lineGross = qty * price;
      grossTotal += lineGross;
      itemDiscounts += lineGross * (itemDiscPercent / 100);
    });

    const subtotalAfterItemDiscounts = grossTotal - itemDiscounts;
    const globalDiscountAmount = subtotalAfterItemDiscounts * ((parseFloat(discount) || 0) / 100);
    const finalTotal = subtotalAfterItemDiscounts - globalDiscountAmount;
    const ivaAmount = Math.floor(finalTotal / 11);

    return {
      subtotal: grossTotal,
      itemDiscounts: itemDiscounts,
      globalDiscount: globalDiscountAmount,
      iva: ivaAmount,
      total: finalTotal
    };
  };

  const totals = calculateTotals();
  const PAGE_HEIGHT = 842;
  const HALF_HEIGHT = PAGE_HEIGHT / 2;
  const safeLayout = layout || {};

  // Pagination Logic: Max 8 items per page
  const ITEMS_PER_PAGE = 8;
  const chunks = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  // If no items, show at least one blank page
  if (chunks.length === 0) chunks.push([]);

  return (
    <Document>
      {chunks.map((chunkItems, index) => (
        <Page key={index} size="A4" style={styles.page}>
          <InvoiceInstance
            formData={formData}
            items={chunkItems}
            totals={totals}
            layout={safeLayout}
            offset={0}
          />

          {/* Mid-page Divider (Dashed) */}
          <View style={{
            position: 'absolute',
            top: HALF_HEIGHT,
            left: 20,
            right: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#000',
            borderStyle: 'dashed',
            opacity: 0.3,
            width: '94%'
          }} />

          <InvoiceInstance
            formData={formData}
            items={chunkItems}
            totals={totals}
            layout={safeLayout}
            offset={HALF_HEIGHT + 20}
          />
        </Page>
      ))}
    </Document>
  );
}

export default InvoicePDF;
