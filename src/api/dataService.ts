import Papa from 'papaparse';

export interface Shipment {
  id: string;
  date: string;
  vesselName: string;
  origin: string;
  destination: string;
  payloadTeu: number;
  revenue: number;
  cost: number;
  profit: number;
  fuelEfficiency: number;
}

// Published Google Sheet URL (CSV format)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXvjE-mlJ3PfgoCZ_HIkimGGnrG4Uug36Xw1Vv--HuAcK7_eSNwX7BhhMWIjJO5QpvDUlkVdGkZaNp/pub?output=csv';

export async function fetchSheetData(): Promise<Shipment[]> {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data.map((row: any) => {
            // Parse Route "Origin ➔ Destination"
            const routeStr = row['Route (Origin-Dest)'] || '';
            const [origin, destination] = routeStr.includes('➔')
              ? routeStr.split('➔').map((s: string) => s.trim())
              : ['Unknown', 'Unknown'];

            return {
              id: row['Shipment ID'] || `SHP-${Math.floor(Math.random() * 10000)}`,
              date: row['Date (Dep.)'] || new Date().toISOString().split('T')[0],
              vesselName: row['Vessel Name'] || 'Unknown Vessel',
              origin: origin,
              destination: destination,
              payloadTeu: Number(String(row['Payload (TEUs)'] || 0).replace(/[^0-9.-]+/g, "")),
              revenue: Number(String(row['Revenue ($)'] || 0).replace(/[^0-9.-]+/g, "")),
              cost: Number(String(row['Op. Costs ($)'] || 0).replace(/[^0-9.-]+/g, "")),
              profit: Number(String(row['Profit/Loss ($)'] || 0).replace(/[^0-9.-]+/g, "")), // Handles +$280,000 and -$85,000
              fuelEfficiency: Number(String(row['Fuel Efficiency (MT/nm)'] || 0).replace(/[^0-9.-]+/g, ""))
            };
          });

          // Filter out rows that might be totally empty or invalid headers repeated
          const validData = parsedData.filter(item => item.vesselName !== 'Unknown Vessel' || item.revenue !== 0);

          resolve(validData);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}
