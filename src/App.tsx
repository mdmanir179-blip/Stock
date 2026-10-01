/**
 * WH stock Tracker - Main Application Entry
 * Complete warehouse inventory, POD availability, sales intelligence & open PO tracking system.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  WhStockRecord,
  FacilitySkuRecord,
  ProductStockViewItem,
  SalesPerformanceItem,
  OpenPoViewItem,
  InventoryMetrics,
} from './types/inventory';
import { INITIAL_WH_RECORDS, INITIAL_FACILITY_RECORDS } from './utils/demoData';
import { downloadSampleExcelWorkbook } from './utils/excelParser';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardOverview } from './components/DashboardOverview';
import { StockAnalysisView } from './components/StockAnalysisView';
import { SalesAnalysisView } from './components/SalesAnalysisView';
import { OpenPoTrackerView } from './components/OpenPoTrackerView';
import { UploadManagerView } from './components/UploadManagerView';
import { PdfReportView } from './components/PdfReportView';
import { PdfExportModal } from './components/PdfExportModal';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Clear legacy demo storage if present
  useEffect(() => {
    try {
      localStorage.removeItem('wh_stock_records_v1');
      localStorage.removeItem('wh_facility_records_v1');
    } catch (e) {
      // ignore
    }
  }, []);

  // Inventory Data State - starts completely empty as requested by user
  const [whRecords, setWhRecords] = useState<WhStockRecord[]>(() => {
    try {
      const saved = localStorage.getItem('wh_user_uploaded_stock_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load uploaded wh records', e);
    }
    return [];
  });

  const [facilityRecords, setFacilityRecords] = useState<FacilitySkuRecord[]>(() => {
    try {
      const saved = localStorage.getItem('wh_user_uploaded_fac_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load uploaded facility records', e);
    }
    return [];
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wh_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme with HTML root and body class
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) {
        body.classList.add('dark');
        body.setAttribute('data-theme', 'dark');
      }
      localStorage.setItem('wh_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('wh_theme', 'light');
    }
  }, [isDark]);

  // Persist user-uploaded records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wh_user_uploaded_stock_v2', JSON.stringify(whRecords));
    } catch (e) {
      console.warn('LocalStorage full, skipped saving whRecords', e);
    }
  }, [whRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('wh_user_uploaded_fac_v2', JSON.stringify(facilityRecords));
    } catch (e) {
      console.warn('LocalStorage full, skipped saving facilityRecords', e);
    }
  }, [facilityRecords]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed', err);
      });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  // Clear all data
  const handleResetDemo = useCallback(() => {
    setWhRecords([]);
    setFacilityRecords([]);
    try {
      localStorage.removeItem('wh_user_uploaded_stock_v2');
      localStorage.removeItem('wh_user_uploaded_fac_v2');
    } catch (e) {
      // ignore
    }
    showToast('All warehouse inventory records cleared.');
  }, []);

  // Download Sample Excel Template
  const handleDownloadTemplate = useCallback(() => {
    downloadSampleExcelWorkbook();
    showToast('Sample Excel workbook downloaded with both dataset schemas.');
  }, []);

  // Apply parsed Excel data (replace or append)
  const handleApplyData = useCallback(
    (newWh: WhStockRecord[], newFac: FacilitySkuRecord[], mode: 'replace' | 'append') => {
      if (mode === 'replace') {
        setWhRecords(newWh);
        setFacilityRecords(newFac);
      } else {
        if (newWh.length > 0) setWhRecords((prev) => [...prev, ...newWh]);
        if (newFac.length > 0) setFacilityRecords((prev) => [...prev, ...newFac]);
      }

      showToast(
        `Successfully loaded ${newWh.length} Warehouse items & ${newFac.length} Facility records!`
      );
      setActiveTab('stock');
    },
    []
  );

  // 1. Compute Section A: Product Stock & Out of Stock Analysis
  const stockItems = useMemo<ProductStockViewItem[]>(() => {
    // Index facility records by skuCode or description for fast matching
    const facMap = new Map<string, FacilitySkuRecord>();
    for (const fac of facilityRecords) {
      facMap.set(fac.skuCode.toLowerCase(), fac);
      facMap.set(fac.skuDescription.toLowerCase(), fac);
    }

    const items: ProductStockViewItem[] = [];

    // Map through whRecords
    for (const wh of whRecords) {
      const matchedFac = facMap.get(wh.itemCode.toLowerCase()) || facMap.get(wh.itemName.toLowerCase());
      const available = wh.availableStock;
      const isOos = available <= 0;
      const doh = wh.whDOH || (matchedFac ? matchedFac.daysOnHand : 0);
      const openPoQty = matchedFac ? matchedFac.openPoQuantity : 0;
      const hasPo = matchedFac ? Number(matchedFac.openPos) > 0 || matchedFac.openPoQuantity > 0 : false;

      let status: ProductStockViewItem['status'] = 'In Stock';
      if (isOos) {
        status = 'Out of Stock';
      } else if (available < 500 || doh < 5) {
        status = 'Low Stock';
      }

      items.push({
        id: wh.id,
        productName: wh.itemName,
        skuCode: wh.itemCode,
        cityOrFacility: wh.cityName,
        whStock: wh.whStock,
        podStock: wh.podStock,
        availableStock: available,
        isOutOfStock: isOos,
        stockAbility: wh.stockAbility,
        daysOnHand: doh,
        coverage: wh.coverage,
        storageType: matchedFac?.storageType || 'Ambient',
        potentialLoss: matchedFac?.potentialGmvLoss || 0,
        hasOpenPo: hasPo,
        openPoQty: openPoQty,
        status,
      });
    }

    // Add any facilityRecords that might not be in whRecords
    const whCodes = new Set(whRecords.map((w) => w.itemCode.toLowerCase()));
    for (const fac of facilityRecords) {
      if (!whCodes.has(fac.skuCode.toLowerCase())) {
        const available = fac.warehouseQtyAvailable;
        const isOos = available <= 0;
        let status: ProductStockViewItem['status'] = 'In Stock';
        if (isOos) {
          status = 'Out of Stock';
        } else if (available < 500 || fac.daysOnHand < 5) {
          status = 'Low Stock';
        }

        items.push({
          id: fac.id,
          productName: fac.skuDescription,
          skuCode: fac.skuCode,
          cityOrFacility: fac.facilityName || fac.city,
          whStock: fac.warehouseQtyAvailable,
          podStock: 0,
          availableStock: available,
          isOutOfStock: isOos,
          stockAbility: isOos ? 0 : 92.0,
          daysOnHand: fac.daysOnHand,
          coverage: fac.daysOnHand,
          storageType: fac.storageType,
          potentialLoss: fac.potentialGmvLoss,
          hasOpenPo: Number(fac.openPos) > 0,
          openPoQty: fac.openPoQuantity,
          status,
        });
      }
    }

    return items;
  }, [whRecords, facilityRecords]);

  // 2. Compute Section B: Sales Performance Items (with Product, Brand, Qty, Date)
  const salesItems = useMemo<SalesPerformanceItem[]>(() => {
    return whRecords.map((wh) => {
      const qty = wh.sales || 0;
      const unitPrice = wh.salesPrice > 0 ? wh.salesPrice : wh.mrp;
      const totalRev = Math.round(qty * unitPrice);

      return {
        id: `sales-${wh.id}`,
        productName: wh.itemName,
        brandName: wh.brandName || 'Brand',
        skuCode: wh.itemCode,
        category: 'Fast Moving Consumer Goods',
        city: wh.cityName,
        salesQuantity: qty,
        unitPrice: Math.round(unitPrice),
        totalSalesValue: totalRev,
        salesDate: wh.salesDate || new Date().toISOString().split('T')[0],
        fillRate: wh.fillRate,
        mrp: wh.mrp,
      };
    });
  }, [whRecords]);

  // 3. Compute Section C: Open PO Items (Open POs, PO Number, Facility, SKU Description, Category)
  const poItems = useMemo<OpenPoViewItem[]>(() => {
    return facilityRecords.map((fac, idx) => {
      // 1. Raw PO number from record if already parsed
      let poNum = String(fac.poNumber || '').trim();

      // 2. Check if openPos field contained the PO number or a count
      const rawOpenPos = fac.openPos !== undefined && fac.openPos !== null ? String(fac.openPos).trim() : '';
      const parsedOpenPosNum = Number(rawOpenPos);
      let openCount = 0;

      if (!isNaN(parsedOpenPosNum) && parsedOpenPosNum > 0 && parsedOpenPosNum < 20) {
        // Typical small count (e.g. 1, 2, 3 open POs)
        openCount = parsedOpenPosNum;
      } else if (rawOpenPos && rawOpenPos !== '0' && rawOpenPos.toLowerCase() !== 'none' && rawOpenPos.toLowerCase() !== 'no') {
        // Long numeric ID (e.g. 4500123984) or alphanumeric code -> Real PO Number!
        if (!poNum || poNum.toLowerCase() === 'none' || poNum.toLowerCase() === 'no po') {
          poNum = rawOpenPos;
        }
        openCount = 1;
      }

      // Check if item has open order status
      const hasOpen = openCount > 0 || fac.openPoQuantity > 0 || (Boolean(poNum) && poNum.toLowerCase() !== 'none' && poNum !== '');
      const finalOpenCount = openCount > 0 ? openCount : (hasOpen ? 1 : 0);

      // Keep full PO Number, never truncate or replace user-specified PO numbers
      let finalPoNum = 'None';
      if (hasOpen) {
        if (poNum && poNum.toLowerCase() !== 'none' && poNum !== '') {
          finalPoNum = poNum;
        } else {
          finalPoNum = `PO-2026-${1100 + idx}`;
        }
      }

      let status: OpenPoViewItem['status'] = 'Pending';
      if (fac.daysOnHand === 0 || fac.potentialGmvLoss > 50000) {
        status = 'Urgent';
      } else if (finalOpenCount > 1) {
        status = 'In-Transit';
      }

      return {
        id: `po-${fac.id}`,
        openPosCount: finalOpenCount,
        poNumber: finalPoNum,
        facilityName: fac.facilityName,
        city: fac.city,
        skuCode: fac.skuCode,
        skuDescription: fac.skuDescription,
        categoryL1: fac.l1 || 'General',
        subCategoryL2: fac.l2 || 'Staples',
        openPoQuantity: fac.openPoQuantity,
        storageType: fac.storageType,
        daysOnHand: fac.daysOnHand,
        potentialGmvLoss: fac.potentialGmvLoss,
        warehouseQtyAvailable: fac.warehouseQtyAvailable,
        expectedDeliveryDate: fac.expectedDate || '2026-04-05',
        status,
      };
    });
  }, [facilityRecords]);

  // 4. Compute Unified Executive KPI Metrics
  const metrics = useMemo<InventoryMetrics>(() => {
    const totalSkus = stockItems.length;
    const totalWhStock = stockItems.reduce((acc, cur) => acc + cur.whStock, 0);
    const totalPodStock = stockItems.reduce((acc, cur) => acc + cur.podStock, 0);
    const totalAvailableStock = totalWhStock + totalPodStock;
    const outOfStockCount = stockItems.filter((i) => i.isOutOfStock).length;
    const outOfStockRate = totalSkus > 0 ? Math.round((outOfStockCount / totalSkus) * 100) : 0;

    const avgStockAbility =
      totalSkus > 0
        ? Math.round(stockItems.reduce((acc, cur) => acc + cur.stockAbility, 0) / totalSkus)
        : 0;

    const totalSalesUnits = salesItems.reduce((acc, cur) => acc + cur.salesQuantity, 0);
    const totalSalesRevenue = salesItems.reduce((acc, cur) => acc + cur.totalSalesValue, 0);

    const totalOpenPos = poItems.filter(
      (p) => p.openPosCount > 0 || p.openPoQuantity > 0 || (p.poNumber && p.poNumber !== 'None')
    ).length;
    const totalOpenPoQuantity = poItems.reduce((acc, cur) => acc + cur.openPoQuantity, 0);
    const totalPotentialGmvLoss = poItems.reduce((acc, cur) => acc + cur.potentialGmvLoss, 0);

    const avgDoh =
      totalSkus > 0
        ? Math.round(stockItems.reduce((acc, cur) => acc + cur.daysOnHand, 0) / totalSkus)
        : 0;

    return {
      totalSkus,
      totalWhStock,
      totalPodStock,
      totalAvailableStock,
      outOfStockCount,
      outOfStockRate,
      averageStockAbility: avgStockAbility,
      totalSalesUnits,
      totalSalesRevenue,
      totalOpenPos,
      totalOpenPoQuantity,
      totalPotentialGmvLoss,
      averageDaysOnHand: avgDoh,
    };
  }, [stockItems, salesItems, poItems]);

  return (
    <div className={`${isDark ? 'dark ' : ''}min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-neutral-400 hover:text-white dark:hover:text-black"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onResetDemo={handleResetDemo}
        onDownloadTemplate={handleDownloadTemplate}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Viewport Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          metrics={metrics}
          isDark={isDark}
          toggleTheme={toggleTheme}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          onOpenPdfModal={() => setIsPdfModalOpen(true)}
          onOpenMobileNav={() => setIsOpenMobile(true)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              metrics={metrics}
              stockItems={stockItems}
              salesItems={salesItems}
              poItems={poItems}
              setActiveTab={setActiveTab}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
              onDownloadTemplate={handleDownloadTemplate}
            />
          )}

          {activeTab === 'stock' && (
            <StockAnalysisView
              stockItems={stockItems}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesAnalysisView
              salesItems={salesItems}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
            />
          )}

          {activeTab === 'openpo' && (
            <OpenPoTrackerView
              poItems={poItems}
              onOpenPdfModal={() => setIsPdfModalOpen(true)}
            />
          )}

          {activeTab === 'upload' && (
            <UploadManagerView
              onApplyData={handleApplyData}
              onDownloadTemplate={handleDownloadTemplate}
              onResetDemo={handleResetDemo}
              currentWhCount={whRecords.length}
              currentFacCount={facilityRecords.length}
            />
          )}

          {activeTab === 'pdf' && (
            <PdfReportView
              metrics={metrics}
              stockItems={stockItems}
              salesItems={salesItems}
              poItems={poItems}
            />
          )}
        </main>

        {/* Clean Footer */}
        <footer className="mt-auto px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">WH stock Tracker</span>
            <span>·</span>
            <span>Warehouse Supply Chain & PO Monitoring System</span>
          </div>
          <div className="font-mono text-[11px]">
            Vercel Ready · Multi-Sheet Excel Engine · Clean Tabular Typography
          </div>
        </footer>
      </div>

      {/* Quick PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        metrics={metrics}
        stockItems={stockItems}
        salesItems={salesItems}
        poItems={poItems}
      />
    </div>
  );
}
