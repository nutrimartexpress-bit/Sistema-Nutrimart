
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#333a44',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1d4ed8', // blue-700
        textTransform: 'uppercase',
    },
    infoSection: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoBlock: {
        width: '45%',
    },
    label: {
        fontSize: 8,
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    table: {
        display: 'table',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 0,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#333a44',
        color: '#ffffff',
        padding: 5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        padding: 5,
    },
    colCode: { width: '15%' },
    colDesc: { width: '40%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    totalsSection: {
        marginTop: 20,
        borderTop: 2,
        borderTopColor: '#eee',
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    totalLabel: {
        marginRight: 10,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1d4ed8',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
        borderTop: 0.5,
        borderTopColor: '#eee',
        paddingTop: 10,
    }
});

const PurchasePDF = ({ purchaseData }) => {
    const isReturn = purchaseData.type === 'Devolución';
    const fmt = (val) => new Intl.NumberFormat('es-PY').format(val || 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{isReturn ? 'Nota de Devolución' : 'Comprobante de Compra'}</Text>
                        <Text style={{ fontSize: 8, color: '#666' }}>Sistema Horizon 2026 - Control de Inventario</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={styles.value}>ID: {purchaseData.id}</Text>
                        <Text style={styles.value}>Fecha: {purchaseData.date}</Text>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Proveedor:</Text>
                        <Text style={styles.value}>{purchaseData.supplier}</Text>
                        <Text style={styles.label}>N° Factura Ref:</Text>
                        <Text style={styles.value}>{purchaseData.invoiceNum || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Estado:</Text>
                        <Text style={[styles.value, { color: isReturn ? '#dc2626' : '#16a34a' }]}>
                            {purchaseData.type === 'Devolución' ? 'DEVOLUCIÓN PROCESADA' : 'COMPRA RECIBIDA'}
                        </Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colCode}>Código</Text>
                        <Text style={styles.colDesc}>Descripción</Text>
                        <Text style={styles.colQty}>Cant.</Text>
                        <Text style={styles.colPrice}>Costo Uni.</Text>
                        <Text style={styles.colTotal}>Subtotal</Text>
                    </View>

                    {purchaseData.detailedItems?.map((item, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.colCode}>{item.code}</Text>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colQty}>{item.purchaseQty}</Text>
                            <Text style={styles.colPrice}>{fmt(item.newCost)}</Text>
                            <Text style={styles.colTotal}>{fmt(parseFloat(item.newCost) * parseFloat(item.purchaseQty))}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total General:</Text>
                        <Text style={styles.totalValue}>{fmt(purchaseData.total)} Gs.</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Documento generado por el Agente de Control de Versiones v1.1.0</Text>
                    <Text>Este documento sirve como respaldo interno de movimientos de stock.</Text>
                </View>
            </Page>
        </Document>
    );
};

export default PurchasePDF;
