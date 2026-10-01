import React from 'react';
import {
  Menu,
  FileText,
  Upload,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  TrendingUp,
  Boxes,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { ActiveTab, InventoryMetrics } from '../types/inventory';

interface TopHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  metrics: InventoryMetrics;
  isDark: boolean;
  toggleTheme: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onOpenPdfModal: () => void;
  onOpenMobileNav: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  isDark,
  toggleTheme,
  isFullscreen,
  toggleFullscreen,
  onOpenPdfModal,
  onOpenMobileNav,
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: 'Real-time inventory health, stock availability & open PO overview',
    },
    stock: {
      title: 'Stock & Availability Audit',
      subtitle: 'Product stock, out-of-stock monitor, POD stock & stock ability (Section A)',
    },
    sales: {
      title: 'Sales & Velocity Intelligence',
      subtitle: 'Product name, brand name, quantity sold & transaction dates (Section B)',
    },
    openpo: {
      title: 'Open PO & Inbound Tracker',
      subtitle: 'Open POs, PO number, facility name, SKU description & category (Section C)',
    },
    upload: {
      title: 'Excel File Synchronizer',
      subtitle: 'Upload multi-sheet .xlsx, .xls or .csv to update inventory in real-time',
    },
    pdf: {
      title: 'Audit PDF Report',
      subtitle: 'Generate formatted inventory, sales & purchase order audit report',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      {/* Zone 1: Mobile Hamburger & Context Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="p-2 -ml-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-medium truncate">
            <span>WH stock Tracker</span>
            <span aria-hidden="true">/</span>
            <span className="text-amber-600 dark:text-amber-500 font-semibold">{current.title}</span>
          </div>
          <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white truncate">
            {current.title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Live Quick Metrics Chips (Hidden on small screens) */}
      <div className="hidden xl:flex items-center gap-4 text-xs font-mono tabular-nums">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
          <Boxes className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-neutral-500 dark:text-neutral-400">Total Stock:</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {metrics.totalAvailableStock.toLocaleString()}
          </span>
        </div>

        {metrics.outOfStockCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>OOS:</span>
            <span className="font-bold">{metrics.outOfStockCount} SKUs</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400">
            <span>Stock Health: 100%</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-neutral-500 dark:text-neutral-400">Open POs:</span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {metrics.totalOpenPos} ({metrics.totalOpenPoQuantity.toLocaleString()} pcs)
          </span>
        </div>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('upload')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors whitespace-nowrap"
          title="Upload Excel File (.xlsx)"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Excel</span>
        </button>

        <button
          onClick={onOpenPdfModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-sm transition-all whitespace-nowrap"
          title="Export Stock & Audit Report as PDF"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>

        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
