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

// Hardcoded data from the research phase (Google Sheet)
// Ensuring reliability as external sheet might change or have access issues without a published CSV link
const SHIPMENT_DATA: Shipment[] = [
  {
    id: 'SHP-0041',
    date: '2026-02-10',
    vesselName: 'Blue Horizon',
    origin: 'SGP',
    destination: 'NLD',
    payloadTeu: 14200,
    revenue: 2130000,
    cost: 1850000,
    profit: 280000,
    fuelEfficiency: 0.42
  },
  {
    id: 'SHP-0042',
    date: '2026-02-12',
    vesselName: 'Northern Star',
    origin: 'HAM',
    destination: 'NYC',
    payloadTeu: 12100,
    revenue: 1815000,
    cost: 1900000,
    profit: -85000,
    fuelEfficiency: 0.48
  },
  {
    id: 'SHP-0043',
    date: '2026-02-15',
    vesselName: 'Arctic Sun',
    origin: 'OSL',
    destination: 'REY',
    payloadTeu: 4500,
    revenue: 675000,
    cost: 520000,
    profit: 155000,
    fuelEfficiency: 0.35
  },
  {
    id: 'SHP-0044',
    date: '2026-02-18',
    vesselName: 'Ocean Titan',
    origin: 'SHA',
    destination: 'LAX',
    payloadTeu: 18500,
    revenue: 2775000,
    cost: 2200000,
    profit: 575000,
    fuelEfficiency: 0.51
  },
  {
    id: 'SHP-0045',
    date: '2026-02-20',
    vesselName: 'Cape Trader',
    origin: 'CPT',
    destination: 'LIS',
    payloadTeu: 9800,
    revenue: 1470000,
    cost: 1390000,
    profit: 80000,
    fuelEfficiency: 0.39
  }
];

export async function fetchSheetData(): Promise<Shipment[]> {
  // Simulate network delay for realistic loading state
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SHIPMENT_DATA);
    }, 800);
  });
}
