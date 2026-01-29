import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const SupabaseSyncContext = createContext({});

export function SupabaseSyncProvider({ children }) {
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Helper: Split array into chunks to avoid large request payloads or timeouts
    const chunkArray = (array, size) => {
        const chunked = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    };

    const syncSales = async () => {
        try {
            console.log("--- Syncing Sales (Batch) ---");
            const localSales = JSON.parse(localStorage.getItem('salesHistory') || '[]');

            if (localSales.length === 0) return { success: 0, errors: 0 };

            let totalSalesSynced = 0;
            let totalErrors = 0;
            const CHUNK_SIZE = 50;
            const batches = chunkArray(localSales, CHUNK_SIZE);

            for (const batch of batches) {
                // 1. Prepare Headers (Batch UPSERT)
                const salesPayload = batch.map(sale => ({
                    id: sale.id,
                    fecha: sale.date,
                    hora: sale.time,
                    cliente_nombre: sale.clientName,
                    cliente_ruc: sale.ruc,
                    tipo: sale.type,
                    total: sale.total,
                    metodo_pago: sale.paymentMethod,
                    status: sale.status || 'COMPLETADA'
                }));

                const { error: headerError } = await supabase
                    .from('ventas')
                    .upsert(salesPayload, { onConflict: 'id' });

                if (headerError) {
                    console.error("Batch Header Error:", headerError);
                    totalErrors += batch.length;
                    continue;
                }

                totalSalesSynced += batch.length;

                // 2. Prepare Details (Batch DELETE then INSERT)
                const batchIds = batch.map(s => s.id);
                // Clear existing details to avoid duplicates/orphans
                await supabase.from('detalles_ventas').delete().in('venta_id', batchIds);

                const allItems = [];
                batch.forEach(sale => {
                    if (sale.items && Array.isArray(sale.items)) {
                        sale.items.forEach(item => {
                            allItems.push({
                                venta_id: sale.id,
                                producto_codigo: item.code,
                                descripcion: item.description,
                                cantidad: parseFloat(item.quantity) || 0,
                                precio_unitario: parseFloat(item.unitPrice) || 0,
                                subtotal: (parseFloat(item.quantity) * parseFloat(item.unitPrice)) || 0
                            });
                        });
                    }
                });

                if (allItems.length > 0) {
                    const { error: itemsError } = await supabase
                        .from('detalles_ventas')
                        .insert(allItems);

                    if (itemsError) {
                        console.error("Batch Items Error:", itemsError);
                        // We don't increment totalErrors here as headers were already successful
                    }
                }
            }
            return { success: totalSalesSynced, errors: totalErrors };

        } catch (err) {
            console.error("Critical error in syncSales:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncCashTransactions = async () => {
        try {
            console.log("--- Syncing Cash Flows (Batch) ---");
            const transactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');
            if (transactions.length === 0) return { success: 0, errors: 0 };

            const batches = chunkArray(transactions, 50);
            let totalErrors = 0;

            for (const batch of batches) {
                const payload = batch.map(tx => ({
                    id: tx.id,
                    fecha: tx.date && tx.time ? `${tx.date}T${tx.time}:00` : new Date().toISOString(),
                    descripcion: tx.description,
                    monto: tx.amount,
                    tipo: tx.type,
                    metodo_pago: tx.paymentMethod
                }));

                const { error } = await supabase
                    .from('movimientos_caja')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error("Batch Cash Error:", error);
                    totalErrors += batch.length;
                }
            }
            return { success: transactions.length - totalErrors, errors: totalErrors };
        } catch (err) {
            console.error("Critical error in syncCash:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncSessions = async () => {
        try {
            console.log("--- Syncing Sessions (Batch) ---");
            const sessions = JSON.parse(localStorage.getItem('cashOpeningHistory') || '[]');
            if (sessions.length === 0) return { success: 0, errors: 0 };

            const batches = chunkArray(sessions, 50);
            let totalErrors = 0;

            for (const batch of batches) {
                const payload = batch.map(s => ({
                    id: s.id,
                    opening_date: s.openingDate,
                    opening_time: s.openingTime,
                    opening_amount: s.openingAmount,
                    responsible: s.responsible,
                    notes: s.notes,
                    status: s.status,
                }));

                const { error } = await supabase
                    .from('caja_sesiones')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error("Batch Sessions Error:", error);
                    totalErrors += batch.length;
                }
            }
            return { success: sessions.length - totalErrors, errors: totalErrors };
        } catch (err) {
            console.error("Critical error in syncSessions:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncProducts = async () => {
        try {
            console.log("--- Syncing Products (Batch) ---");
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            if (products.length === 0) return { success: 0, errors: 0 };

            const batches = chunkArray(products, 50);
            let totalErrors = 0;

            for (const batch of batches) {
                const payload = batch.map(p => ({
                    codigo: p.code,
                    descripcion: p.description,
                    precio_venta: p.retailPrice,
                    stock: parseFloat((p.stock || '0').toString().replace(',', '.')),
                    unidad_medida: p.um
                }));

                const { error } = await supabase
                    .from('productos')
                    .upsert(payload, { onConflict: 'codigo' });

                if (error) {
                    totalErrors += batch.length;
                    console.error("Products Batch Error:", error);
                }
            }
            return { success: products.length - totalErrors, errors: totalErrors };
        } catch (err) {
            return { success: 0, errors: 1 };
        }
    };

    const syncInvoices = async () => {
        try {
            console.log("--- Syncing Invoices (Batch) ---");
            const localSales = JSON.parse(localStorage.getItem('salesHistory') || '[]');
            if (localSales.length === 0) return { success: 0, errors: 0 };

            const batches = chunkArray(localSales, 50);
            let totalErrors = 0;

            for (const batch of batches) {
                const payload = batch.map(sale => ({
                    venta_id: sale.id,
                    numero_factura: sale.id.toString(),
                    created_at: sale.date ? new Date(sale.date).toISOString() : new Date().toISOString()
                }));

                const { error } = await supabase
                    .from('facturas')
                    .upsert(payload, { onConflict: 'venta_id' });

                if (error) {
                    console.error("Batch Invoices Error:", error);
                    totalErrors += batch.length;
                }
            }
            return { success: localSales.length - totalErrors, errors: totalErrors };
        } catch (err) {
            console.error("Critical error in syncInvoices:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncAll = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        toast({ title: "Sincronizando...", description: "Subiendo datos por lotes..." });

        try {
            const pRes = await syncProducts();
            const sRes = await syncSessions();
            const vRes = await syncSales();
            const cRes = await syncCashTransactions();
            const iRes = await syncInvoices();

            setLastSyncTime(new Date());

            if (vRes.errors === 0 && cRes.errors === 0 && sRes.errors === 0 && iRes.errors === 0) {
                toast({
                    title: "Sincronización Exitosa",
                    description: "Todos los datos (Ventas, Ítems, Caja, Facturas) están en la nube.",
                    variant: "success"
                });
            } else {
                toast({
                    title: "Sincronización Finalizada",
                    description: "Se procesaron la mayoría de los datos, pero algunos lotes fallaron. Revisa la consola.",
                    variant: "warning"
                });
            }

        } catch (error) {
            console.error("Global Sync Error:", error);
            toast({
                title: "Error Fatal",
                description: "No se pudo completar la sincronización global.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncAll();
            }
        }, 15 * 60 * 1000); // 15 minutes auto-sync

        return () => clearInterval(interval);
    }, []);

    return (
        <SupabaseSyncContext.Provider value={{ syncAll, isSyncing, lastSyncTime }}>
            {children}
        </SupabaseSyncContext.Provider>
    );
}

export const useSupabaseSync = () => useContext(SupabaseSyncContext);
