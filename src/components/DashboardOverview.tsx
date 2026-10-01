import React, { useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Download,
  Upload,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ActiveTab,
  InventoryMetrics,
  ProductStockViewItem,
  OpenPoViewItem,
  SalesPerformanceItem,
} from '../types/inventory';

interface DashboardOverviewProps {
  metrics: InventoryMetrics;
  stockItems: ProductStockViewItem[];
  salesItems: SalesPerformanceItem[];
  poItems: OpenPoViewItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPdfModal: () => void;
  onDownloadTemplate: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  stockItems,
  salesItems,
  poItems,
  setActiveTab,
  onOpenPdfModal,
  onDownloadTemplate,
}) => {
  const oosItems = stockItems.filter((i) => i.isOutOfStock);
  const urgentPoItems = poItems.filter(
    (p) => p.openPosCount > 0 || p.openPoQuantity > 0 || (p.poNumber && p.poNumber !== 'None' && p.poNumber !== '')
  );

  // Group by city/facility for regional distribution
  const cityGroups = useMemo(() => {
    return stockItems.reduce<Record<string, { totalStock: number; whStock: number; podStock: number; oosCount: number; skus: number }>>(
      (acc, cur) => {
        const city = cur.cityOrFacility || 'Central Hub';
        if (!acc[city]) {
          acc[city] = { totalStock: 0, whStock: 0, podStock: 0, oosCount: 0, skus: 0 };
        }
        acc[city].totalStock += cur.availableStock;
        acc[city].whStock += cur.whStock;
        acc[city].podStock += cur.podStock;
        acc[city].skus += 1;
        if (cur.isOutOfStock) acc[city].oosCount += 1;
        return acc;
      },
      {}
    );
  }, [stockItems]);

  // Chart 1 Data: Sales Trends over Time
  const salesTrendsData = useMemo(() => {
    if (!salesItems || salesItems.length === 0) return [];

    const dateMap = new Map<string, { date: string; revenue: number; quantity: number }>();

    for (const item of salesItems) {
      const rawDate = item.salesDate || 'Recent';
      const existing = dateMap.get(rawDate) || { date: rawDate, revenue: 0, quantity: 0 };
      existing.revenue += item.totalSalesValue;
      existing.quantity += item.salesQuantity;
      dateMap.set(rawDate, existing);
    }

    // Sort chronologically
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [salesItems]);

  // Chart 2 Data: Inventory Distribution by Facility
  const facilityDistributionData = useMemo(() => {
    return Object.entries(cityGroups).map(([facility, data]) => ({
      facility,
      whStock: data.whStock,
      podStock: data.podStock,
      totalStock: data.totalStock,
      oosCount: data.oosCount,
    }));
  }, [cityGroups]);

  const hasData = stockItems.length > 0 || salesItems.length > 0 || poItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 text-white p-6 md:p-8 border border-neutral-800 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>LIVE WAREHOUSE INVENTORY ENGINE</span>
              <span aria-hidden="true">·</span>
              <span>INDIAN SUPPLY CHAIN (INR ₹)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Warehouse Stock, POD Availability & PO Operations
            </h2>
            <p className="text-sm text-neutral-300">
              Complete inventory control across primary fulfillment centers and delivery pods.
              Upload daily Excel workbooks to monitor stockouts, analyze sales demand over time, and expedite open purchase orders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Excel File</span>
            </button>
            <button
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs rounded-xl border border-neutral-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Banner if no records exist */}
      {!hasData && (
        <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              No Inventory Data Uploaded Yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upload your Excel or CSV spreadsheet containing warehouse stock, POD inventory, or open purchase orders to view live metrics and charts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Go to Excel Uploader</span>
            </button>
            <button
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Template (.xlsx)</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (6 metrics in INR ₹) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Available Stock */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Available Stock</span>
            <Boxes className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {metrics.totalAvailableStock.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            WH: <span className="font-semibold">{metrics.totalWhStock.toLocaleString('en-IN')}</span> · POD: <span className="font-semibold">{metrics.totalPodStock.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 2: Out of Stock */}
        <div
          onClick={() => setActiveTab('stock')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            metrics.outOfStockCount > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-medium">Out of Stock SKUs</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
            {metrics.outOfStockCount} <span className="text-xs font-normal">({metrics.outOfStockRate}%)</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600/80 dark:text-rose-400/80 flex items-center justify-between">
            <span>Critical stockout risk</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Avg Stock Ability */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Avg Stock Ability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {metrics.averageStockAbility}%
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Avg DOH: <span className="font-semibold">{metrics.averageDaysOnHand} Days</span>
          </div>
        </div>

        {/* Metric 4: Total Sales Units & Revenue */}
        <div
          onClick={() => setActiveTab('sales')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Total Sales Units</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {metrics.totalSalesUnits.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            Revenue: <span className="font-semibold text-neutral-800 dark:text-neutral-200">₹{metrics.totalSalesRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 5: Open POs & Quantity */}
        <div
          onClick={() => setActiveTab('openpo')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Open Purchase Orders</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
            {metrics.totalOpenPos} <span className="text-xs font-normal">POs</span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Inbound Qty: <span className="font-semibold">{metrics.totalOpenPoQuantity.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Metric 6: Potential GMV Loss */}
        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-medium">Potential GMV Loss</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
            ₹{metrics.totalPotentialGmvLoss.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            Across 0-DOH stockouts
          </div>
        </div>
      </div>

      {/* NEW CHARTS SECTION USING RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sales Trends over Time */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Sales Trends over Time
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Revenue (₹) and quantity velocity across transaction dates
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/40">
              INR ₹
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {salesTrendsData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-neutral-400 space-y-2 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                <Calendar className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                <span>No chronological sales records available yet. Upload sales data to view timeline trends.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrendsData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      const parts = String(val).split('-');
                      if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
                      return val;
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                      if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
                      return `₹${val}`;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-neutral-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl border border-neutral-700 text-xs space-y-1">
                            <div className="font-semibold text-neutral-300 border-b border-neutral-800 pb-1">
                              Date: {data.date}
                            </div>
                            <div className="font-mono text-amber-400 font-bold">
                              Revenue: ₹{Number(data.revenue).toLocaleString('en-IN')}
                            </div>
                            <div className="font-mono text-neutral-300 text-[11px]">
                              Quantity Sold: {Number(data.quantity).toLocaleString('en-IN')} units
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Sales Revenue (₹)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Inventory Distribution by Facility */}
        <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Inventory Distribution by Facility
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Stock allocation across Warehouse Racks and POD delivery centers
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-900/40">
              Units
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            {facilityDistributionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-neutral-400 space-y-2 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                <Building2 className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                <span>No regional warehouse records available yet. Upload facility data to view distribution.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={facilityDistributionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                  <XAxis
                    dataKey="facility"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      return String(val).length > 10 ? `${String(val).substring(0, 10)}..` : val;
                    }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return String(val);
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-neutral-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl border border-neutral-700 text-xs space-y-1">
                            <div className="font-semibold text-neutral-300 border-b border-neutral-800 pb-1">
                              {data.facility}
                            </div>
                            <div className="font-mono text-amber-400">
                              WH Stock: {Number(data.whStock).toLocaleString('en-IN')} units
                            </div>
                            <div className="font-mono text-indigo-400">
                              POD Stock: {Number(data.podStock).toLocaleString('en-IN')} units
                            </div>
                            <div className="font-mono font-bold text-white pt-0.5 border-t border-neutral-800">
                              Total Available: {Number(data.totalStock).toLocaleString('en-IN')} units
                            </div>
                            {data.oosCount > 0 && (
                              <div className="text-[11px] text-rose-400 font-semibold">
                                Stockouts: {data.oosCount} SKUs
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="whStock"
                    name="Warehouse Stock (WH)"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    stackId="stock"
                  />
                  <Bar
                    dataKey="podStock"
                    name="POD Delivery Stock"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    stackId="stock"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Out of Stock Immediate Action & Inbound Open POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Out of Stock Monitor (View A highlight) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Critical Stockout Monitor (Section A)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('stock')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({stockItems.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {oosItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              {stockItems.length === 0
                ? 'No stock items loaded yet. Upload your Excel sheet to monitor stockouts.'
                : 'All products currently have stock available. Excellent fill rate!'}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {oosItems.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {item.productName}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {item.skuCode} · {item.cityOrFacility}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 rounded">
                      0 Stock Available
                    </span>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {item.hasOpenPo ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Open PO: {item.openPoQty.toLocaleString('en-IN')} pcs
                        </span>
                      ) : (
                        <span className="text-rose-500 font-medium">No PO Active</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Inbound Open POs (View C highlight) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Active Open Purchase Orders (Section C)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('openpo')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All POs ({poItems.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentPoItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {poItems.length === 0
                ? 'No open purchase order records loaded yet.'
                : 'No open purchase orders pending at this time.'}
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {urgentPoItems.slice(0, 5).map((po) => (
                <div key={po.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700/80 select-all tracking-tight shrink-0">
                        {po.poNumber}
                      </span>
                      <span className="text-xs text-neutral-400 truncate">{po.facilityName}</span>
                    </div>
                    <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate mt-1">
                      {po.skuDescription}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Category: {po.categoryL1}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      +{po.openPoQuantity.toLocaleString('en-IN')} pcs
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {po.expectedDeliveryDate ? `ETA: ${po.expectedDeliveryDate}` : 'Pending Vendor'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Regional Warehouse Breakdown & Quick Workflow Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Distribution List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neutral-500" />
              Regional Fulfillment Hubs
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {Object.keys(cityGroups).length} Hubs Tracked
            </span>
          </div>

          {Object.keys(cityGroups).length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No regional facilities configured yet. Upload an inventory spreadsheet to populate fulfillment hubs.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(cityGroups).map(([cityName, data]) => {
                const stockPct =
                  metrics.totalAvailableStock > 0
                    ? Math.round((data.totalStock / metrics.totalAvailableStock) * 100)
                    : 0;

                return (
                  <div
                    key={cityName}
                    className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {cityName}
                      </span>
                      <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {stockPct}%
                      </span>
                    </div>

                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      <span>Stock: {data.totalStock.toLocaleString('en-IN')}</span>
                      {data.oosCount > 0 ? (
                        <span className="text-rose-500 font-bold">{data.oosCount} OOS</span>
                      ) : (
                        <span className="text-emerald-500">Normal</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Operations Guide */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Operational Workflows
          </h3>
          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 flex items-start gap-2">
              <span className="font-bold text-amber-600 shrink-0">1.</span>
              <span>
                <strong>Upload Excel:</strong> Drag & drop your daily warehouse sheet (.xlsx, .xls, .csv). Columns are mapped automatically.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 flex items-start gap-2">
              <span className="font-bold text-amber-600 shrink-0">2.</span>
              <span>
                <strong>Analyze Trends:</strong> Inspect stock availability, track chronological sales trends in INR (₹), and monitor inbound POs.
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 flex items-start gap-2">
              <span className="font-bold text-amber-600 shrink-0">3.</span>
              <span>
                <strong>Export Official PDF:</strong> Generate comprehensive audit reports with one click for executive reviews.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
