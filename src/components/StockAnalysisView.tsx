import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Boxes,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  Building2,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProductStockViewItem } from '../types/inventory';

interface StockAnalysisViewProps {
  stockItems: ProductStockViewItem[];
  onOpenPdfModal: () => void;
}

export const StockAnalysisView: React.FC<StockAnalysisViewProps> = ({
  stockItems,
  onOpenPdfModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'oos' | 'low' | 'healthy'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof ProductStockViewItem>('availableStock');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract unique cities
  const cities = useMemo(() => {
    const list = Array.from(new Set(stockItems.map((i) => i.cityOrFacility).filter(Boolean)));
    return list.sort();
  }, [stockItems]);

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    return stockItems
      .filter((item) => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchesName = item.productName.toLowerCase().includes(term);
          const matchesSku = item.skuCode.toLowerCase().includes(term);
          const matchesCity = item.cityOrFacility.toLowerCase().includes(term);
          if (!matchesName && !matchesSku && !matchesCity) return false;
        }

        // Status filter
        if (statusFilter === 'oos' && !item.isOutOfStock) return false;
        if (statusFilter === 'low' && (item.isOutOfStock || item.availableStock >= 500)) return false;
        if (statusFilter === 'healthy' && item.availableStock < 500) return false;

        // City filter
        if (cityFilter !== 'all' && item.cityOrFacility !== cityFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
  }, [stockItems, searchTerm, statusFilter, cityFilter, sortField, sortAsc]);

  const toggleSort = (field: keyof ProductStockViewItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  const handleExportCsv = () => {
    const data = filteredItems.map((i) => ({
      'Product Name': i.productName,
      'SKU Code': i.skuCode,
      'City / Facility': i.cityOrFacility,
      'Warehouse Stock': i.whStock,
      'POD Stock': i.podStock,
      'Available Stock': i.availableStock,
      'Out of Stock': i.isOutOfStock ? 'YES' : 'NO',
      'Stock Ability (%)': `${i.stockAbility}%`,
      'Days On Hand (DOH)': i.daysOnHand,
      'Coverage Days': i.coverage,
      Status: i.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock_Analysis');
    XLSX.writeFile(wb, `Stock_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const oosCount = stockItems.filter((i) => i.isOutOfStock).length;
  const totalAvailable = stockItems.reduce((acc, cur) => acc + cur.availableStock, 0);
  const totalWh = stockItems.reduce((acc, cur) => acc + cur.whStock, 0);
  const totalPod = stockItems.reduce((acc, cur) => acc + cur.podStock, 0);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider">
            <span>SECTION A</span>
            <span aria-hidden="true">·</span>
            <span>INVENTORY AUDIT</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
            Product Stock & Availability Tracker
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor product names, warehouse stock, POD stock, total available stock, stockout alerts, and stock ability percentages.
          </p>
        </div>

        {/* Quick summary stats in header */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            title="Export this table to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sheet</span>
          </button>
          <button
            onClick={onOpenPdfModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
          >
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* KPI mini-cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Total Available Stock
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-0.5">
            {totalAvailable.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            Warehouse (WH) Stock
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-0.5">
            {totalWh.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            POD Delivery Stock
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-0.5">
            {totalPod.toLocaleString()}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'oos' ? 'all' : 'oos')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'oos'
              ? 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <span>Out of Stock SKUs</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400 mt-0.5">
            {oosCount} SKUs
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search product name, SKU code, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Segmented Control */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All ({stockItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('oos')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'oos'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              Out of Stock ({oosCount})
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'low'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'healthy'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Healthy
            </button>
          </div>

          {/* City Dropdown */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Cities / Hubs</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main High-Density Stock Data Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => toggleSort('productName')}
                className="py-3 px-4 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Name</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">SKU Code</th>
              <th className="py-3 px-3">City / Hub</th>
              <th
                onClick={() => toggleSort('whStock')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>WH Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('podStock')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>POD Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('availableStock')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white font-bold"
              >
                <div className="flex items-center justify-end gap-1 text-neutral-900 dark:text-white">
                  <span>Available Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Out of Stock</th>
              <th
                onClick={() => toggleSort('stockAbility')}
                className="py-3 px-3 text-center cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Stock Ability</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">DOH</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Boxes className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    <span>No inventory records match the selected search or filter.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                      item.isOutOfStock ? 'bg-rose-50/40 dark:bg-rose-950/15' : ''
                    }`}
                  >
                    {/* Product Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs md:max-w-md">
                        {item.productName}
                      </div>
                      {item.hasOpenPo && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                          Inbound PO Active: +{item.openPoQty.toLocaleString()} units
                        </div>
                      )}
                    </td>

                    {/* SKU Code */}
                    <td className="py-3 px-3 text-center font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                      {item.skuCode}
                    </td>

                    {/* City / Hub */}
                    <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                      {item.cityOrFacility}
                    </td>

                    {/* Warehouse Stock */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {item.whStock.toLocaleString()}
                    </td>

                    {/* POD Stock */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                      {item.podStock.toLocaleString()}
                    </td>

                    {/* Total Available Stock */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                      <span
                        className={
                          item.availableStock === 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : item.availableStock < 500
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-neutral-900 dark:text-white'
                        }
                      >
                        {item.availableStock.toLocaleString()}
                      </span>
                    </td>

                    {/* Out of Stock Indicator */}
                    <td className="py-3 px-3 text-center">
                      {item.isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>OUT OF STOCK</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-mono text-xs">Available</span>
                      )}
                    </td>

                    {/* Stock Ability (%) */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.stockAbility >= 80
                                ? 'bg-emerald-500'
                                : item.stockAbility >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, item.stockAbility))}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {item.stockAbility.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* DOH */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      {item.daysOnHand}d
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Out of Stock'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : item.status === 'Low Stock'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span>Showing {filteredItems.length} of {stockItems.length} SKUs</span>
        <span>Table updates in real time upon Excel synchronization</span>
      </div>
    </div>
  );
};
