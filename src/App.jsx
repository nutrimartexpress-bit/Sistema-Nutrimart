
import React, { useEffect, useState } from 'react';
import InvoiceGenerator from '@/components/InvoiceGenerator';
import CashOpening from '@/components/CashOpening';
import CashFlow from '@/components/CashFlow';
import CashAudit from '@/components/CashAudit';
import { CajaProvider } from '@/contexts/CajaContext';
import SalesHistory from '@/components/SalesHistory';
import ProductManagement from '@/components/ProductManagement';
import AIAssistant from '@/components/AIAssistant';
import Sidebar from '@/components/Sidebar';
import SystemMaintenance from '@/components/SystemMaintenance';
import PurchaseManagement from '@/components/PurchaseManagement';
import { Toaster } from '@/components/ui/toaster';
import { seedClients } from '@/utils/seedClients';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('facturacion');

  useEffect(() => {
    // Expose the migration function to the window object for console access
    window.seedClients = seedClients;

    console.log(
      "%c🛠️ Database Tools Available",
      "background: #333; color: #fff; padding: 5px; border-radius: 4px; font-weight: bold;"
    );
    console.log(
      "To populate the clients database, run this command in the console:\n%cawait window.seedClients()",
      "color: #3b82f6; font-family: monospace; font-size: 12px;"
    );
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'facturacion':
        return <InvoiceGenerator />;
      case 'ventas':
        return <SalesHistory />;
      case 'productos':
        return <ProductManagement />;
      case 'apertura-caja':
        return <CashOpening />;
      case 'arqueo-caja':
        return <CashAudit />;
      case 'flujo-caja':
        return <CashFlow />;
      case 'compras':
        return <PurchaseManagement />;
      case 'mantenimiento':
        return <SystemMaintenance />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">Módulo en Desarrollo</h2>
              <p className="text-gray-600">Esta sección estará disponible próximamente.</p>
              <button
                onClick={() => setActiveView('facturacion')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Volver a Facturación
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <CajaProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          activeItem={activeView}
          setActiveItem={setActiveView}
        />
        <main className="flex-1 lg:ml-0">
          {renderContent()}
        </main>
        <AIAssistant
          activeItem={activeView}
          setActiveItem={setActiveView}
        />
        <Toaster />
      </div>
    </CajaProvider>
  );
}

export default App;
