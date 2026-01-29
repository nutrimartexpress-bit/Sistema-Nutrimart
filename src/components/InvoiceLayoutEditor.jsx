
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  X, Save, RotateCcw, FileText, Grip, Grid3X3, MousePointer2,
  Settings2, Search, ChevronDown, ChevronRight, Eye, EyeOff,
  ZoomIn, ZoomOut, Maximize, Undo, Redo, Trash2,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  HelpCircle, Check
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// A4 dimensions in points
const A4_WIDTH_PT = 595;
const INVOICE_HEIGHT_PT = 420; // Half page

// Categories for the sidebar
const FIELD_CATEGORIES = {
  'Datos Generales': ['date', 'invoiceNumber', 'xMark'],
  'Cliente': ['clientName', 'ruc'],
  'Detalles': ['table'],
  'Montos': ['subtotal', 'vat', 'vat_2', 'total', 'amountText'],
};

// Default layout with enhanced properties
export const DEFAULT_LAYOUT = {
  date: { x: 40, y: 40, w: 100, label: 'Fecha', fontSize: 9, isVisible: true, textAlign: 'left', color: '#000000' },
  xMark: { x: 280, y: 40, w: 30, label: 'X', fontSize: 10, isVisible: true, fontWeight: 'bold', textAlign: 'center', color: '#000000' },
  invoiceNumber: { x: 450, y: 40, w: 100, label: 'N° Factura', fontSize: 10, isVisible: true, textAlign: 'right', color: '#000000' },
  clientName: { x: 40, y: 80, w: 300, label: 'Cliente', fontSize: 9, isVisible: true, fontWeight: 'bold', textAlign: 'left', color: '#000000' },
  ruc: { x: 40, y: 95, w: 150, label: 'RUC', fontSize: 9, isVisible: true, textAlign: 'left', color: '#000000' },
  table: { x: 40, y: 130, w: 500, label: 'Tabla Productos', fontSize: 9, isVisible: true, textAlign: 'left', color: '#000000' },
  amountText: { x: 40, y: 300, w: 400, label: 'Monto en Letras', fontSize: 8, isVisible: true, textAlign: 'left', color: '#000000' },
  subtotal: { x: 450, y: 300, w: 100, label: 'Subtotal', fontSize: 9, isVisible: true, textAlign: 'right', color: '#000000' },
  vat: { x: 450, y: 320, w: 100, label: 'IVA (5%)', fontSize: 9, isVisible: true, textAlign: 'right', color: '#000000' },
  vat_2: { x: 500, y: 320, w: 100, label: 'IVA (10%)', fontSize: 9, isVisible: true, textAlign: 'right', color: '#000000' },
  total: { x: 450, y: 340, w: 100, label: 'Total Gral', fontSize: 10, isVisible: true, fontWeight: 'bold', textAlign: 'right', color: '#000000' }
};

const PRESETS = {
  'Modern': {
    date: { x: 40, y: 40, fontSize: 10 },
    invoiceNumber: { x: 450, y: 40, fontSize: 12, fontWeight: 'bold' },
    clientName: { x: 40, y: 90, fontSize: 10, fontWeight: 'bold' },
    total: { x: 450, y: 350, fontSize: 12, fontWeight: 'bold' }
  },
  'Classic': {
    date: { x: 450, y: 60, fontSize: 9 },
    invoiceNumber: { x: 450, y: 40, fontSize: 10 },
    clientName: { x: 60, y: 100, fontSize: 9 },
    total: { x: 450, y: 340, fontSize: 10 }
  }
};

