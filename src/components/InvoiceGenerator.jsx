
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceItems from '@/components/InvoiceItems';
import InvoiceSummary from '@/components/InvoiceSummary';
import InvoicePreview from '@/components/InvoicePreview';
import InvoicePDF from '@/components/InvoicePDF';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import InvoiceLayoutEditor, { DEFAULT_LAYOUT } from '@/components/InvoiceLayoutEditor';
import QuickProductEntry from '@/components/QuickProductEntry';
import AIScanner from '@/components/AIScanner';
import { pdf } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import { useRUCLookup } from '@/hooks/useRUCLookup';
import { useCaja } from '@/contexts/CajaContext';
import { useSupabaseSync } from '@/contexts/SupabaseSyncContext';
import { CloudDownload } from 'lucide-react';

// Helper to get local date in YYYY-MM-DD format to avoid UTC shifts
const getLocalTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialFormData = () => ({
  ruc: '0',
  clientName: 'SIN NOMBRE',
  clientPhone: '',
  clientAddress: '',
  invoiceDate: getLocalTodayDate(),
  saleCondition: 'Contado',
  seller: '',
  deliveryCost: '',
  notes: '',
  paymentMethod: 'Efectivo',
  paymentMethod2: '',
  companyName: 'My Company',
  invoiceNumber: '001',
  dueDate: '',
  vatRate: '10'
});

