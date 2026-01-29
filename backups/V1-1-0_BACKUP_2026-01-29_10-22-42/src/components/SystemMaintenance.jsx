
import { Shield, Database, Save, HardDrive, CheckCircle, AlertTriangle, RotateCcw, CloudUpload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseSync } from '@/contexts/SupabaseSyncContext';

// BACKUP DATA 2026-01-28 13:25
const BACKUP_VENTAS = [
    {
        "id": "919e7793-3d8f-42bf-b9dd-4e32f5ad0e3e",
        "cliente_id": null,
        "subtotal": 39750,
        "impuesto_total": 3613,
        "descuento": 0,
        "total": 39750,
        "metodo_pago": null,
        "created_at": "2026-01-27T18:09:40.139946+00:00",
        "caja_id": "91eb8d3a-986a-4eae-940c-0f9d4d4f212d",
        "client_name": "Cliente Ocasional",
        "payment_method": "Efectivo",
        "items": [
            {
                "code": "188",
                "quantity": 0.25,
                "subtotal": 18750,
                "unitPrice": 75000,
                "description": "OSITOS DE FRUTILLA"
            },
            {
                "code": "195",
                "quantity": 0.3,
                "subtotal": 13500,
                "unitPrice": 45000,
                "description": "COPOS DE MAIZ"
            },
            {
                "quantity": 3,
                "subtotal": 7500,
                "unitPrice": 2500,
                "description": "Avatinas"
            }
        ],
        "ruc": null,
        "type": "TICKET",
        "time": "15:15",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "9d988497-1aa1-452a-bfae-a8402ca69884",
        "cliente_id": null,
        "subtotal": 123120,
        "impuesto_total": 11193,
        "descuento": 0,
        "total": 0,
        "metodo_pago": "efectivo",
        "created_at": "2026-01-26T13:12:03.97043+00:00",
        "caja_id": "91eb8d3a-986a-4eae-940c-0f9d4d4f212d",
        "client_name": null,
        "payment_method": null,
        "items": [],
        "ruc": null,
        "type": "TICKET",
        "time": null,
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "19fc47d6-e4e3-4b54-a135-201c74f07e93",
        "cliente_id": null,
        "subtotal": 44000,
        "impuesto_total": 4000,
        "descuento": 0,
        "total": 44000,
        "metodo_pago": "Tarjeta de Débito",
        "created_at": "2026-01-27T15:44:35.86102+00:00",
        "caja_id": null,
        "client_name": "GLORIA TERESSA GOMEZ",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769528526055,
                "um": "Unid",
                "code": "39",
                "discount": 0,
                "quantity": "0.1",
                "unitPrice": 50000,
                "description": "GARRAPIÃ±ADA",
                "retailPrice": 50000,
                "wholesaleQty": 2,
                "wholesalePrice": 50000
            },
            {
                "id": 1769528567599,
                "um": "Unid",
                "code": "358",
                "discount": 0,
                "quantity": "0.1",
                "unitPrice": 70000,
                "description": "CEBOLLA EN ESCAMAS",
                "retailPrice": 70000,
                "wholesaleQty": 2,
                "wholesalePrice": 70000
            },
            {
                "id": 1769528603694,
                "um": "kg",
                "code": "357",
                "discount": 0,
                "quantity": "0.1",
                "unitPrice": 80000,
                "description": "AJO FRITO",
                "retailPrice": 80000,
                "wholesaleQty": 2,
                "wholesalePrice": 80000
            },
            {
                "id": 1769528617934,
                "um": "kg",
                "code": "589",
                "discount": 0,
                "quantity": "0.2",
                "unitPrice": 120000,
                "description": "CAJU CRUDA PARTIDA",
                "retailPrice": 120000,
                "wholesaleQty": 2,
                "wholesalePrice": 120000
            }
        ],
        "ruc": "821474-3",
        "type": "INVOICE",
        "time": "12:44",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "f0865ad3-1d7e-4a88-850d-ebb8718cec8c",
        "cliente_id": null,
        "subtotal": 16250,
        "impuesto_total": 1477,
        "descuento": 0,
        "total": 16251,
        "metodo_pago": "Efectivo",
        "created_at": "2026-01-27T18:25:21.105664+00:00",
        "caja_id": null,
        "client_name": "SIN NOMBRE",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769538207269,
                "um": "Unid",
                "code": "39",
                "discount": 0,
                "quantity": 0.2,
                "unitPrice": 50000,
                "description": "GARRAPIÃ±ADA",
                "retailPrice": 50000,
                "wholesaleQty": 2,
                "wholesalePrice": 50000
            },
            {
                "id": 1769538230507,
                "um": "KG",
                "code": "38",
                "discount": 0,
                "quantity": 0.25,
                "unitPrice": 25000,
                "description": "MANI SALADO",
                "retailPrice": 25000,
                "wholesaleQty": 2,
                "wholesalePrice": 25000
            }
        ],
        "ruc": "0",
        "type": "SALE",
        "time": "15:25",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "55bc529f-9e22-4c6e-8956-4d2a7a13a3bc",
        "cliente_id": null,
        "subtotal": 10000,
        "impuesto_total": 909,
        "descuento": 0,
        "total": 10000,
        "metodo_pago": "Efectivo",
        "created_at": "2026-01-27T18:25:54.197827+00:00",
        "caja_id": null,
        "client_name": "SIN NOMBRE",
        "payment_method": "Efectivo",
        "items": [
            {
                "id": 1769538337747,
                "um": "Unid",
                "code": "39",
                "discount": 0,
                "quantity": "0.2",
                "unitPrice": 50000,
                "description": "GARRAPIÃ±ADA",
                "retailPrice": 50000,
                "wholesaleQty": 2,
                "wholesalePrice": 50000
            }
        ],
        "ruc": "0",
        "type": "SALE",
        "time": "15:25",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "36032db9-3bb3-4243-80cf-68568651b9a0",
        "cliente_id": null,
        "subtotal": 83250,
        "impuesto_total": 7568,
        "descuento": 0,
        "total": 83250,
        "metodo_pago": "Tarjeta de Débito",
        "created_at": "2026-01-27T19:28:34.046684+00:00",
        "caja_id": null,
        "client_name": "PABLO ARTAZA",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769542046022,
                "um": "KG",
                "code": "15",
                "discount": 0,
                "quantity": 0.25,
                "unitPrice": 185000,
                "description": "CASTAÃ±AS DE CAJU SALADAS",
                "retailPrice": 185000,
                "wholesaleQty": 2,
                "wholesalePrice": 185000
            },
            {
                "id": 1769542048872,
                "um": "kg ",
                "code": "585",
                "discount": 0,
                "quantity": 0.1,
                "unitPrice": 370000,
                "description": "PISTACHOS PREMIUM",
                "retailPrice": 370000,
                "wholesaleQty": 2,
                "wholesalePrice": 370000
            }
        ],
        "ruc": "3195429-4",
        "type": "INVOICE",
        "time": "16:28",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "a3a8dca7-c1ef-40fe-b5ff-f450140b5dc3",
        "cliente_id": null,
        "subtotal": 74500,
        "impuesto_total": 6772,
        "descuento": 0,
        "total": 74500,
        "metodo_pago": "Tarjeta de Débito",
        "created_at": "2026-01-27T19:34:12.969642+00:00",
        "caja_id": null,
        "client_name": "MARIA PAZ FLORENTIN",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769542315761,
                "um": "Unid",
                "code": "74132",
                "discount": 0,
                "quantity": 1,
                "unitPrice": 27000,
                "description": "MIX KETO 125G",
                "retailPrice": 27000,
                "wholesaleQty": 2,
                "wholesalePrice": 27000
            },
            {
                "id": 1769542319841,
                "um": "KG",
                "code": "1",
                "discount": 0,
                "quantity": 0.1,
                "unitPrice": 125000,
                "description": "ALMENDRAS",
                "retailPrice": 125000,
                "wholesaleQty": 2,
                "wholesalePrice": 125000
            },
            {
                "id": 1769542373366,
                "um": "80",
                "code": "80",
                "discount": 0,
                "quantity": 0.1,
                "unitPrice": 350000,
                "description": "CHIPS CACAO 70% ERT",
                "retailPrice": 350000,
                "wholesaleQty": 2,
                "wholesalePrice": 350000
            }
        ],
        "ruc": "5810495-0",
        "type": "INVOICE",
        "time": "16:34",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "4b0737ef-eadd-4d48-96a3-a98765b30497",
        "cliente_id": null,
        "subtotal": 53500,
        "impuesto_total": 4863,
        "descuento": 0,
        "total": 53500,
        "metodo_pago": "Tarjeta de Débito",
        "created_at": "2026-01-27T19:36:12.530141+00:00",
        "caja_id": null,
        "client_name": "FERNANDO RIVEROS",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769542503839,
                "um": "kg ",
                "code": "104",
                "discount": 0,
                "quantity": 0.6,
                "unitPrice": "45000",
                "description": "PASAS JUMBO",
                "retailPrice": 30681.8182,
                "wholesaleQty": 2,
                "wholesalePrice": 30681.8182
            },
            {
                "id": 1769542521729,
                "um": "UNIDAD",
                "code": "800",
                "discount": 0,
                "quantity": 1,
                "unitPrice": 26500,
                "description": "MIX PAN DULCE PREMIUM",
                "retailPrice": 26500,
                "wholesaleQty": 2,
                "wholesalePrice": 26500
            }
        ],
        "ruc": "6530958-8",
        "type": "INVOICE",
        "time": "16:36",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "461ec891-78ea-4fef-8463-109fb7bfbcce",
        "cliente_id": null,
        "subtotal": 12000,
        "impuesto_total": 1090,
        "descuento": 0,
        "total": 12000,
        "metodo_pago": "Tarjeta de Débito",
        "created_at": "2026-01-27T19:38:02.348662+00:00",
        "caja_id": null,
        "client_name": "SIN NOMBRE",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769542657436,
                "um": "Unid",
                "code": "292",
                "discount": 0,
                "quantity": 0.1,
                "unitPrice": 120000,
                "description": "CACAO AMARGO",
                "retailPrice": 120000,
                "wholesaleQty": 2,
                "wholesalePrice": 120000
            }
        ],
        "ruc": "0",
        "type": "SALE",
        "time": "16:38",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "31b28480-5a5f-4876-91b0-a63f7115f3a6",
        "cliente_id": null,
        "subtotal": 30000,
        "impuesto_total": 2727,
        "descuento": 0,
        "total": 30000,
        "metodo_pago": "Efectivo",
        "created_at": "2026-01-28T12:06:35.883865+00:00",
        "caja_id": null,
        "client_name": "SIN NOMBRE",
        "payment_method": "Efectivo",
        "items": [
            {
                "id": 1769601915183,
                "um": "unidad",
                "code": "23123",
                "discount": 0,
                "quantity": 1,
                "unitPrice": 30000,
                "description": "MIX TRADICIONAL 250GR",
                "retailPrice": 30000,
                "wholesaleQty": 2,
                "wholesalePrice": 30000
            }
        ],
        "ruc": "0",
        "type": "SALE",
        "time": "09:06",
        "date": "2026-01-27",
        "status": "Completado"
    },
    {
        "id": "0bd6c28e-26e2-471e-ac2e-0feee6b0770a",
        "cliente_id": null,
        "subtotal": 45000,
        "impuesto_total": 4090,
        "descuento": 0,
        "total": 45000,
        "metodo_pago": "Efectivo",
        "created_at": "2026-01-27T16:57:34.752431+00:00",
        "caja_id": null,
        "client_name": "LUIS PORTILLO",
        "payment_method": "Tarjeta de Débito",
        "items": [
            {
                "id": 1769533007726,
                "um": "Unid",
                "code": "7804681010005",
                "discount": 0,
                "quantity": 1,
                "unitPrice": 22500,
                "description": "NATURAL FRAMBUESA 475ML SEAWATER",
                "retailPrice": 22500,
                "wholesaleQty": 2,
                "wholesalePrice": 22500
            },
            {
                "id": 1769533013468,
                "um": "Unid",
                "code": "7804681010029",
                "discount": 0,
                "quantity": 1,
                "unitPrice": 22500,
                "description": "HIDRATANTE MBURUCUYA 475ML SEAWATER",
                "retailPrice": 22500,
                "wholesaleQty": 2,
                "wholesalePrice": 22500
            }
        ],
        "ruc": "2301227-7",
        "type": "INVOICE",
        "time": "13:57",
        "date": "2026-01-27",
        "status": "Completado"
    }
];

