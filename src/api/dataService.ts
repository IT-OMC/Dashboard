import Papa from 'papaparse';

export interface Inquiry {
  rowNum: number;
  year: number;
  month: string;
  date: number;
  folderNumber: string;
  week: string;
  vesselName: string;
  eta: string;
  port: string;
  principal: string;
  country: string;
  service: string;
  category: string;
  qtnValue: number;
  qtnCost: number;
  qtnProfit: number;
  qtnMargin: number;
  marginPercent: number;
  discountPercent: string;
  qtnStatus: string;
  update: string;
  contactPerson: string;
  contactNumber: string;
  contactEmail: string;
  pic: string;
  clientStatus: string;
  remarks: string;
  rfqNumber: string;
}

// Published Google Sheet URL (CSV format)
const GOOGLE_SHEET_CSV_URL = import.meta.env.VITE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmvcqLndJ0cQfogCX1Ysk-1JJ9ys7AnXFSJnVABQVKD5rYgQcMalfRVFbh2rQ4A/pub?gid=685993509&single=true&output=csv';

function parseNumber(val: string | undefined | null): number {
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.\-]+/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export async function fetchSheetData(): Promise<Inquiry[]> {
  try {
    // Add a unique timestamp parameter to bypass browser/CDN caching
    const response = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // implementation_plan.md: Dynamic First Column Mapping
          const firstHeader = results.meta.fields ? results.meta.fields[0] : 'FOLDER NUMBER';

          const parsedData = results.data.map((row: any) => {
            return {
              rowNum: parseNumber(row[firstHeader]) || 0, // Use dynamic first column for row number too
              year: parseNumber(row['YEAR']),
              month: row['MONTH'] || '',
              date: parseNumber(row['DATE']),
              folderNumber: row[firstHeader] || '', // Use dynamic first column
              week: row['WEEK '] || row['WEEK'] || '',
              vesselName: (row['VESSEL NAME'] || '').trim(),
              eta: row['ETA'] || '',
              port: row['PORT'] || '',
              principal: row['PRINCIPAL'] || '',
              country: row['COUNTRY'] || '',
              service: row['SERVICE'] || '',
              category: row['CATEGORY'] || '',
              qtnValue: parseNumber(row['PDA / QTN VALUE']),
              qtnCost: parseNumber(row['PDA / QTN  COST'] || row['PDA / QTN COST']),
              qtnProfit: parseNumber(row['PDA / QTN PROFIT']),
              qtnMargin: parseNumber(row['PDA / QTN MARGIN']),
              marginPercent: parseNumber(row['MARGIN %']),
              discountPercent: row['DISCOUNT %'] || '',
              qtnStatus: (row['QTN STATUS'] || '').trim(),
              update: (row['UPDATE'] || '').trim(),
              contactPerson: (row['CONTACT PERSON '] || row['CONTACT PERSON'] || '').trim(),
              contactNumber: row['CONTACT NUMBER'] || '',
              contactEmail: row["CONTACT PERSON'S EMAIL"] || '',
              pic: row['PIC'] || '',
              clientStatus: row['CLIENT STATUS'] || '',
              remarks: row['REMARKS'] || '',
              rfqNumber: row['RFQ NUMBERS / ITEM DESCRIPTION'] || '',
            };
          });

          // Filter out rows that have no vessel name and no value
          const validData = parsedData.filter(
            (item) => item.vesselName || item.qtnValue > 0 || item.rowNum > 0
          );

          resolve(validData);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}
