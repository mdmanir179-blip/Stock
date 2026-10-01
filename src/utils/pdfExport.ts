import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProductStockViewItem, SalesPerformanceItem, OpenPoViewItem, InventoryMetrics } from '../types/inventory';

export interface PdfExportOptions {
  includeStockTable?: boolean;
  includeSalesTable?: boolean;
  includePoTable?: boolean;
  filterCity?: string;
  filterStatus?: string;
}

export function generateInventoryPdf(
  metrics: InventoryMetrics,
  stockItems: ProductStockViewItem[],
  salesItems: SalesPerformanceItem[],
  poItems: OpenPoViewItem[],
  options: PdfExportOptions = {}
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const {
    includeStockTable = true,
    includeSalesTable = true,
    includePoTable = true,
  } = options;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 24, 'F');

  // Accent Line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 24, 297, 2, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('WH STOCK TRACKER', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Warehouse Operations, POD Availability & Supply Chain Audit Report', 14, 19);

  // Metadata Right Side
  doc.setFontSize(8);
  doc.text(`Generated: ${dateFormatted} at ${timeFormatted}`, 283, 13, { align: 'right' });
  doc.text(`System Status: Synchronized | Format: Official Audit`, 283, 19, { align: 'right' });

  // KPI Summary Bar
  let currentY = 32;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, currentY, 269, 18, 2, 2, 'FD');

  const kpis = [
    { label: 'Total SKUs', val: metrics.totalSkus.toLocaleString() },
    { label: 'Warehouse Stock', val: metrics.totalWhStock.toLocaleString() },
    { label: 'POD Stock', val: metrics.totalPodStock.toLocaleString() },
    { label: 'Available Stock', val: metrics.totalAvailableStock.toLocaleString() },
    { label: 'Out of Stock SKUs', val: `${metrics.outOfStockCount} (${metrics.outOfStockRate}%)` },
    { label: 'Avg Stock Ability', val: `${metrics.averageStockAbility}%` },
    { label: 'Total Open POs', val: `${metrics.totalOpenPos} (${metrics.totalOpenPoQuantity.toLocaleString()} pcs)` },
  ];

  const colWidth = 269 / kpis.length;
  kpis.forEach((kpi, idx) => {
    const xPos = 14 + idx * colWidth + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, xPos, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, xPos, currentY + 13);
  });

  currentY += 24;

  // SECTION A: Stock & Out-of-Stock Inventory
  if (includeStockTable) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SECTION A: PRODUCT STOCK & AVAILABILITY AUDIT', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Warehouse Stock, POD Stock, Available Stock, Out of Stock, Stock Ability', 14, currentY + 4);

    const stockTableRows = stockItems.map(item => [
      item.productName,
      item.skuCode,
      item.cityOrFacility,
      item.whStock.toLocaleString(),
      item.podStock.toLocaleString(),
      item.availableStock.toLocaleString(),
      `${item.stockAbility.toFixed(1)}%`,
      item.daysOnHand.toString(),
      item.status,
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Product Name', 'SKU Code', 'Facility / City', 'WH Stock', 'POD Stock', 'Total Available', 'Stock Ability', 'DOH', 'Status']],
      body: stockTableRows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          if (data.cell.raw === 'Out of Stock') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'Low Stock') {
            data.cell.styles.textColor = [217, 119, 6];
          } else if (data.cell.raw === 'In Stock') {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    currentY = (doc.lastAutoTable?.finalY || currentY + 30) + 10;
  }

  // Check if we need a new page for Section B
  if (includeSalesTable) {
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SECTION B: SALES & VELOCITY PERFORMANCE', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Sales with Product Name, Brand Name, Quantity, Date, Value and Order Fill Rate', 14, currentY + 4);

    const salesTableRows = salesItems.map(item => [
      item.productName,
      item.brandName,
      item.skuCode,
      item.salesQuantity.toLocaleString('en-IN'),
      `₹ ${item.unitPrice.toLocaleString('en-IN')}`,
      `₹ ${item.totalSalesValue.toLocaleString('en-IN')}`,
      item.salesDate,
      `${item.fillRate.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Product Name', 'Brand Name', 'SKU Code', 'Quantity Sold', 'Unit Price (INR)', 'Total Sales Value (INR)', 'Sales Date', 'Fill Rate']],
      body: salesTableRows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'center' },
        7: { halign: 'right' },
      },
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    currentY = (doc.lastAutoTable?.finalY || currentY + 30) + 10;
  }

  // Check if we need a new page for Section C
  if (includePoTable) {
    if (currentY > 150) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SECTION C: OPEN PURCHASE ORDERS & INBOUND SUPPLY', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Open POs, PO Number, Facility Name, SKU Description, Category, Open PO Qty & Risk', 14, currentY + 4);

    const poTableRows = poItems.map(item => [
      item.poNumber,
      item.openPosCount.toString(),
      item.facilityName,
      item.skuDescription,
      `${item.categoryL1} / ${item.subCategoryL2}`,
      item.openPoQuantity.toLocaleString('en-IN'),
      item.daysOnHand.toString(),
      item.potentialGmvLoss > 0 ? `₹ ${item.potentialGmvLoss.toLocaleString('en-IN')}` : '-',
      item.status,
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['PO Number', 'Open POs', 'Facility Name', 'SKU Description', 'Category (L1 / L2)', 'Open PO Qty', 'DOH', 'Potential GMV Loss', 'Status']],
      body: poTableRows,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold', overflow: 'linebreak' },
        1: { halign: 'center', cellWidth: 16 },
        2: { cellWidth: 36 },
        3: { cellWidth: 54 },
        4: { cellWidth: 38 },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'center' },
      },
    });
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `WH stock Tracker - Confidential Operations Report | Page ${i} of ${totalPages}`,
      14,
      202
    );
    doc.text('Verified Warehouse Management & Supply Chain Audit System', 283, 202, { align: 'right' });
  }

  // Save the PDF
  const filename = `WH_Stock_Tracker_Report_${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