function InvoiceGenerator() {
  const { toast } = useToast();
  const { saveRUC } = useRUCLookup();
  const { currentSession, addTransaction } = useCaja();
  const { pullAll, isSyncing } = useSupabaseSync();

  // Check if system is empty (to suggest sync)
  const isSystemEmpty = (() => {
    try {
      const stored = localStorage.getItem('products');
      if (!stored) return true;
      const parsed = JSON.parse(stored);
      return !Array.isArray(parsed) || parsed.length === 0;
    } catch {
      return true;
    }
  })();

  console.log("System empty check:", isSystemEmpty);

  // Load data from localStorage
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [formData, setFormData] = useState(() => loadFromStorage('invoiceFormData', getInitialFormData()));

  const [items, setItems] = useState(() => loadFromStorage('invoiceItems', []));
  const [discount, setDiscount] = useState(() => loadFromStorage('invoiceDiscount', '0'));
  const [cashReceived, setCashReceived] = useState('0');

  // Layout State
  const [layout, setLayout] = useState(() => {
    const saved = loadFromStorage('invoiceLayoutCoordsV2', null);
    if (saved) {
      return { ...DEFAULT_LAYOUT, ...saved };
    }
    return DEFAULT_LAYOUT;
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('invoiceFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('invoiceItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('invoiceDiscount', JSON.stringify(discount));
  }, [discount]);

  useEffect(() => {
    localStorage.setItem('invoiceLayoutCoordsV2', JSON.stringify(layout));
  }, [layout]);

  // AI INTELLIGENCE: Listen for smart cart events
  useEffect(() => {
    const processAIItems = (suggestedItems) => {
      const allProducts = JSON.parse(localStorage.getItem('products') || '[]');

      suggestedItems.forEach(aiItem => {
        const product = allProducts.find(p => p.code === aiItem.code);
        if (product) {
          addProductFromQuickEntry({
            ...product,
            quantity: aiItem.qty || 1
          });
        } else {
          console.warn(`AI suggested product code ${aiItem.code} not found in inventory.`);
        }
      });

      toast({
        title: "Inteligencia Aplicada",
        description: "La IA ha cargado los productos sugeridos en tu Carrito.",
      });
    };

    const handleAIItems = (event) => {
      processAIItems(event.detail);
    };

    // Check for pending items (if component was unmounted during AI response)
    const pending = localStorage.getItem('pendingAIItems');
    if (pending) {
      try {
        const items = JSON.parse(pending);
        processAIItems(items);
        localStorage.removeItem('pendingAIItems');
      } catch (e) {
        console.error("Error parsing pending AI items:", e);
      }
    }

    window.addEventListener('HORIZON_AI_ADD_ITEMS', handleAIItems);
    return () => window.removeEventListener('HORIZON_AI_ADD_ITEMS', handleAIItems);
  }, []); // Empty dependencies but addProductFromQuickEntry MUST be refactored to use functional state

  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientName?.trim()) {
      newErrors.clientName = 'Razón Social is required';
    }
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearInvoiceData = () => {
    setFormData(getInitialFormData());
    setItems([]);
    setDiscount('0');
    setCashReceived('0');
    setErrors({});
  };

  const generateAndDownloadPDF = async (type) => {
    // Check if there's an active cash opening
    if (!currentSession) {
      toast({
        title: "Caja Cerrada",
        description: "Debe realizar una Apertura de Caja antes de facturar.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    // Try to save RUC if valid
    if (formData.ruc && formData.ruc !== '0') {
      const saveResult = await saveRUC(formData.ruc, formData.clientName);
      if (saveResult === true) {
        toast({
          title: "Cliente Nuevo",
          description: "Se ha registrado el RUC en la base de datos.",
          variant: "success"
        });
      }
    }

    try {
      // Calculate total for cash flow
      const subtotal = items.reduce((acc, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const itemDiscount = parseFloat(item.discount) || 0;
        const gross = qty * price;
        return acc + (gross - (gross * (itemDiscount / 100)));
      }, 0);
      const delivery = parseFloat(formData.deliveryCost) || 0;
      const discountVal = parseFloat(discount) || 0;
      const totalAmount = subtotal + delivery - discountVal;

      // Register transaction in Cash Flow via Context
      const newTransaction = addTransaction({
        description: `${type.toUpperCase()} - ${formData.clientName}`,
        amount: totalAmount,
        type: 'income',
        paymentMethod: formData.paymentMethod || 'Efectivo',
        clientName: formData.clientName,
        invoiceNumber: formData.invoiceNumber || 'S/N',
        isManual: false
      });


      // Register in detailed Sales History for Ventas module
      const detailedSale = {
        id: newTransaction.id,
        date: formData.invoiceDate,
        time: newTransaction.time,
        clientName: formData.clientName,
        ruc: formData.ruc,
        type: type.toUpperCase(), // TICKET, INVOICE, SALE
        total: totalAmount,
        paymentMethod: formData.paymentMethod,
        items: items, // ACTUALIZACIÓN: Guardamos la lista completa de objetos (antes era solo items.length)
        status: 'Completado'
      };

      const salesHistory = JSON.parse(localStorage.getItem('salesHistory') || '[]');
      localStorage.setItem('salesHistory', JSON.stringify([detailedSale, ...salesHistory]));

      // --- ACTUALIZACIÓN DE STOCK: Descontar productos del inventario ---
      const currentProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedProducts = [...currentProducts];

      items.forEach(soldItem => {
        const productIdx = updatedProducts.findIndex(p => p.code === soldItem.code);
        if (productIdx > -1) {
          // Manejo de formato paraguayo (10,0 -> 10.0)
          const currentStockStr = (updatedProducts[productIdx].stock || '0').toString().replace(',', '.');
          const currentStockNum = parseFloat(currentStockStr);
          const soldQtyNum = parseFloat(soldItem.quantity) || 0;

          const newStock = Math.max(0, currentStockNum - soldQtyNum);
          // Volvemos a guardar en formato coma para consistencia si es necesario, 
          // aunque el sistema parece preferir coma o punto según el campo. 
          // Usaremos .replace('.', ',') para mantener el estilo original.
          updatedProducts[productIdx].stock = newStock.toFixed(2).replace('.', ',');
        }
      });

      localStorage.setItem('products', JSON.stringify(updatedProducts));

      // New Logic: If it's just a sale, don't generate/download PDF
      if (type === 'sale') {
        toast({
          title: "¡Venta Registrada!",
          description: "La venta se ha guardado correctamente en el sistema y caja.",
        });
        clearInvoiceData(); // Auto-reset after sale
        return;
      }

      const blob = await pdf(
        <InvoicePDF
          formData={{ ...formData, invoiceNumber: type === 'ticket' ? 'TKT-001' : 'INV-001' }}
          items={items}
          taxRate={formData.vatRate}
          discount={discount}
          layout={layout}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      // Open in new tab for direct printing instead of downloading
      window.open(url, '_blank');

      toast({
        title: "¡Documento Generado!",
        description: `${type.toUpperCase()} abierto en nueva pestaña para imprimir.`,
      });

      // Auto-reset after successful PDF generation/view
      clearInvoiceData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviewOpen = () => {
    if (items.length === 0) {
      toast({
        title: "Factura Vacía",
        description: "Agrega productos para ver la vista previa.",
        variant: "warning",
      });
      return;
    }
    setPreviewOpen(true);
  };

  const addProductFromQuickEntry = (product) => {
    setItems(prevItems => {
      // Check if product already exists in items
      const existingIndex = prevItems.findIndex(item => item.code === product.code);

      if (existingIndex > -1) {
        // Update quantity
        const newItems = [...prevItems];
        newItems[existingIndex].quantity = (parseFloat(newItems[existingIndex].quantity) || 0) + (product.quantity || 1);

        // Show notification (outside state update is fine but toast is async anyway)
        toast({
          title: "Cantidad Actualizada",
          description: `${product.description} (+${product.quantity || 1})`,
        });

        return newItems;
      } else {
        // Add as new item
        const newItem = {
          id: Date.now() + Math.random(), // Add random for safety in fast loops
          code: product.code,
          quantity: product.quantity || 1,
          um: product.unit || 'Unid',
          description: product.description,
          unitPrice: parseFloat(product.retailPrice) || 0,
          discount: 0,
        };

        toast({
          title: "Producto Agregado",
          description: `${product.description} añadido al carrito.`,
        });

        return [...prevItems, newItem];
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Generador de Facturas</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Cloud Sync Alert (Only if empty) */}
          {isSystemEmpty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-400/30"
            >
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CloudDownload className="w-8 h-8 text-blue-100" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">¡Sistema Conectado!</h3>
                  <p className="text-blue-100 text-sm">Detectamos que no tienes productos. ¿Quieres descargar tus datos desde la Nube (Supabase)?</p>
                </div>
              </div>
              <button
                onClick={pullAll}
                disabled={isSyncing}
                className="px-8 py-3 bg-white text-blue-700 rounded-full font-black uppercase tracking-wider shadow-lg hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSyncing ? 'Sincronizando...' : 'Descargar Datos Ahora'}
              </button>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Punto de Venta</h1>
            <p className="text-gray-600">Generación de Comprobantes</p>
          </motion.div>

          <div className="space-y-8">
            {/* AI Neuro-Link Section */}
            <AIScanner
              onDataReceived={(data) => {
                if (!data) return;
                // AGENTE 3: BusinessLogicAssistant (Lógica de Mapeo con Blindaje)
                try {
                  if (data.cliente) setFormData(prev => ({ ...prev, clientName: String(data.cliente) }));
                  if (data.fecha) setFormData(prev => ({ ...prev, invoiceDate: String(data.fecha) }));

                  if (Array.isArray(data.items) && data.items.length > 0) {
                    const allProducts = JSON.parse(localStorage.getItem('products') || '[]');

                    data.items.forEach(aiItem => {
                      if (!aiItem || !aiItem.descripcion) return; // Salto seguro

                      const desc = String(aiItem.descripcion).toLowerCase();

                      // Intentamos normalizar el producto (IA -> Inventario)
                      const fuzzyMatch = allProducts.find(p => {
                        const pDesc = (p.description || '').toLowerCase();
                        return pDesc.includes(desc) || desc.includes(pDesc);
                      });

                      if (fuzzyMatch) {
                        addProductFromQuickEntry({
                          ...fuzzyMatch,
                          quantity: parseFloat(aiItem.cantidad) || 1
                        });
                      } else {
                        // Si no existe, lo agregamos como ítem genérico con datos seguros
                        const newItem = {
                          id: Date.now() + Math.random(),
                          code: 'SCAN',
                          quantity: parseFloat(aiItem.cantidad) || 1,
                          um: 'Unid',
                          description: String(aiItem.descripcion).toUpperCase(),
                          unitPrice: parseFloat(aiItem.precio_unitario) || 0,
                          discount: 0,
                        };
                        setItems(prev => [...prev, newItem]);
                      }
                    });
                  }
                } catch (err) {
                  console.error("Error processing AI data:", err);
                  toast({ title: "Error de Datos", description: "La IA devolvió datos en un formato inesperado.", variant: "destructive" });
                }
              }}
              onCommandReceived={(intent) => {
                if (!intent || !intent.accion) return;

                try {
                  // VoiceCommandAgent Handler with safety
                  switch (intent.accion) {
                    case 'agregar_producto':
                      if (!intent.datos || !intent.datos.descripcion) break;
                      const allProducts = JSON.parse(localStorage.getItem('products') || '[]');
                      const searchStr = String(intent.datos.descripcion).toLowerCase();

                      const product = allProducts.find(p =>
                        (p.description || '').toLowerCase().includes(searchStr)
                      );
                      if (product) {
                        addProductFromQuickEntry({ ...product, quantity: parseFloat(intent.datos.cantidad) || 1 });
                      } else {
                        toast({ title: "IA: Producto no encontrado", description: `No encontré "${intent.datos.descripcion}" en stock.`, variant: "warning" });
                      }
                      break;
                    case 'eliminar_producto':
                      setItems(prev => prev.slice(0, -1));
                      break;
                    case 'guardar_factura':
                      generateAndDownloadPDF('invoice');
                      break;
                    case 'asignar_cliente':
                      if (intent.datos && intent.datos.nombre) {
                        setFormData(prev => ({ ...prev, clientName: String(intent.datos.nombre) }));
                      }
                      break;
                    default:
                      console.log("Acción no reconocida:", intent.accion);
                  }
                } catch (err) {
                  console.error("Error in voice command handler:", err);
                }
              }}
            />

            {/* Form Section */}
            <InvoiceForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              onGenerateTicket={() => generateAndDownloadPDF('ticket')}
              onGenerateInvoice={() => generateAndDownloadPDF('invoice')}
              onGenerateSale={() => generateAndDownloadPDF('sale')}
              onPreview={handlePreviewOpen}
              onEditLayout={() => setEditorOpen(true)}
            />

            <div className="grid grid-cols-1 gap-8">
              {/* Items & Summary */}
              <div className="space-y-6">
                <QuickProductEntry onAddProduct={addProductFromQuickEntry} />

                <InvoiceItems
                  items={items}
                  setItems={setItems}
                  errors={errors}
                  defaultUnitPrice={formData.unitPrice}
                />
                <InvoiceSummary
                  items={items}
                  vatRate={formData.vatRate}
                  discount={discount}
                  setDiscount={setDiscount}
                  cashReceived={cashReceived}
                  setCashReceived={setCashReceived}
                />
              </div>
            </div>

            {/* Live Preview Section (Always visible for editing feedback loop) */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Vista Previa de Diseño (IVA Incluido)</h2>
              <InvoicePreview
                formData={formData}
                items={items}
                taxRate={formData.vatRate}
                discount={discount}
                layout={layout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoiceData={{
          formData,
          items,
          taxRate: formData.vatRate,
          discount,
          layout
        }}
      />

      {/* Layout Editor Modal */}
      <InvoiceLayoutEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        currentLayout={layout}
        onGeneratePreview={() => {
          handlePreviewOpen();
        }}
        onSave={(newLayout) => {
          setLayout(newLayout);
          toast({
            title: "Diseño Actualizado",
            description: "Las nuevas coordenadas se han guardado.",
          });
        }}
      />
    </>
  );
}

export default InvoiceGenerator;
