import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  Eye,
  Layers,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ProductStockViewItem,
  SalesPerformanceItem,
  OpenPoViewItem,
  InventoryMetrics,
} from '../types/inventory';
import { generateInventoryPdf } from '../utils/pdfExport';

interface PdfReportViewProps {
  metrics: InventoryMetrics;
  stockItems: ProductStockViewItem[];
  salesItems: SalesPerformanceItem[];
  poItems: OpenPoViewItem[];
}

export const PdfReportView: React.FC<PdfReportViewProps> = ({
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

  // Extract cities
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
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider">
              <span>OFFICIAL AUDIT EXPORT</span>
              <span aria-hidden="true">·</span>
              <span>VECTOR PDF GENERATOR</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
              Warehouse Audit & Stock Report PDF
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Export high-resolution landscape PDF reports containing Stock & Availability, Sales Intelligence, and Open Purchase Orders.
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={isGenerating || (!includeStock && !includeSales && !includePo)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Rendering Document...' : 'Generate & Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Sections Selection */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            Include Audit Sections
          </h3>

          <div className="space-y-3">
            {/* Section A Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeStock}
                onChange={(e) => setIncludeStock(e.target.checked)}
                className="mt-1 w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
              <div className="text-xs">
                <div className="font-bold text-neutral-900 dark:text-white">
                  Section A: Product Stock & Availability Audit
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Product name, WH stock, POD stock, available stock, out-of-stock highlights, and stock ability % ({filteredStock.length} items).
                </div>
              </div>
            </label>

            {/* Section B Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSales}
                onChange={(e) => setIncludeSales(e.target.checked)}
                className="mt-1 w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
              <div className="text-xs">
                <div className="font-bold text-neutral-900 dark:text-white">
                  Section B: Sales & Velocity Intelligence
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Product name, brand name, quantity sold, transaction dates, and fill rate % ({filteredSales.length} lines).
                </div>
              </div>
            </label>

            {/* Section C Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includePo}
                onChange={(e) => setIncludePo(e.target.checked)}
                className="mt-1 w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500"
              />
              <div className="text-xs">
                <div className="font-bold text-neutral-900 dark:text-white">
                  Section C: Open Purchase Orders (PO Tracker)
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Open PO count, PO number, facility name, SKU description, and category ({filteredPo.length} lines).
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Filter Scope & Document Specifications */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            Regional Scope & Specifications
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Warehouse / City Scope
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

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                Document Layout & Security
              </div>
              <ul className="space-y-1 text-neutral-500 dark:text-neutral-400 list-disc list-inside">
                <li>Format: A4 Landscape (297mm × 210mm)</li>
                <li>Font: Helvetica with Tabular Aligned Numerals</li>
                <li>Header: WH stock Tracker Official Audit Banner</li>
                <li>Pagination: Automated Page Numbers & Timestamps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Card */}
      <div className="p-5 rounded-2xl bg-neutral-900 text-white border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-mono">REPORT SUMMARY PREVIEW</span>
          <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 bg-neutral-800/80 rounded-xl">
            <div className="text-[10px] text-neutral-400">Total SKUs</div>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
              {filteredStock.length}
            </div>
          </div>
          <div className="p-2.5 bg-neutral-800/80 rounded-xl">
            <div className="text-[10px] text-neutral-400">Available Stock</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {filteredStock.reduce((acc, c) => acc + c.availableStock, 0).toLocaleString()}
            </div>
          </div>
          <div className="p-2.5 bg-neutral-800/80 rounded-xl">
            <div className="text-[10px] text-neutral-400">Out of Stock</div>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
              {filteredStock.filter((i) => i.isOutOfStock).length} SKUs
            </div>
          </div>
          <div className="p-2.5 bg-neutral-800/80 rounded-xl">
            <div className="text-[10px] text-neutral-400">Inbound PO Qty</div>
            <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">
              +{filteredPo.reduce((acc, c) => acc + c.openPoQuantity, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
