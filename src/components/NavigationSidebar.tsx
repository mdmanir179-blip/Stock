import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  FileSpreadsheet,
  Upload,
  FileText,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ActiveTab, InventoryMetrics } from '../types/inventory';
import { BrandLogo } from './BrandLogo';

interface NavigationSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  metrics: InventoryMetrics;
  isDark: boolean;
  toggleTheme: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  onResetDemo: () => void;
  onDownloadTemplate: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (val: boolean) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  isDark,
  toggleTheme,
  isFullscreen,
  toggleFullscreen,
  isCollapsed,
  setIsCollapsed,
  onResetDemo,
  onDownloadTemplate,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      sublabel: 'Executive Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Stock & Availability',
      sublabel: 'View A: POD & Stock Ability',
      icon: Boxes,
      badge: metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} OOS` : undefined,
      badgeUrgent: metrics.outOfStockCount > 0,
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales Intelligence',
      sublabel: 'View B: Product, Brand & Date',
      icon: TrendingUp,
      count: metrics.totalSalesUnits > 0 ? metrics.totalSalesUnits.toLocaleString() : undefined,
    },
    {
      id: 'openpo' as ActiveTab,
      label: 'Open PO Tracker',
      sublabel: 'View C: PO#, Facility & SKU',
      icon: FileSpreadsheet,
      badge: metrics.totalOpenPos > 0 ? `${metrics.totalOpenPos} Open` : undefined,
    },
    {
      id: 'upload' as ActiveTab,
      label: 'Upload Excel',
      sublabel: 'Instant File Sync',
      icon: Upload,
    },
    {
      id: 'pdf' as ActiveTab,
      label: 'Audit PDF Report',
      sublabel: 'Export Official Summary',
      icon: FileText,
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Collapse Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <BrandLogo collapsed={isCollapsed} size="md" />

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {!isCollapsed && 'Navigation & Views'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500/30 dark:bg-amber-950/40'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-neutral-500 group-hover:text-neutral-800 dark:text-neutral-400 dark:group-hover:text-neutral-200'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.badgeUrgent
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.count && (
                        <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                          {item.count}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate font-normal">
                      {item.sublabel}
                    </div>
                  </div>
                )}

                {/* Active indicator dot when collapsed */}
                {isCollapsed && isActive && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}

          {/* Out of Stock Alert Warning Card */}
          {!isCollapsed && metrics.outOfStockCount > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Stockout Risk Alert
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 leading-snug">
                    <span className="font-bold">{metrics.outOfStockCount}</span> SKUs have 0 stock. Potential GMV loss: ₹{metrics.totalPotentialGmvLoss.toLocaleString('en-IN')}.
                  </div>
                  <button
                    onClick={() => handleNavClick('stock')}
                    className="mt-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline"
                  >
                    Review Critical SKUs →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Utilities */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 shrink-0">
          {!isCollapsed ? (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={onDownloadTemplate}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                title="Download standard Excel format (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
              <button
                onClick={onResetDemo}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                title="Clear all currently loaded data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Data</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 items-center">
              <button
                onClick={onDownloadTemplate}
                className="w-10 h-10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                title="Download Template"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Theme & Fullscreen controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700/80 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${
                isCollapsed ? 'w-full justify-center p-2' : ''
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />}
              {!isCollapsed && <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>}
            </button>

            {!isCollapsed && (
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
