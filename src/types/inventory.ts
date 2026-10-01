/**
 * WH stock Tracker - Domain Data Types
 */

// Dataset 1: Warehouse Stock & Availability Record
export interface WhStockRecord {
  id: string;
  cityName: string;
  itemName: string;
  itemCode: string;
  mrp: number;
  salesPrice: number;
  whAvailability: number; // percentage (e.g. 98.5%)
  whDOH: number; // Days On Hand
  podAvailability: number; // percentage (e.g. 94.2%)
  sales: number; // total units or sales volume
  salesDate?: string; // YYYY-MM-DD
  brandName?: string; // Brand extracted or matched
  fillRate: number; // percentage (e.g. 95.0%)
  coverage: number; // coverage days or percentage
  podStock: number; // Stock at Point of Delivery / POD
  whStock: number; // Stock at Warehouse
  availableStock: number; // whStock + podStock
  isOutOfStock: boolean;
  stockAbility: number; // composite stock ability / availability %
}

// Dataset 2 & 3: Facility Inventory & Open PO Record
export interface FacilitySkuRecord {
  id: string;
  storageType: string; // e.g. Ambient, Cold, Frozen
  facilityName: string; // e.g. Central Hub Dhaka, Chittagong DC
  city: string;
  skuCode: string;
  skuDescription: string;
  l1: string; // Category L1
  l2: string; // Sub-Category L2
  shelfLifeDays: number;
  businessCategory: string; // e.g. Core, Long Tail, Seasonal
  daysOnHand: number;
  potentialGmvLoss: number; // Currency value risk from stockout
  openPos: number | string; // Number of open POs or PO status
  poNumber?: string; // e.g. PO-883492
  openPoQuantity: number;
  warehouseQtyAvailable: number;
  expectedDate?: string;
  vendorName?: string;
}

// Unified Product Inventory Item for View A (Stock & Out of Stock)
export interface ProductStockViewItem {
  id: string;
  productName: string;
  skuCode: string;
  cityOrFacility: string;
  whStock: number;
  podStock: number;
  availableStock: number;
  isOutOfStock: boolean;
  stockAbility: number; // percentage (0-100%)
  daysOnHand: number;
  coverage: number;
  storageType?: string;
  potentialLoss?: number;
  hasOpenPo: boolean;
  openPoQty: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Critical';
}

// Unified Sales Performance Item for View B (Sales with Product, Brand, Qty, Date)
export interface SalesPerformanceItem {
  id: string;
  productName: string;
  brandName: string;
  skuCode: string;
  category: string;
  city: string;
  salesQuantity: number;
  unitPrice: number;
  totalSalesValue: number;
  salesDate: string; // e.g. 2026-03-28
  fillRate: number; // percentage
  mrp: number;
}

// Unified Open PO Item for View C (Open POs, PO Number, Facility, SKU Description, Category)
export interface OpenPoViewItem {
  id: string;
  openPosCount: number;
  poNumber: string;
  facilityName: string;
  city: string;
  skuCode: string;
  skuDescription: string;
  categoryL1: string;
  subCategoryL2: string;
  openPoQuantity: number;
  storageType: string;
  daysOnHand: number;
  potentialGmvLoss: number;
  warehouseQtyAvailable: number;
  expectedDeliveryDate?: string;
  status: 'Urgent' | 'Pending' | 'In-Transit' | 'Overdue';
}

// Overall Aggregated KPI Summary
export interface InventoryMetrics {
  totalSkus: number;
  totalWhStock: number;
  totalPodStock: number;
  totalAvailableStock: number;
  outOfStockCount: number;
  outOfStockRate: number; // percentage
  averageStockAbility: number; // percentage
  totalSalesUnits: number;
  totalSalesRevenue: number;
  totalOpenPos: number;
  totalOpenPoQuantity: number;
  totalPotentialGmvLoss: number;
  averageDaysOnHand: number;
}

// Tab navigation options
export type ActiveTab = 'dashboard' | 'stock' | 'sales' | 'openpo' | 'upload' | 'pdf';