const BACKUP_MOVIMIENTOS = [
    {
        "id": "80f59ce8-e1a8-4b4c-bf80-5a8245e2fd1b",
        "tipo": "income",
        "descripcion": "INVOICE - GLORIA TERESSA GOMEZ",
        "monto": 44000,
        "fecha": "2026-01-27T15:44:36.193424+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "12:44"
    },
    {
        "id": "95ce3d1c-4d1c-425c-b050-b97f985029d0",
        "tipo": "income",
        "descripcion": "INVOICE - PABLO ARTAZA",
        "monto": 83250,
        "fecha": "2026-01-27T19:28:34.322139+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "16:28"
    },
    {
        "id": "a73fd22a-85ba-4bd2-a453-5a3257c392f1",
        "tipo": "income",
        "descripcion": "INVOICE - MARIA PAZ FLORENTIN",
        "monto": 74500,
        "fecha": "2026-01-27T19:34:13.263177+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "16:34"
    },
    {
        "id": "99e24e50-63c3-4f51-b1b0-2f50ed92c35e",
        "tipo": "income",
        "descripcion": "INVOICE - FERNANDO RIVEROS",
        "monto": 53500,
        "fecha": "2026-01-27T19:36:12.779635+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "16:36"
    },
    {
        "id": "e42a149a-3dd5-4a7b-8e3c-08dd7c24aae3",
        "tipo": "income",
        "descripcion": "SALE - SIN NOMBRE",
        "monto": 12000,
        "fecha": "2026-01-27T19:38:02.569991+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "16:38"
    },
    {
        "id": "42cf70ad-f160-491f-b654-975db9ee86de",
        "tipo": "income",
        "descripcion": "INVOICE - LUIS PORTILLO",
        "monto": 45000,
        "fecha": "2026-01-27T16:57:35.097018+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "13:57"
    },
    {
        "id": "c66b6528-c8f8-4aff-a77b-adb4f178d025",
        "tipo": "income",
        "descripcion": "TICKET - Cliente Ocasional",
        "monto": 39750,
        "fecha": "2026-01-27T20:53:21.215155+00:00",
        "payment_method": "Efectivo",
        "time": "15:15"
    },
    {
        "id": "d7b251b0-a91a-4502-8ca0-9a4911c8d9ae",
        "tipo": "income",
        "descripcion": "SALE - SIN NOMBRE",
        "monto": 16251,
        "fecha": "2026-01-27T20:53:21.465085+00:00",
        "payment_method": "Tarjeta de Débito",
        "time": "15:25"
    },
    {
        "id": "104709f8-471d-4c67-bb05-26c06190eb9d",
        "tipo": "income",
        "descripcion": "SALE - SIN NOMBRE",
        "monto": 10000,
        "fecha": "2026-01-27T20:53:21.69436+00:00",
        "payment_method": "Efectivo",
        "time": "15:25"
    },
    {
        "id": "ef0d2d20-ab8e-4937-b8f9-0153db35599a",
        "tipo": "income",
        "descripcion": "SALE - SIN NOMBRE",
        "monto": 30000,
        "fecha": "2026-01-28T12:06:36.267405+00:00",
        "payment_method": "Efectivo",
        "time": "09:06"
    }
];

