import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    ShoppingCart,
    FileText,
    Package,
    DollarSign,
    Box,
    Settings,
    Database,
    Shield,
    ChevronRight,
    ChevronDown,
    ChevronLeft,
    Menu,
    Wallet,
    Calculator,
    TrendingUp
} from 'lucide-react';

const menuItems = [
    { id: 'inicio', label: 'INICIO', icon: Home, isHeader: true },
    { id: 'ventas', label: 'Historial de Ventas', icon: FileText, hasSubmenu: true },
    { id: 'facturacion', label: 'Carrito / Facturación', icon: ShoppingCart, hasSubmenu: true, active: true },
    { id: 'compras', label: 'Compras', icon: Package, hasSubmenu: true },
    {
        id: 'caja',
        label: 'Caja',
        icon: DollarSign,
        hasSubmenu: true,
        submenu: [
            { id: 'apertura-caja', label: 'Apertura de Caja', icon: Wallet },
            { id: 'arqueo-caja', label: 'Arqueo de Caja', icon: Calculator },
            { id: 'flujo-caja', label: 'Flujo de Caja', icon: TrendingUp },
        ]
    },
    { id: 'productos', label: 'Productos', icon: Box, hasSubmenu: true },
    { id: 'administrativos', label: 'Administrativos', icon: Settings, hasSubmenu: true },
    { id: 'basedatos', label: 'Base de Datos', icon: Database, hasSubmenu: true },
    { id: 'mantenimiento', label: 'Protección y Backup', icon: Shield, hasSubmenu: false },
    { id: 'controles', label: 'Controles Especiales SG', icon: Shield, hasSubmenu: false },
];

function Sidebar({ isOpen, setIsOpen, activeItem, setActiveItem }) {
    const [expandedMenus, setExpandedMenus] = useState({
        caja: true // Mantener caja expandido por defecto para que el usuario lo vea
    });

    const toggleSubmenu = (itemId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleItemClick = (item) => {
        if (item.submenu) {
            toggleSubmenu(item.id);
        } else {
            setActiveItem(item.id);
        }
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
            >
                <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen ? 0 : -280,
                    width: 260
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`fixed left-0 top-0 h-full bg-white shadow-lg z-40 flex flex-col
          lg:translate-x-0 lg:static lg:z-auto`}
                style={{ width: 260 }}
            >
                {/* Logo / Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Sistema POS</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded lg:hidden"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeItem === item.id;
                            const isExpanded = expandedMenus[item.id];
                            const hasSubmenu = item.submenu && item.submenu.length > 0;

                            if (item.isHeader) {
                                return (
                                    <li key={item.id} className="px-3 py-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => handleItemClick(item)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
                      ${isActive || isExpanded
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${isActive || isExpanded ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </div>
                                        {item.hasSubmenu && (
                                            hasSubmenu && isExpanded ? (
                                                <ChevronDown className={`w-4 h-4 ${isActive || isExpanded ? 'text-blue-400' : 'text-gray-300'}`} />
                                            ) : (
                                                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
                                            )
                                        )}
                                    </button>

                                    {/* Submenu */}
                                    <AnimatePresence>
                                        {hasSubmenu && isExpanded && (
                                            <motion.ul
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden ml-4 mt-1 space-y-1 border-l-2 border-blue-100"
                                            >
                                                {item.submenu.map((subItem) => {
                                                    const SubIcon = subItem.icon;
                                                    const isSubActive = activeItem === subItem.id;

                                                    return (
                                                        <motion.li
                                                            key={subItem.id}
                                                            initial={{ x: -10, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ duration: 0.15 }}
                                                        >
                                                            <button
                                                                onClick={() => setActiveItem(subItem.id)}
                                                                className={`w-full flex items-center gap-2 pl-4 pr-3 py-2 rounded-r-lg transition-all duration-200
                                  ${isSubActive
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                                    }`}
                                                            >
                                                                <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                                                <span className="text-sm">{subItem.label}</span>
                                                            </button>
                                                        </motion.li>
                                                    );
                                                })}
                                            </motion.ul>
                                        )}
                                    </AnimatePresence>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-100 flex flex-col items-center gap-1">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic opacity-50">Horizon 2026</p>
                    <span className="bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-600/20">v1.1.0</span>
                </div>
            </motion.aside>
        </>
    );
}

export default Sidebar;
