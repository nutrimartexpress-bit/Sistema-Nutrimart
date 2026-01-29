
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const SupabaseSyncContext = createContext({});

export function SupabaseSyncProvider({ children }) {
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Helper to sleep/delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const syncSales = async () => {
        try {
            console.log("--- Syncing Sales ---");
            const localSales = JSON.parse(localStorage.getItem('salesHistory') || '[]');

            if (localSales.length === 0) {
                console.log("No local sales to sync.");
                return { success: 0, errors: 0 };
            }

            let success = 0;
            let errors = 0;

            for (const sale of localSales) {
                // 1. Prepare Sale Record
                // Ensure date format compatibility
                const salePayload = {
                    id: sale.id, // Use existing ID to prevent duplicates (upsert)
                    date: sale.date,
                    time: sale.time,
                    client_name: sale.clientName,
                    ruc: sale.ruc,
                    type: sale.type,
                    total: sale.total,
                    payment_method: sale.paymentMethod,
                    status: sale.status,
                    created_at: new Date().toISOString() // Or use sale timestamp if available
                };

                // Upsert Sale Header
                const { error: saleError } = await supabase
                    .from('ventas')
                    .upsert(salePayload, { onConflict: 'id' });

                if (saleError) {
                    console.error(`Error syncing sale ${sale.id}:`, saleError);
                    errors++;
                    continue; // Skip items if header fails
                }

                // 2. Prepare Items
                if (sale.items && sale.items.length > 0) {
                    // Delete existing items for this sale to avoid duplicates during update
                    await supabase.from('detalles_ventas').delete().eq('venta_id', sale.id);

                    const itemsPayload = sale.items.map(item => ({
                        venta_id: sale.id,
                        producto_codigo: item.code,
                        descripcion: item.description,
                        cantidad: item.quantity,
                        precio_unitario: item.unitPrice,
                        subtotal: (item.quantity * item.unitPrice)
                    }));

                    const { error: itemsError } = await supabase
                        .from('detalles_ventas')
                        .insert(itemsPayload);

                    if (itemsError) {
                        console.error(`Error syncing items for ${sale.id}:`, itemsError);
                        // Don't count as full error if header succeeded, but worth noting
                    }
                }

                success++;
            }
            return { success, errors };

        } catch (err) {
            console.error("Critical error in syncSales:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncCashTransactions = async () => {
        try {
            console.log("--- Syncing Cash Flows ---");
            const transactions = JSON.parse(localStorage.getItem('cashTransactions') || '[]');

            if (transactions.length === 0) return { success: 0, errors: 0 };

            let success = 0;
            let errors = 0;

            for (const tx of transactions) {
                // Map to Supabase table structure 'movimientos_caja'
                // Assuming table has: id, fecha, descripcion, monto, tipo...
                const payload = {
                    id: tx.id,
                    fecha: tx.date ? `${tx.date}T${tx.time}:00` : new Date().toISOString(),
                    descripcion: tx.description,
                    monto: tx.amount,
                    tipo: tx.type,
                    metodo_pago: tx.paymentMethod,
                    created_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('movimientos_caja')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error(`Error syncing tx ${tx.id}:`, error);
                    errors++;
                } else {
                    success++;
                }
            }
            return { success, errors };
        } catch (err) {
            console.error("Critical error in syncCash:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncProducts = async () => {
        try {
            console.log("--- Syncing Products (Stock) ---");
            const products = JSON.parse(localStorage.getItem('products') || '[]');

            if (products.length === 0) return { success: 0, errors: 0 };

            let success = 0;
            let errors = 0;

            for (const p of products) {
                // Upsert product data
                const payload = {
                    codigo: p.code,
                    descripcion: p.description,
                    precio_venta: p.retailPrice,
                    stock: parseFloat((p.stock || '0').toString().replace(',', '.')),
                    unidad_medida: p.um
                };

                // Usually we match by 'codigo'
                const { error } = await supabase
                    .from('productos')
                    .upsert(payload, { onConflict: 'codigo' });

                if (error) {
                    // console.error(`Error syncing product ${p.code}:`, error);
                    // Silently fail for products as they might be many and not all changes matter immediately
                    errors++;
                } else {
                    success++;
                }
            }
            return { success, errors };
        } catch (err) {
            return { success: 0, errors: 1 };
        }
    };

    const syncSessions = async () => {
        try {
            console.log("--- Syncing Sessions (Aperturas) ---");
            const sessions = JSON.parse(localStorage.getItem('cashOpeningHistory') || '[]');

            if (sessions.length === 0) return { success: 0, errors: 0 };

            let success = 0;
            let errors = 0;

            for (const s of sessions) {
                // Map local session to DB columns
                const payload = {
                    id: s.id,
                    opening_date: s.openingDate,
                    opening_time: s.openingTime,
                    opening_amount: s.openingAmount,
                    responsible: s.responsible,
                    notes: s.notes,
                    status: s.status,
                };

                const { error } = await supabase
                    .from('caja_aperturas')
                    .upsert(payload, { onConflict: 'id' });

                if (error) {
                    console.error(`Error syncing session ${s.id}:`, error);
                    errors++;
                } else {
                    success++;
                }
            }
            return { success, errors };
        } catch (err) {
            console.error("Critical error in syncSessions:", err);
            return { success: 0, errors: 1 };
        }
    };

    const syncAll = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        toast({ title: "Sincronizando...", description: "Subiendo ventas, aperturas y movimientos..." });

        try {
            // 1. Sync Products (Base)
            await syncProducts();

            // 2. Sync Sessions (Hierarchy)
            const sessionsResult = await syncSessions();

            // 3. Sync Sales (Core)
            const salesResult = await syncSales();

            // 4. Sync Cash (Financial)
            const cashResult = await syncCashTransactions();

            setLastSyncTime(new Date());

            if (salesResult.errors === 0 && cashResult.errors === 0 && sessionsResult.errors === 0) {
                toast({
                    title: "Sincronización Exitosa",
                    description: `Se respaldaron Ventas, Aperturas y Movimientos.`,
                    variant: "success"
                });
            } else {
                toast({
                    title: "Sincronización Parcial",
                    description: `Hubo algunos errores. Revise la consola.`,
                    variant: "warning"
                });
            }

        } catch (error) {
            console.error("Global Sync Error:", error);
            toast({
                title: "Error de Sincronización",
                description: "No se pudo conectar con la nube.",
                variant: "destructive"
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync effect (Optional: Sync every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            // Only auto-sync if we have internet
            if (navigator.onLine) {
                syncAll();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, []);

    return (
        <SupabaseSyncContext.Provider value={{ syncAll, isSyncing, lastSyncTime }}>
            {children}
        </SupabaseSyncContext.Provider>
    );
}

export const useSupabaseSync = () => useContext(SupabaseSyncContext);
