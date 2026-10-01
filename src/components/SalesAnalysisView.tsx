import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Tag,
  TrendingUp,
  Download,
  ArrowUpDown,
  Building2,
  DollarSign,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SalesPerformanceItem } from '../types/inventory';

interface SalesAnalysisViewProps {
  salesItems: SalesPerformanceItem[];
  onOpenPdfModal: () => void;
}

export const SalesAnalysisView: React.FC<SalesAnalysisViewProps> = ({
  salesItems,
  onOpenPdfModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortField, setSortField] = useState<keyof SalesPerformanceItem>('totalSalesValue');
  const [sortAsc, setSortAsc] = useState(false);

  // Extract unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(salesItems.map((i) => i.brandName).filter(Boolean)));
    return list.sort();
  }, [salesItems]);

  // Extract unique cities
  const cities = useMemo(() => {
    const list = Array.from(new Set(salesItems.map((i) => i.city).filter(Boolean)));
    return list.sort();
  }, [salesItems]);

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    return salesItems
      .filter((item) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = item.productName.toLowerCase().includes(term);
          const matchBrand = item.brandName.toLowerCase().includes(term);
          const matchSku = item.skuCode.toLowerCase().includes(term);
          if (!matchName && !matchBrand && !matchSku) return false;
        }

        if (selectedBrand !== 'all' && item.brandName !== selectedBrand) return false;
        if (selectedCity !== 'all' && item.city !== selectedCity) return false;

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
  }, [salesItems, searchTerm, selectedBrand, selectedCity, sortField, sortAsc]);

  const toggleSort = (field: keyof SalesPerformanceItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for revenue/quantity
    }
  };

  const handleExportCsv = () => {
    const data = filteredItems.map((item) => ({
      'Product Name': item.productName,
      'Brand Name': item.brandName,
      'SKU Code': item.skuCode,
      'Quantity Sold': item.salesQuantity,
      'Unit Price': item.unitPrice,
      'Total Sales Value': item.totalSalesValue,
      'Sales Date': item.salesDate,
      'Order Fill Rate (%)': `${item.fillRate}%`,
      City: item.city,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales_Analysis');
    XLSX.writeFile(wb, `Sales_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalQuantity = filteredItems.reduce((acc, cur) => acc + cur.salesQuantity, 0);
  const totalRevenue = filteredItems.reduce((acc, cur) => acc + cur.totalSalesValue, 0);
  const avgFillRate =
    filteredItems.length > 0
      ? (filteredItems.reduce((acc, cur) => acc + cur.fillRate, 0) / filteredItems.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider">
            <span>SECTION B</span>
            <span aria-hidden="true">·</span>
            <span>COMMERCIAL VELOCITY</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
            Sales & Demand Intelligence
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Detailed breakdown with product name, brand name, quantity sold, transaction dates, and revenue metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Total Quantity Sold</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
            {totalQuantity.toLocaleString()} <span className="text-xs font-normal text-neutral-500">units</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
            ₹ {totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Average Order Fill Rate</span>
            <span className="text-xs font-bold text-neutral-400">Service Level</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
            {avgFillRate}%
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search product name, brand or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Hubs / Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main High-Density Sales Data Table */}
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
              <th
                onClick={() => toggleSort('brandName')}
                className="py-3 px-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Brand Name</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">SKU Code</th>
              <th
                onClick={() => toggleSort('salesQuantity')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white font-bold"
              >
                <div className="flex items-center justify-end gap-1 text-neutral-900 dark:text-white">
                  <span>Quantity Sold</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th
                onClick={() => toggleSort('totalSalesValue')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white font-bold"
              >
                <div className="flex items-center justify-end gap-1 text-neutral-900 dark:text-white">
                  <span>Total Sales Value</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('salesDate')}
                className="py-3 px-3 text-center cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Transaction Date</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Fill Rate</th>
              <th className="py-3 px-4 text-center">City / Hub</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <TrendingUp className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    <span>No sales records match your filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  {/* Product Name */}
                  <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    <div className="truncate max-w-xs md:max-w-md">{item.productName}</div>
                  </td>

                  {/* Brand Name */}
                  <td className="py-3 px-3">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {item.brandName}
                    </span>
                  </td>

                  {/* SKU Code */}
                  <td className="py-3 px-3 text-center font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                    {item.skuCode}
                  </td>

                  {/* Quantity Sold */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-900 dark:text-neutral-100">
                    {item.salesQuantity.toLocaleString('en-IN')}
                  </td>

                  {/* Unit Price */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-300">
                    ₹ {item.unitPrice.toLocaleString('en-IN')}
                  </td>

                  {/* Total Sales Value */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                    ₹ {item.totalSalesValue.toLocaleString('en-IN')}
                  </td>

                  {/* Sales Date */}
                  <td className="py-3 px-3 text-center font-mono text-neutral-600 dark:text-neutral-400 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      {item.salesDate}
                    </span>
                  </td>

                  {/* Fill Rate */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        item.fillRate >= 90
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : item.fillRate >= 60
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {item.fillRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* City */}
                  <td className="py-3 px-4 text-center text-neutral-600 dark:text-neutral-300">
                    {item.city}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span>Showing {filteredItems.length} of {salesItems.length} sales line items</span>
        <span>All financial figures aligned with tabular-num precision</span>
      </div>
    </div>
  );
};
