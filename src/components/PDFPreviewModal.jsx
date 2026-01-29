
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';
import { Button } from '@/components/ui/button';
import { X, Download, Printer } from 'lucide-react';

const PDFPreviewModal = ({ isOpen, onClose, invoiceData }) => {
  if (!isOpen) return null;

  const { formData, items, taxRate, discount, layout } = invoiceData;

  const handleDownload = async () => {
    try {
      const blob = await pdf(
        <InvoicePDF 
          formData={formData} 
          items={items} 
          taxRate={taxRate} 
          discount={discount}
          layout={layout}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preview-${formData.clientName || 'factura'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await pdf(
        <InvoicePDF 
          formData={formData} 
          items={items} 
          taxRate={taxRate} 
          discount={discount}
          layout={layout}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      
      // Create an invisible iframe to print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = url;
      
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          // Cleanup after a delay to ensure print dialog opened
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
      };
    } catch (error) {
      console.error("Error printing PDF:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Vista Previa del PDF</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-200">
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>

            {/* Content (PDF Viewer) */}
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
               <PDFViewer className="w-full h-full rounded-lg shadow-inner border border-gray-200" showToolbar={false}>
                  <InvoicePDF 
                    formData={formData} 
                    items={items} 
                    taxRate={taxRate} 
                    discount={discount}
                    layout={layout}
                  />
               </PDFViewer>
            </div>

            {/* Footer / Actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose} className="border-gray-300 text-gray-700">
                Cerrar
              </Button>
              
              <Button onClick={handlePrint} className="bg-gray-800 hover:bg-gray-900 text-white">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>

              <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PDFPreviewModal;
