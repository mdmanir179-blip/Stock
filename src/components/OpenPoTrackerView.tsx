import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowUpDown,
  Copy,
  Check,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { OpenPoViewItem } from '../types/inventory';

interface OpenPoTrackerViewProps {
  poItems: OpenPoViewItem[];
  onOpenPdfModal: () => void;
}

export const OpenPoTrackerView: React.FC<OpenPoTrackerViewProps> = ({
  poItems,
  onOpenPdfModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'openOnly' | 'urgentOnly'>('openOnly');
  const [sortField, setSortField] = useState<keyof OpenPoViewItem>('openPoQuantity');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedPo, setCopiedPo] = useState<string | null>(null);
  const [selectedPoItem, setSelectedPoItem] = useState<OpenPoViewItem | null>(null);

  const handleCopyPo = (po: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!po || po === 'None') return;
    navigator.clipboard?.writeText(po);
    setCopiedPo(po);
    setTimeout(() => {
      setCopiedPo((prev) => (prev === po ? null : prev));
    }, 1800);
  };

  // Extract unique categories (L1)
  const categories = useMemo(() => {
    const list = Array.from(new Set(poItems.map((p) => p.categoryL1).filter(Boolean)));
    return list.sort();
  }, [poItems]);

  // Extract unique facilities
  const facilities = useMemo(() => {
    const list = Array.from(new Set(poItems.map((p) => p.facilityName).filter(Boolean)));
    return list.sort();
  }, [poItems]);

  // Helper to determine if an item has an active open PO
  const isItemOpen = (item: OpenPoViewItem) => {
    return (
      item.openPosCount > 0 ||
      item.openPoQuantity > 0 ||
      (item.poNumber && item.poNumber !== 'None' && item.poNumber !== '')
    );
  };

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    return poItems
      .filter((item) => {
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchPo = item.poNumber.toLowerCase().includes(term);
          const matchDesc = item.skuDescription.toLowerCase().includes(term);
          const matchFacility = item.facilityName.toLowerCase().includes(term);
          const matchSku = item.skuCode.toLowerCase().includes(term);
          if (!matchPo && !matchDesc && !matchFacility && !matchSku) return false;
        }

        if (categoryFilter !== 'all' && item.categoryL1 !== categoryFilter) return false;
        if (facilityFilter !== 'all' && item.facilityName !== facilityFilter) return false;

        if (urgencyFilter === 'openOnly' && !isItemOpen(item)) return false;
        if (urgencyFilter === 'urgentOnly' && item.daysOnHand > 3 && item.potentialGmvLoss === 0) return false;

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
  }, [poItems, searchTerm, categoryFilter, facilityFilter, urgencyFilter, sortField, sortAsc]);

  const toggleSort = (field: keyof OpenPoViewItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending
    }
  };

  const handleExportCsv = () => {
    const data = filteredItems.map((item) => ({
      'PO Number': item.poNumber,
      'Open POs Count': item.openPosCount,
      'Facility Name': item.facilityName,
      'City': item.city,
      'SKU Description': item.skuDescription,
      'SKU Code': item.skuCode,
      'Category (L1)': item.categoryL1,
      'Sub-Category (L2)': item.subCategoryL2,
      'Open PO Quantity': item.openPoQuantity,
      'Warehouse Stock Available': item.warehouseQtyAvailable,
      'Days On Hand (DOH)': item.daysOnHand,
      'Potential GMV Loss': item.potentialGmvLoss,
      'Storage Type': item.storageType,
      'Expected Delivery Date': item.expectedDeliveryDate || 'Pending',
      Status: item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Open_PO_Report');
    XLSX.writeFile(wb, `Open_PO_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalOpenPosCount = filteredItems.filter(isItemOpen).length;
  const totalOpenQuantity = filteredItems.reduce((acc, cur) => acc + cur.openPoQuantity, 0);
  const totalPotentialLoss = filteredItems.reduce((acc, cur) => acc + cur.potentialGmvLoss, 0);
  const allOpenCount = poItems.filter(isItemOpen).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            <span>SECTION C</span>
            <span aria-hidden="true">·</span>
            <span>INBOUND SUPPLY CONTROL</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
            Open PO & Procurement Tracker
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor open POs, PO numbers, facility names, SKU descriptions, and product categories to prevent stockouts.
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
            <span className="text-xs font-medium">Active Open POs</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white mt-1">
            {totalOpenPosCount} <span className="text-xs font-normal text-neutral-500">Orders</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Pending Inbound Quantity</span>
            <span className="text-xs font-bold text-neutral-400">Pipeline</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            +{totalOpenQuantity.toLocaleString()} <span className="text-xs font-normal">units</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-medium">Potential GMV Loss at Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            ₹ {totalPotentialLoss.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search PO number, SKU description, facility..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Urgency selector */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              onClick={() => setUrgencyFilter('openOnly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                urgencyFilter === 'openOnly'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Open POs ({allOpenCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('urgentOnly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                urgencyFilter === 'urgentOnly'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Critical (0-3 DOH)
            </button>
            <button
              onClick={() => setUrgencyFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                urgencyFilter === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              All SKUs ({poItems.length})
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Facility Filter */}
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">All Facilities ({facilities.length})</option>
            {facilities.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main High-Density Open PO Data Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th
                onClick={() => toggleSort('poNumber')}
                className="py-3 px-4 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Full PO Number</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Open POs</th>
              <th
                onClick={() => toggleSort('facilityName')}
                className="py-3 px-3 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Facility Name</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('skuDescription')}
                className="py-3 px-4 cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>SKU Description</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-3">Category (L1 / L2)</th>
              <th
                onClick={() => toggleSort('openPoQuantity')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white font-bold"
              >
                <div className="flex items-center justify-end gap-1 text-neutral-900 dark:text-white">
                  <span>Open PO Quantity</span>
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Available Stock</th>
              <th
                onClick={() => toggleSort('daysOnHand')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DOH</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('potentialGmvLoss')}
                className="py-3 px-3 text-right cursor-pointer hover:text-neutral-900 dark:hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Potential GMV Loss</span>
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status / ETA</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    <span>No purchase order records match your active filters.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                    item.potentialGmvLoss > 0 ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {/* Full PO Number Display */}
                  <td className="py-3 px-4 min-w-[170px]">
                    {item.poNumber !== 'None' ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.poNumber.split(/[,;\/]+/).map((singlePo, pIdx) => {
                          const cleanPo = singlePo.trim();
                          if (!cleanPo) return null;
                          const isCopied = copiedPo === cleanPo;
                          return (
                            <div
                              key={pIdx}
                              className="group/po inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-amber-400 dark:hover:border-amber-500/60 transition-all select-all shadow-2xs"
                              title="Click copy button to copy full PO number"
                            >
                              <span className="font-mono font-bold text-xs tracking-tight text-neutral-900 dark:text-neutral-100">
                                {cleanPo}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyPo(cleanPo, e)}
                                className="p-0.5 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                                title="Copy full PO number"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-60 group-hover/po:opacity-100" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">No PO Assigned</span>
                    )}
                  </td>

                  {/* Open POs Count */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded ${
                        item.openPosCount > 0
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.openPosCount}
                    </span>
                  </td>

                  {/* Facility Name & City */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {item.facilityName}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {item.city} · {item.storageType}
                    </div>
                  </td>

                  {/* SKU Description */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs md:max-w-sm">
                      {item.skuDescription}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {item.skuCode}
                    </div>
                  </td>

                  {/* Category (L1 / L2) */}
                  <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                    <div>{item.categoryL1}</div>
                    <div className="text-[10px] text-neutral-400">{item.subCategoryL2}</div>
                  </td>

                  {/* Open PO Quantity */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold">
                    {item.openPoQuantity > 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400">
                        +{item.openPoQuantity.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </td>

                  {/* Warehouse Available Stock */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                    {item.warehouseQtyAvailable.toLocaleString()}
                  </td>

                  {/* Days On Hand */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        item.daysOnHand === 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : item.daysOnHand <= 7
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {item.daysOnHand}d
                    </span>
                  </td>

                  {/* Potential GMV Loss */}
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {item.potentialGmvLoss > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹ {item.potentialGmvLoss.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>

                  {/* Status / ETA */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                          : item.status === 'Overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                          : item.status === 'In-Transit'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.expectedDeliveryDate && item.expectedDeliveryDate !== '-' && (
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        ETA: {item.expectedDeliveryDate}
                      </div>
                    )}
                  </td>

                  {/* Inspect Details Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedPoItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
                      title="View complete PO and stock details"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
        <span>Showing {filteredItems.length} of {poItems.length} procurement line items</span>
        <span>Includes L1/L2 category breakdown and potential stockout loss values</span>
      </div>

      {/* PO Full Details Modal */}
      {selectedPoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Full Purchase Order Record
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  Purchase Order Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedPoItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PO Number Banner */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                  Full PO Number
                </div>
                <div className="text-lg font-mono font-extrabold text-neutral-900 dark:text-white select-all break-all">
                  {selectedPoItem.poNumber}
                </div>
              </div>
              {selectedPoItem.poNumber !== 'None' && (
                <button
                  type="button"
                  onClick={() => handleCopyPo(selectedPoItem.poNumber)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  {copiedPo === selectedPoItem.poNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full PO</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Facility / Hub</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {selectedPoItem.facilityName}
                </div>
                <div className="text-[11px] text-neutral-500">{selectedPoItem.city}</div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Storage Type</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {selectedPoItem.storageType}
                </div>
                <div className="text-[11px] text-neutral-500">Warehouse Environment</div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Status & ETA</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {selectedPoItem.status}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {selectedPoItem.expectedDeliveryDate && selectedPoItem.expectedDeliveryDate !== '-'
                    ? `ETA: ${selectedPoItem.expectedDeliveryDate}`
                    : 'Pending Inbound'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 col-span-2">
                <div className="text-[10px] text-neutral-400 font-medium">SKU Description & Code</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                  {selectedPoItem.skuDescription}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                  {selectedPoItem.skuCode} · Category: {selectedPoItem.categoryL1} / {selectedPoItem.subCategoryL2}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Open PO Quantity</div>
                <div className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  +{selectedPoItem.openPoQuantity.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-neutral-500">
                  Active POs: {selectedPoItem.openPosCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Available Stock</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5 font-mono">
                  {selectedPoItem.warehouseQtyAvailable.toLocaleString('en-IN')} pcs
                </div>
                <div className="text-[11px] text-neutral-500">DOH: {selectedPoItem.daysOnHand} days</div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="text-[10px] text-neutral-400 font-medium">Potential GMV Loss</div>
                <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5 font-mono">
                  {selectedPoItem.potentialGmvLoss > 0
                    ? `₹ ${selectedPoItem.potentialGmvLoss.toLocaleString('en-IN')}`
                    : '₹ 0 (Low Risk)'}
                </div>
                <div className="text-[11px] text-neutral-500">Stockout Financial Risk</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedPoItem(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