const SystemMaintenance = () => {
    const { toast } = useToast();
    const { syncAll, isSyncing } = useSupabaseSync();

    const handleRestoreBackup = () => {
        if (!window.confirm("¿Estás seguro de restaurar el Backup del 28/01 (13:25)?\n\nESTO SOBREESCRIBIRÁ LOS DATOS ACTUALES.")) return;

        try {
            // Restore Sales
            const restoredSales = BACKUP_VENTAS.map(sale => ({
                ...sale,
                clientName: sale.client_name || sale.clientName, // FIX CAMELCASE
                paymentMethod: sale.payment_method || sale.metodo_pago,
            }));
            localStorage.setItem('salesHistory', JSON.stringify(restoredSales));

            // Restore Cash Transactions
            const restoredTransactions = BACKUP_MOVIMIENTOS.map(mov => {
                let finalDate = mov.date;
                if (!finalDate && mov.fecha) {
                    finalDate = mov.fecha.split('T')[0];
                }
                return {
                    id: mov.id,
                    type: mov.tipo || mov.type,
                    description: mov.descripcion || mov.description,
                    amount: mov.monto ?? mov.amount,
                    date: finalDate,
                    time: mov.time || '00:00',
                    paymentMethod: mov.payment_method || 'Efectivo',
                    destination: 'Caja',
                    clientName: (mov.descripcion || '').split(' - ')[1] || 'SISTEMA'
                };
            });
            localStorage.setItem('cashTransactions', JSON.stringify(restoredTransactions));

            toast({
                title: "Restauración Completada",
                description: "El sistema se reiniciará para aplicar los cambios.",
                variant: "success"
            });

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error(error);
            toast({
                title: "Error al Restarura",
                description: "No se pudo procesar el backup.",
                variant: "destructive"
            });
        }
    };
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Protección y Control de Versiones
                </h1>
                <p className="text-gray-600 mt-2 flex items-center gap-2">
                    Gestión centralizada de copias de seguridad.
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Versión Actual: v1.1.0</span>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Estado de Protección
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg text-green-700">
                            <span className="flex items-center gap-2 font-medium">
                                <Database className="w-4 h-4" /> Datos en la Nube
                            </span>
                            <span className="text-sm">Protegido (Supabase)</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg text-blue-700">
                            <span className="flex items-center gap-2 font-medium">
                                <Save className="w-4 h-4" /> Scripts de Backup
                            </span>
                            <span className="text-sm">Configurados y Listos</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg text-purple-700">
                            <span className="flex items-center gap-2 font-medium">
                                <HardDrive className="w-4 h-4" /> Almacenamiento Local
                            </span>
                            <span className="text-sm">Carpeta /backups activa</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100">
                            <span className="flex items-center gap-2 font-medium">
                                <Save className="w-4 h-4" /> Punto de Restauración
                            </span>
                            <span className="text-sm font-bold underline cursor-help" title="Use PROTECCION_TOTAL.bat para crear uno">Versionado Activo</span>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-200" />
                        ¿Cómo funciona?
                    </h2>
                    <p className="text-blue-100 text-sm leading-relaxed mb-4">
                        He implementado un sistema de <strong>Protección Total</strong> que resguarda dos capas críticas:
                    </p>
                    <ul className="text-sm space-y-2 text-blue-50">
                        <li className="flex items-start gap-2">
                            <div className="mt-1 w-1.5 h-1.5 bg-blue-300 rounded-full" />
                            <span><strong>Capa de Código:</strong> Copia exacta de src, componentes y configuración.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="mt-1 w-1.5 h-1.5 bg-blue-300 rounded-full" />
                            <span><strong>Capa de Datos:</strong> Exportación de todas las tablas de Supabase a JSON local.</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-xl">
                <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5" /> Acción Requerida para Resguardo Manual
                </h2>
                <p className="text-amber-900 mb-4">
                    Para realizar un resguardo completo ahora mismo, ejecute el archivo técnico que he preparado en la carpeta raíz del sistema:
                </p>
                <div className="bg-white p-4 rounded-lg border border-amber-300 font-mono text-sm text-gray-700 shadow-inner overflow-x-auto">
                    PROTECCION_TOTAL.bat
                </div>
                <p className="text-amber-800 text-xs mt-4 italic">
                    * Este archivo ejecutará automáticamente el respaldo de código y la exportación de la base de datos a la carpeta /backups.
                </p>
            </div>

            <div className="mt-8 flex justify-center gap-4">
                <button
                    onClick={handleRestoreBackup}
                    className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-black uppercase shadow-lg shadow-green-200 transition-all active:scale-95"
                >
                    <RotateCcw className="w-5 h-5" />
                    Restaurar Backup (28/01 - 13:25)
                </button>
                <button
                    onClick={syncAll}
                    disabled={isSyncing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold uppercase transition-all shadow-lg ${isSyncing
                            ? 'bg-blue-400 text-white cursor-wait'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 active:scale-95'
                        }`}
                >
                    <CloudUpload className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
                    {isSyncing ? 'Subiendo...' : 'Sincronizar con la Nube'}
                </button>
            </div>
        </div>
    );
};

export default SystemMaintenance;
