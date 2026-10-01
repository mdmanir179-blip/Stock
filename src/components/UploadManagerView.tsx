import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  FileCheck,
} from 'lucide-react';
import { parseExcelFile, ParsedExcelResult } from '../utils/excelParser';
import { WhStockRecord, FacilitySkuRecord } from '../types/inventory';

interface UploadManagerViewProps {
  onApplyData: (whRecords: WhStockRecord[], facilityRecords: FacilitySkuRecord[], mode: 'replace' | 'append') => void;
  onDownloadTemplate: () => void;
  onResetDemo: () => void;
  currentWhCount: number;
  currentFacCount: number;
}

export const UploadManagerView: React.FC<UploadManagerViewProps> = ({
  onApplyData,
  onDownloadTemplate,
  onResetDemo,
  currentWhCount,
  currentFacCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedExcelResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const result = await parseExcelFile(file);
      if (result.whRecords.length === 0 && result.facilityRecords.length === 0) {
        setErrorMsg(
          'No valid rows or recognized headers found in this file. Please verify column headers or use our sample template.'
        );
      } else {
        setParsedResult(result);
      }
    } catch (err: any) {
      setErrorMsg(`Failed to parse file: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleCommit = () => {
    if (!parsedResult) return;
    onApplyData(parsedResult.whRecords, parsedResult.facilityRecords, importMode);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider">
              <span>INSTANT EXCEL SYNC</span>
              <span aria-hidden="true">·</span>
              <span>MULTI-SHEET RECOGNITION</span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
              Upload Warehouse Excel / CSV File
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Upload your Excel file to immediately refresh all stock availability, POD stocks, sales velocities, and open purchase orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Download Excel Template</span>
            </button>
            <button
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Clear all currently loaded data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-10 md:p-14 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[1.005]'
            : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-neutral-50/60 dark:hover:bg-neutral-850/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
          <Upload className="w-7 h-7" />
        </div>

        <h3 className="text-base font-bold text-neutral-900 dark:text-white text-center">
          {isProcessing ? 'Analyzing and parsing file...' : 'Drop your Excel or CSV file here, or click to browse'}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center max-w-md">
          Supports .xlsx, .xls and .csv. Automatically detects multi-sheet workbooks containing Warehouse & POD Stocks or Facility Open PO inventories.
        </p>

        <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
          <span>Supported schemas: Format 1 (WhStock / POD) & Format 2/3 (OpenPos / SKU)</span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Upload Notice:</strong> {errorMsg}
          </div>
        </div>
      )}

      {/* Parsed Result & Commit Preview */}
      {parsedResult && (
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  File Parsed Successfully: <span className="font-mono text-amber-600 dark:text-amber-400">{parsedResult.fileName}</span>
                </h4>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sheets detected: {parsedResult.sheetsFound.join(', ')} · Total rows processed: {parsedResult.totalRowsProcessed}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
              >
                <option value="replace">Replace Current Inventory</option>
                <option value="append">Append to Current Inventory</option>
              </select>

              <button
                onClick={handleCommit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Apply to Dashboard</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Dataset 1: Warehouse & POD Stock Items
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                {parsedResult.whRecords.length} <span className="text-xs font-normal text-neutral-500">records</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Maps to View A (Product Name, Wh Stock, POD Stock, Available Stock, Stock Ability) and View B (Sales with date & brand).
              </div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Dataset 2 & 3: Facility SKUs & Open POs
              </div>
              <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                {parsedResult.facilityRecords.length} <span className="text-xs font-normal text-neutral-500">records</span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Maps to View C (Open POs, PO Number, Facility Name, SKU Description, Category, Potential GMV Loss).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Column Schema Reference */}
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          Accepted Column Headers Reference
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <span>Dataset 1: Warehouse & POD Stock</span>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">13 Columns</span>
            </div>
            <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
              CityName, ItemName, ItemCode, Mrp, SalesPrice, WhAvailability, WhDOH, PodAvailability, Sales, FillRate, Coverage, PodStock, Wh Stock
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <span>Dataset 2 & 3: Facility Inventory & Open POs</span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">14 Columns</span>
            </div>
            <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
              StorageType, FacilityName, City, SkuCode, SkuDescription, L1, L2, ShelfLifeDays, BusinessCategory, DaysOnHand, PotentialGmvLoss, OpenPos, OpenPoQuantity, WarehouseQtyAvailable
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