const InvoiceLayoutEditor = ({ isOpen, onClose, currentLayout, onSave, onGeneratePreview }) => {
  const { toast } = useToast();
  const constraintsRef = useRef(null);
  const containerRef = useRef(null);

  // State
  const [positions, setPositions] = useState(DEFAULT_LAYOUT);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoom, setZoom] = useState(130); // 130% default
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(Object.keys(FIELD_CATEGORIES));
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize layout
  useEffect(() => {
    if (isOpen) {
      const initialLayout = currentLayout && Object.keys(currentLayout).length > 0 ? currentLayout : DEFAULT_LAYOUT;
      const mergedLayout = { ...DEFAULT_LAYOUT, ...initialLayout };

      // Ensure all fields have necessary style props
      Object.keys(mergedLayout).forEach(key => {
        mergedLayout[key] = {
          ...DEFAULT_LAYOUT[key],
          ...mergedLayout[key],
          isVisible: mergedLayout[key].isVisible !== undefined ? mergedLayout[key].isVisible : true
        };
      });

      setPositions(mergedLayout);
      addToHistory(mergedLayout);
    }
  }, [isOpen, currentLayout]);

  // History Management
  const addToHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newState)));
    if (newHistory.length > 20) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPositions(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPositions(history[historyIndex + 1]);
    }
  };

  // Field Updates
  const updateField = (key, updates, recordHistory = true) => {
    const newPositions = {
      ...positions,
      [key]: { ...positions[key], ...updates }
    };
    setPositions(newPositions);
    if (recordHistory) addToHistory(newPositions);
  };

  const handleDragEnd = (key, info) => {
    const current = positions[key];
    let newX = current.x + info.offset.x / (zoom / 100);
    let newY = current.y + info.offset.y / (zoom / 100);

    if (snapToGrid) {
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;
    }

    // Bounds check
    newX = Math.max(0, Math.min(newX, A4_WIDTH_PT));
    newY = Math.max(0, Math.min(newY, INVOICE_HEIGHT_PT));

    updateField(key, { x: newX, y: newY });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      if (selectedItem) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          updateField(selectedItem, { isVisible: false });
        }

        const nudge = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          updateField(selectedItem, { y: positions[selectedItem].y - nudge });
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          updateField(selectedItem, { y: positions[selectedItem].y + nudge });
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateField(selectedItem, { x: positions[selectedItem].x - nudge });
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateField(selectedItem, { x: positions[selectedItem].x + nudge });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, positions, historyIndex, selectedItem]);

  const toggleCategory = (cat) => {
    if (expandedCategories.includes(cat)) {
      setExpandedCategories(expandedCategories.filter(c => c !== cat));
    } else {
      setExpandedCategories([...expandedCategories, cat]);
    }
  };

  const applyPreset = (presetName) => {
    if (confirm('¿Aplicar plantilla? Esto modificará posiciones no personalizadas.')) {
      const preset = PRESETS[presetName];
      if (!preset) return;

      const newLayout = { ...positions };
      Object.keys(preset).forEach(key => {
        newLayout[key] = { ...newLayout[key], ...preset[key] };
      });
      setPositions(newLayout);
      addToHistory(newLayout);
      toast({ description: `Plantilla ${presetName} aplicada` });
    }
  };

  const handleSave = () => {
    onSave(positions);
    toast({ title: "Guardado", description: "Diseño actualizado correctamente" });
    onClose();
  };

  // Wheel Zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      setZoom(prev => Math.min(Math.max(50, prev + delta * 20), 200));
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);


  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full h-full flex flex-col overflow-hidden"
          >
            {/* Top Bar */}
            <div className="h-16 px-6 border-b border-gray-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-30">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MousePointer2 className="w-5 h-5 text-blue-600" />
                  Editor
                </h2>

                <div className="h-6 w-px bg-gray-200 mx-2" />

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUndo} disabled={historyIndex <= 0}>
                        <Undo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                        <Redo className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg ml-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-mono w-10 text-center">{Math.round(zoom)}%</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="mr-4">
                  <select
                    className="text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => applyPreset(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Plantillas...</option>
                    {Object.keys(PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={snapToGrid ? "secondary" : "ghost"} size="sm" onClick={() => setSnapToGrid(!snapToGrid)}>
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Snap
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajustar a cuadrícula</TooltipContent>
                </Tooltip>

                <Button variant="outline" size="sm" onClick={() => setShowShortcuts(!showShortcuts)}>
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Atajos
                </Button>

                <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar (Fields) */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar campo..."
                      className="pl-8 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {Object.entries(FIELD_CATEGORIES).map(([category, keys]) => {
                    // Filter keys based on search
                    const validKeys = keys.filter(k =>
                      positions[k] &&
                      (positions[k].label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        k.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (validKeys.length === 0) return null;

                    const isExpanded = expandedCategories.includes(category);

                    return (
                      <div key={category} className="mb-2">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-md text-sm font-medium text-gray-700"
                        >
                          <span>{category}</span>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="ml-2 pl-2 border-l-2 border-gray-200 space-y-1 mt-1">
                            {validKeys.map(key => {
                              const field = positions[key];
                              const isSel = selectedItem === key;
                              return (
                                <div
                                  key={key}
                                  className={`
                                                        group flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors
                                                        ${isSel ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'}
                                                    `}
                                  onClick={() => setSelectedItem(key)}
                                >
                                  <span className="truncate flex-1">{field.label}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateField(key, { isVisible: !field.isVisible });
                                    }}
                                    className={`p-1 rounded-sm hover:bg-gray-200 ${!field.isVisible && 'text-gray-400'}`}
                                  >
                                    {field.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Canvas Area */}
              <div
                ref={containerRef}
                className="flex-1 bg-gray-200/50 overflow-auto flex justify-center items-center relative"
              >
                {/* Shortcuts Help Overlay */}
                {showShortcuts && (
                  <div className="absolute top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-xl border border-gray-200 text-sm w-64 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold">Atajos de Teclado</h3>
                      <Button variant="ghost" size="xs" onClick={() => setShowShortcuts(false)}><X className="w-3 h-3" /></Button>
                    </div>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex justify-between"><span>Guardar</span> <kbd className="bg-gray-100 px-1 rounded">Ctrl+S</kbd></li>
                      <li className="flex justify-between"><span>Deshacer</span> <kbd className="bg-gray-100 px-1 rounded">Ctrl+Z</kbd></li>
                      <li className="flex justify-between"><span>Eliminar</span> <kbd className="bg-gray-100 px-1 rounded">Del</kbd></li>
                      <li className="flex justify-between"><span>Mover</span> <kbd className="bg-gray-100 px-1 rounded">Flechas</kbd></li>
                      <li className="flex justify-between"><span>Mover Rápido</span> <kbd className="bg-gray-100 px-1 rounded">Shift+Arr</kbd></li>
                      <li className="flex justify-between"><span>Zoom</span> <kbd className="bg-gray-100 px-1 rounded">Ctrl+Scroll</kbd></li>
                    </ul>
                  </div>
                )}

                <div
                  ref={constraintsRef}
                  className="relative bg-white shadow-2xl transition-transform duration-100 ease-out origin-center"
                  style={{
                    width: `${A4_WIDTH_PT}px`,
                    height: `${INVOICE_HEIGHT_PT}px`, // Using exact PT size, scaled by zoom transform
                    transform: `scale(${zoom / 100})`,
                    backgroundImage: showGrid ?
                      `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`
                      : 'none',
                    backgroundSize: '10px 10px', // 10px Grid
                  }}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedItem(null);
                  }}
                >
                  {/* Visual Bounds/Guides */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-red-400 opacity-0 group-hover:opacity-50 pointer-events-none" />

                  {Object.entries(positions).map(([key, pos]) => {
                    if (!pos.isVisible) return null;
                    return (
                      <DraggableItem
                        key={key}
                        id={key}
                        position={pos}
                        scale={1} // Internal scale is 1, parent scales the div
                        zoom={zoom}
                        isSelected={selectedItem === key}
                        onSelect={() => setSelectedItem(key)}
                        onDragEnd={(info) => handleDragEnd(key, info)}
                        label={pos.label}
                        styles={pos}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Properties Panel (Right) */}
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 z-20">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Propiedades
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {selectedItem && positions[selectedItem] ? (
                    <div className="space-y-6 animate-in slide-in-from-right-2 fade-in duration-200">
                      {/* Header */}
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Campo Seleccionado</span>
                        <div className="text-xl font-bold text-gray-900">{positions[selectedItem].label}</div>
                        <div className="text-xs text-gray-500 font-mono mt-1">Key: {selectedItem}</div>
                      </div>

                      {/* Visibility */}
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <Label className="text-sm">Visible</Label>
                        <div
                          className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${positions[selectedItem].isVisible ? 'bg-blue-600' : 'bg-gray-300'}`}
                          onClick={() => updateField(selectedItem, { isVisible: !positions[selectedItem].isVisible })}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${positions[selectedItem].isVisible ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      {/* Position */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">X (pts)</Label>
                          <Input
                            type="number"
                            value={positions[selectedItem].x}
                            onChange={(e) => updateField(selectedItem, { x: parseInt(e.target.value) || 0 })}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Y (pts)</Label>
                          <Input
                            type="number"
                            value={positions[selectedItem].y}
                            onChange={(e) => updateField(selectedItem, { y: parseInt(e.target.value) || 0 })}
                            className="h-8"
                          />
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <Label className="text-sm font-semibold">Tipografía</Label>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Tamaño</Label>
                            <Input
                              type="number"
                              value={positions[selectedItem].fontSize || 9}
                              onChange={(e) => updateField(selectedItem, { fontSize: parseInt(e.target.value) || 9 })}
                              className="h-8"
                              min={6}
                              max={72}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block">Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={positions[selectedItem].color || '#000000'}
                                onChange={(e) => updateField(selectedItem, { color: e.target.value })}
                                className="h-8 w-8 p-0 border-0"
                              />
                              <span className="text-xs text-gray-500 font-mono uppercase">{positions[selectedItem].color}</span>
                            </div>
                          </div>
                        </div>

                        {/* Font Styles */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                          <Button
                            variant={positions[selectedItem].fontWeight === 'bold' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { fontWeight: positions[selectedItem].fontWeight === 'bold' ? 'normal' : 'bold' })}
                          >
                            <Bold className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={positions[selectedItem].fontStyle === 'italic' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { fontStyle: positions[selectedItem].fontStyle === 'italic' ? 'normal' : 'italic' })}
                          >
                            <Italic className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={positions[selectedItem].textDecoration === 'underline' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { textDecoration: positions[selectedItem].textDecoration === 'underline' ? 'none' : 'underline' })}
                          >
                            <Underline className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Alignment */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                          <Button
                            variant={positions[selectedItem].textAlign === 'left' || !positions[selectedItem].textAlign ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { textAlign: 'left' })}
                          >
                            <AlignLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={positions[selectedItem].textAlign === 'center' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { textAlign: 'center' })}
                          >
                            <AlignCenter className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={positions[selectedItem].textAlign === 'right' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 h-8"
                            onClick={() => updateField(selectedItem, { textAlign: 'right' })}
                          >
                            <AlignRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-6 mt-4 border-t border-gray-100">
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => updateField(selectedItem, { isVisible: false })}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Ocultar Campo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 opacity-60">
                      <MousePointer2 className="w-12 h-12 mb-4" />
                      <p>Selecciona un elemento en el lienzo para editar sus propiedades.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </TooltipProvider>
  );
};

const DraggableItem = ({ id, position, scale, zoom, onDragEnd, label, isSelected, onSelect, styles }) => {
  // Width heuristic
  const getWidthStyle = () => {
    if (id === 'table') return { width: `${position.w || 500}px`, height: `100px` };
    if (id === 'clientName' || id === 'amountText') return { width: `${position.w || 300}px` };
    return { width: 'auto', minWidth: `80px` };
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(e, info) => onDragEnd(info)}
      onTap={onSelect}
      // Use initial x/y to prevent framer motion fighting with state during controlled updates (undo/redo)
      // But animate for smoothness
      animate={{ x: position.x, y: position.y }}
      transition={{ duration: 0.1 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: isSelected ? 'grabbing' : 'grab',
        ...getWidthStyle(),
        zIndex: isSelected ? 100 : (id === 'table' ? 10 : 20),
      }}
      whileHover={{ scale: 1.02, zIndex: 30 }}
      whileDrag={{ scale: 1.05, opacity: 0.9, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)" }}
      className={`
                group
                flex items-center gap-1
                px-1 py-0.5
                border transition-all duration-200
                ${isSelected
          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
          : 'border-transparent hover:border-blue-300 hover:bg-blue-50/50'
        }
            `}
    >
      {/* Hover Tooltip for Pos */}
      <div className="absolute -top-6 left-0 bg-black text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
        x: {Math.round(position.x)}, y: {Math.round(position.y)}
      </div>

      {/* Content Preview */}
      <div
        className="w-full overflow-hidden"
        style={{
          fontSize: `${styles.fontSize || 9}px`,
          fontWeight: styles.fontWeight || 'normal',
          fontStyle: styles.fontStyle || 'normal',
          textDecoration: styles.textDecoration || 'none',
          textAlign: styles.textAlign || 'left',
          color: styles.color || '#000000',
          fontFamily: 'Helvetica, Arial, sans-serif',
          lineHeight: 1.2
        }}
      >
        {label}
      </div>

      {/* Table Area Indicator */}
      {id === 'table' && (
        <div className="absolute top-full left-0 w-full h-full border border-dashed border-gray-300 bg-gray-50/20 -z-10 flex items-center justify-center pointer-events-none">
          <span className="text-gray-300 text-[10px] font-bold tracking-widest uppercase">Area de Tabla</span>
        </div>
      )}
    </motion.div>
  );
};

export default InvoiceLayoutEditor;
