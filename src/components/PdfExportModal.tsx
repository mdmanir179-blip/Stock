import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle,
  Building2,
  Layers,
} from 'lucide-react';
import {
  ProductStockViewItem,
  SalesPerformanceItem,
  OpenPoViewItem,
  InventoryMetrics,
} from '../types/inventory';
import { generateInventoryPdf } from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: InventoryMetrics;
  stockItems: ProductStockViewItem[];
  salesItems: SalesPerformanceItem[];
  poItems: OpenPoViewItem[];
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  stockItems,
  salesItems,
  poItems,
}) => {
  const [includeStock, setIncludeStock] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includePo, setIncludePo] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const cities = Array.from(new Set(stockItems.map((i) => i.cityOrFacility).filter(Boolean))).sort();

  const filteredStock = selectedCity === 'all'
    ? stockItems
    : stockItems.filter((i) => i.cityOrFacility === selectedCity);

  const filteredSales = selectedCity === 'all'
    ? salesItems
    : salesItems.filter((i) => i.city === selectedCity);

  const filteredPo = selectedCity === 'all'
    ? poItems
    : poItems.filter((i) => i.city === selectedCity || i.facilityName.includes(selectedCity));

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateInventoryPdf(metrics, filteredStock, filteredSales, filteredPo, {
          includeStockTable: includeStock,
          includeSalesTable: includeSales,
          includePoTable: includePo,
          filterCity: selectedCity !== 'all' ? selectedCity : undefined,
        });
        onClose();
      } finally {
        setIsGenerating(false);
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Download Warehouse PDF Audit
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Official stock availability & PO report
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Section check options */}
          <div className="space-y-2">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[10px]">
              Select Sections to Include
            </span>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Section A: Stock & Out-of-Stock Audit
              </span>
              <input
                type="checkbox"
                checked={includeStock}
                onChange={(e) => setIncludeStock(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Section B: Sales, Brand & Date Intelligence
              </span>
              <input
                type="checkbox"
                checked={includeSales}
                onChange={(e) => setIncludeSales(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Section C: Open Purchase Orders (PO Tracker)
              </span>
              <input
                type="checkbox"
                checked={includePo}
                onChange={(e) => setIncludePo(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
            </label>
          </div>

          {/* City / Hub Selector */}
          <div>
            <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1 uppercase tracking-wider text-[10px]">
              Location Scope
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Cities & Facilities ({cities.length} Hubs)</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city} Hub Only
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Report will be generated in landscape A4 format with live warehouse KPIs, out-of-stock highlights, and open PO urgency indicators.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating || (!includeStock && !includeSales && !includePo)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
