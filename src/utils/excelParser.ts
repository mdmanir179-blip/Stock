import * as XLSX from 'xlsx';
import { WhStockRecord, FacilitySkuRecord } from '../types/inventory';

// Clean and normalize column names for fuzzy header matching
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper to safely parse numeric values (handles strings like "1,200", "98.5%", "$45.00")
function parseNumeric(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

// Helper to extract brand name from product name if brand is not provided
function guessBrand(itemName: string): string {
  if (!itemName) return 'Generic';
  const parts = itemName.trim().split(/\s+/);
  if (parts.length > 0) {
    if (['Aarong', 'Fortune', 'Radhuni', 'Nestle', 'Pran', 'Dano', 'Savlon', 'Teer', 'Horlicks', 'Sensodyne', 'Ispahani', 'Kazi', 'Ruchi', 'Fresh', 'Bashundhara'].includes(parts[0])) {
      return parts[0];
    }
    return parts[0];
  }
  return 'General';
}

export interface ParsedExcelResult {
  whRecords: WhStockRecord[];
  facilityRecords: FacilitySkuRecord[];
  sheetsFound: string[];
  totalRowsProcessed: number;
  fileName: string;
}

/**
 * Parses any uploaded Excel (.xlsx, .xls, .csv) file
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const whRecords: WhStockRecord[] = [];
  const facilityRecords: FacilitySkuRecord[] = [];
  let totalRows = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) continue;

    for (let i = 0; i < rawRows.length; i++) {
      const rawRow = rawRows[i];
      totalRows++;

      // Create a map of normalized column names to row values
      const row: Record<string, any> = {};
      for (const key of Object.keys(rawRow)) {
        row[normalizeKey(key)] = rawRow[key];
      }

      // Helper to check multiple key aliases
      const getField = (aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined && row[alias] !== '') {
            return row[alias];
          }
        }
        return undefined;
      };

      const openPosVal = getField([
        'openpos', 'openpo', 'open_pos', 'open_po', 'openorders', 'openposcount',
        'pos', 'po_count', 'activepos', 'active_pos', 'activepo', 'openpurchaseorders',
        'open_purchase_orders', 'open_purchase_order', 'open_pos_count'
      ]);
      const openPoQtyVal = getField([
        'openpoquantity', 'openpoqty', 'poquantity', 'poqty', 'open_po_quantity',
        'open_po_qty', 'inboundqty', 'inbound_qty', 'inboundquantity', 'pendingpoqty', 'po_units',
        'openquantity', 'po_quantity'
      ]);
      const poNumberVal = getField([
        'ponumber', 'po_number', 'po#', 'pono', 'po_no', 'po', 'purchaseorder', 'purchase_order',
        'purchaseordernumber', 'purchase_order_number', 'purchaseorderno', 'poid', 'order_no',
        'orderno', 'ordernumber', 'order_number', 'docnumber', 'documentnumber', 'doc_no', 'docno'
      ]);
      const facilityNameVal = getField([
        'facilityname', 'facility', 'facility_name', 'warehouse', 'warehousename', 'warehouse_name', 'dc', 'dcname', 'dc_name', 'hub', 'hubname'
      ]);
      const storageTypeVal = getField([
        'storagetype', 'storage_type', 'storage', 'temperature', 'temptype'
      ]);
      const potentialGmvLossVal = getField([
        'potentialgmvloss', 'potential_gmv_loss', 'gmvloss', 'gmv_loss', 'loss', 'potentialloss', 'lossrisk'
      ]);
      const skuDescVal = getField([
        'skudescription', 'sku_description', 'itemname', 'item_name', 'productname', 'product_description', 'description', 'item', 'product'
      ]);
      const skuCodeVal = getField([
        'skucode', 'sku_code', 'itemcode', 'item_code', 'sku', 'code', 'materialcode', 'material'
      ]);
      const l1Val = getField([
        'l1', 'category', 'categoryl1', 'category_l1', 'maincategory', 'businesscategory', 'dept', 'department'
      ]);
      const l2Val = getField([
        'l2', 'subcategory', 'categoryl2', 'category_l2', 'sub_category'
      ]);

      // Check if row has Format 1 characteristics (WhStock, PodStock, ItemName, WhAvailability, etc.)
      const hasFormat1 =
        row['itemname'] !== undefined ||
        row['itemcode'] !== undefined ||
        row['whstock'] !== undefined ||
        row['podstock'] !== undefined ||
        row['fillrate'] !== undefined;

      // Check if row has Format 2/3 characteristics (StorageType, FacilityName, SkuCode, OpenPos, etc.)
      const hasFormat2 =
        storageTypeVal !== undefined ||
        facilityNameVal !== undefined ||
        openPosVal !== undefined ||
        openPoQtyVal !== undefined ||
        poNumberVal !== undefined ||
        potentialGmvLossVal !== undefined ||
        (skuDescVal !== undefined && l1Val !== undefined);

      // Parse Format 1
      if (hasFormat1 || (!hasFormat2 && row['cityname'])) {
        const itemName = String(row['itemname'] || skuDescVal || `Item-${i + 1}`).trim();
        const itemCode = String(row['itemcode'] || skuCodeVal || `SKU-${1000 + i}`).trim();
        const cityName = String(row['cityname'] || row['city'] || 'Central Hub').trim();
        const whStock = parseNumeric(row['whstock'] || row['warehouseqtyavailable'] || row['warehousestock'] || row['stock']);
        const podStock = parseNumeric(row['podstock'] || row['podqty']);
        const availableStock = whStock + podStock;
        const mrp = parseNumeric(row['mrp'], 100);
        const salesPrice = parseNumeric(row['salesprice'] || row['sellingprice'], mrp * 0.95);
        const sales = parseNumeric(row['sales'] || row['salesqty'] || row['quantitysold'], 0);
        const whDOH = parseNumeric(row['whdoh'] || row['daysonhand'], Math.max(0, Math.round(availableStock / (sales > 0 ? sales / 30 : 1))));
        const coverage = parseNumeric(row['coverage'] || row['coveragedays'], whDOH);

        let whAvailability = parseNumeric(row['whavailability'] || row['stockability'], availableStock > 0 ? 95 : 0);
        if (whAvailability <= 1 && whAvailability > 0) whAvailability = Math.round(whAvailability * 100);

        let podAvailability = parseNumeric(row['podavailability'], podStock > 0 ? 90 : 0);
        if (podAvailability <= 1 && podAvailability > 0) podAvailability = Math.round(podAvailability * 100);

        let fillRate = parseNumeric(row['fillrate'], availableStock > 0 ? 92 : 0);
        if (fillRate <= 1 && fillRate > 0) fillRate = Math.round(fillRate * 100);

        const brandName = String(row['brandname'] || row['brand'] || guessBrand(itemName)).trim();
        const salesDate = row['salesdate'] || row['date'] || new Date().toISOString().split('T')[0];

        whRecords.push({
          id: `upload-wh-${sheetName}-${i}-${Date.now()}`,
          cityName,
          itemName,
          itemCode,
          mrp,
          salesPrice,
          whAvailability,
          whDOH,
          podAvailability,
          sales,
          salesDate: String(salesDate),
          brandName,
          fillRate,
          coverage,
          podStock,
          whStock,
          availableStock,
          isOutOfStock: availableStock <= 0,
          stockAbility: whAvailability,
        });
      }

      // Parse Format 2 & 3 (Facility Inventory & Open PO Records)
      if (hasFormat2 || (!hasFormat1 && skuCodeVal)) {
        const skuCode = String(skuCodeVal || `SKU-${1000 + i}`).trim();
        const skuDescription = String(skuDescVal || `SKU Description ${i + 1}`).trim();
        const city = String(row['city'] || row['cityname'] || 'Central Hub').trim();
        const facilityName = String(facilityNameVal || `${city} Fulfillment Hub`).trim();
        const storageType = String(storageTypeVal || 'Ambient').trim();
        const l1 = String(l1Val || 'General').trim();
        const l2 = String(l2Val || 'FMCG').trim();
        const shelfLifeDays = parseNumeric(row['shelflifedays'] || row['shelflife'], 365);
        const businessCategory = String(row['businesscategory'] || 'Core').trim();
        const daysOnHand = parseNumeric(row['daysonhand'] || row['doh'], 14);
        const potentialGmvLoss = parseNumeric(potentialGmvLossVal, daysOnHand === 0 ? 50000 : 0);

        // Robust Open PO and Quantity extraction
        let openPoQuantity = parseNumeric(openPoQtyVal, 0);
        let openPosCount = 0;
        let poNumber = poNumberVal !== undefined && poNumberVal !== null ? String(poNumberVal).trim() : '';

        if (openPosVal !== undefined && openPosVal !== null && openPosVal !== '') {
          if (typeof openPosVal === 'number') {
            if (openPosVal >= 20) {
              // Large number represents a numeric PO ID (e.g. SAP 4500129384)
              if (!poNumber) poNumber = String(openPosVal);
              openPosCount = 1;
            } else {
              openPosCount = openPosVal;
            }
          } else {
            const rawStr = String(openPosVal).trim();
            const parsed = parseNumeric(rawStr, NaN);
            if (!isNaN(parsed) && parsed > 0 && parsed < 20) {
              openPosCount = parsed;
            } else if (rawStr && rawStr !== '0' && rawStr.toLowerCase() !== 'none' && rawStr.toLowerCase() !== 'no') {
              // Real string PO Number (e.g. "PO-2024-001", "4500129384", "PO-101, PO-102")
              if (!poNumber) {
                poNumber = rawStr;
              }
              const poListCount = rawStr.split(/[,;\/]+/).filter(Boolean).length;
              openPosCount = poListCount > 1 ? poListCount : 1;
            }
          }
        }

        // If open quantity exists or PO number exists, ensure openPosCount is at least 1
        if ((openPoQuantity > 0 || (poNumber && poNumber.toLowerCase() !== 'none' && poNumber !== '')) && openPosCount === 0) {
          openPosCount = 1;
        }

        if (!poNumber || poNumber.toLowerCase() === 'none' || poNumber === '') {
          if (openPosCount > 0 || openPoQuantity > 0) {
            poNumber = `PO-2026-${1000 + i}`;
          } else {
            poNumber = 'None';
          }
        }

        const warehouseQtyAvailable = parseNumeric(row['warehouseqtyavailable'] || row['whstock'] || row['stock'], 0);
        const expectedDate = String(row['expecteddate'] || (openPosCount > 0 ? '2026-04-05' : '-')).trim();

        facilityRecords.push({
          id: `upload-fac-${sheetName}-${i}-${Date.now()}`,
          storageType,
          facilityName,
          city,
          skuCode,
          skuDescription,
          l1,
          l2,
          shelfLifeDays,
          businessCategory,
          daysOnHand,
          potentialGmvLoss,
          openPos: openPosCount > 0 ? (poNumber !== 'None' ? poNumber : openPosCount) : 0,
          poNumber,
          openPoQuantity,
          warehouseQtyAvailable,
          expectedDate,
        });
      }
    }
  }

  return {
    whRecords,
    facilityRecords,
    sheetsFound: workbook.SheetNames,
    totalRowsProcessed: totalRows,
    fileName: file.name,
  };
}

/**
 * Downloads a ready-to-use Sample Excel Workbook (.xlsx) with both Dataset Formats
 */
export function downloadSampleExcelWorkbook() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Format 1 Data
  const sheet1Data = [
    {
      CityName: 'Mumbai',
      ItemName: 'Fortune Sunlite Refined Sunflower Oil 5L',
      ItemCode: 'SKU-OIL-501',
      Mrp: 850,
      SalesPrice: 799,
      WhAvailability: '96.5%',
      WhDOH: 18,
      PodAvailability: '92.0%',
      Sales: 1450,
      FillRate: '98.2%',
      Coverage: 21,
      PodStock: 240,
      'Wh Stock': 1850,
      BrandName: 'Fortune',
      SalesDate: '2026-03-31',
    },
    {
      CityName: 'Bengaluru',
      ItemName: 'Amul Taaza Homogenised Toned Milk 1L',
      ItemCode: 'SKU-MLK-102',
      Mrp: 72,
      SalesPrice: 68,
      WhAvailability: '45.0%',
      WhDOH: 3,
      PodAvailability: '40.0%',
      Sales: 3200,
      FillRate: '72.5%',
      Coverage: 4,
      PodStock: 120,
      'Wh Stock': 350,
      BrandName: 'Amul',
      SalesDate: '2026-03-31',
    },
    {
      CityName: 'Delhi NCR',
      ItemName: 'Tata Sampann Unpolished Toor Dal 1kg',
      ItemCode: 'SKU-DAL-401',
      Mrp: 195,
      SalesPrice: 179,
      WhAvailability: '0.0%',
      WhDOH: 0,
      PodAvailability: '0.0%',
      Sales: 820,
      FillRate: '24.0%',
      Coverage: 0,
      PodStock: 0,
      'Wh Stock': 0,
      BrandName: 'Tata Sampann',
      SalesDate: '2026-03-30',
    },
    {
      CityName: 'Kolkata',
      ItemName: 'Dabur Honey 100% Pure 1kg Jar',
      ItemCode: 'SKU-HNY-301',
      Mrp: 430,
      SalesPrice: 395,
      WhAvailability: '88.0%',
      WhDOH: 14,
      PodAvailability: '85.0%',
      Sales: 1100,
      FillRate: '94.0%',
      Coverage: 16,
      PodStock: 180,
      'Wh Stock': 920,
      BrandName: 'Dabur',
      SalesDate: '2026-03-30',
    },
    {
      CityName: 'Chennai',
      ItemName: 'Britannia Good Day Butter Cookies 600g',
      ItemCode: 'SKU-CKI-101',
      Mrp: 140,
      SalesPrice: 125,
      WhAvailability: '0.0%',
      WhDOH: 0,
      PodAvailability: '0.0%',
      Sales: 1950,
      FillRate: '15.0%',
      Coverage: 0,
      PodStock: 0,
      'Wh Stock': 0,
      BrandName: 'Britannia',
      SalesDate: '2026-03-29',
    },
  ];

  // Sheet 2: Format 2 & 3 Data
  const sheet2Data = [
    {
      StorageType: 'Ambient',
      FacilityName: 'Bhiwandi Central Mega Hub',
      City: 'Mumbai',
      SkuCode: 'SKU-OIL-501',
      SkuDescription: 'Fortune Sunlite Refined Sunflower Oil 5L',
      L1: 'Grocery & Staples',
      L2: 'Edible Oils',
      ShelfLifeDays: 365,
      BusinessCategory: 'Core Top Seller',
      DaysOnHand: 18,
      PotentialGmvLoss: 0,
      OpenPos: 'PO-MUM-2026-0981',
      PoNumber: 'PO-MUM-2026-0981',
      OpenPoQuantity: 2500,
      WarehouseQtyAvailable: 1850,
    },
    {
      StorageType: 'Cold Storage (2-8°C)',
      FacilityName: 'Whitefield Cold Chain Center',
      City: 'Bengaluru',
      SkuCode: 'SKU-MLK-102',
      SkuDescription: 'Amul Taaza Homogenised Toned Milk 1L',
      L1: 'Dairy & Fresh',
      L2: 'Fresh Milk',
      ShelfLifeDays: 120,
      BusinessCategory: 'Daily Essentials',
      DaysOnHand: 3,
      PotentialGmvLoss: 35000,
      OpenPos: 'PO-BLR-2026-1044',
      PoNumber: 'PO-BLR-2026-1044',
      OpenPoQuantity: 5000,
      WarehouseQtyAvailable: 350,
    },
    {
      StorageType: 'Ambient',
      FacilityName: 'Kundli Logistics Park',
      City: 'Delhi NCR',
      SkuCode: 'SKU-DAL-401',
      SkuDescription: 'Tata Sampann Unpolished Toor Dal 1kg',
      L1: 'Grocery & Staples',
      L2: 'Pulses & Dals',
      ShelfLifeDays: 360,
      BusinessCategory: 'Core Top Seller',
      DaysOnHand: 0,
      PotentialGmvLoss: 98000,
      OpenPos: 'PO-DEL-2026-0899',
      PoNumber: 'PO-DEL-2026-0899',
      OpenPoQuantity: 1800,
      WarehouseQtyAvailable: 0,
    },
    {
      StorageType: 'Ambient',
      FacilityName: 'Sriperumbudur Distribution Hub',
      City: 'Chennai',
      SkuCode: 'SKU-CKI-101',
      SkuDescription: 'Britannia Good Day Butter Cookies 600g',
      L1: 'Biscuits & Snacks',
      L2: 'Cookies',
      ShelfLifeDays: 180,
      BusinessCategory: 'High Velocity',
      DaysOnHand: 0,
      PotentialGmvLoss: 65000,
      OpenPos: 2,
      PoNumber: 'PO-2026-1120',
      OpenPoQuantity: 4000,
      WarehouseQtyAvailable: 0,
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);

  XLSX.utils.book_append_sheet(wb, ws1, 'Warehouse_POD_Stock');
  XLSX.utils.book_append_sheet(wb, ws2, 'Facility_OpenPO_Inventory');

  XLSX.writeFile(wb, 'WH_Stock_Tracker_Sample_Template.xlsx');
}
