import fetch from 'node-fetch';
import Papa from 'papaparse';

// URL from .env (hardcoded for the script to be sure)
const URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSKmvcqLndJ0cQfogCX1Ysk-1JJ9ys7AnXFSJnVABQVKD5rYgQcMalfRVFbh2rQ4A/pub?gid=685993509&single=true&output=csv';

async function debugData() {
    console.log('Fetching CSV from:', URL);
    try {
        const response = await fetch(URL);
        const csvText = await response.text();
        console.log('Raw CSV Length:', csvText.length);
        console.log('First 500 chars of CSV:', csvText.substring(0, 500));

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log('Parsed Rows:', results.data.length);
                console.log('Headers:', results.meta.fields);

                if (results.data.length > 0) {
                    console.log('First Row Raw:', results.data[0]);
                }

                // Simulate dataService parsing
                const firstHeader = results.meta.fields ? results.meta.fields[0] : 'FOLDER NUMBER';

                const parsedData = results.data.map((row) => {
                    // Helper to parse numbers safely
                    const parseNumber = (val) => {
                        if (!val) return 0;
                        const cleaned = String(val).replace(/[^0-9.\-]+/g, '');
                        const num = Number(cleaned);
                        return isNaN(num) ? 0 : num;
                    };

                    return {
                        rowNum: parseNumber(row[firstHeader]),
                        year: parseNumber(row['YEAR']),
                        month: row['MONTH'],
                        date: parseNumber(row['DATE']),
                        // ... other fields relevant to filtering
                    };
                });

                console.log('First Parsed Item:', parsedData[0]);

                // Simulate App.tsx filtering
                const today = new Date(); // Use current date
                // Overwrite today to simulate matching user's "Today" if needed, 
                // but let's test against REAL today first (2026-02-19)
                // Wait, user's metadata says 2026-02-19.

                const currentYear = 2026; // today.getFullYear();
                const currentDate = 19; // today.getDate();
                const currentMonthName = 'FEBRUARY'; // today.toLocaleString('default', { month: 'long' }).toUpperCase();

                console.log(`Filtering for: Year=${currentYear}, Month=${currentMonthName}, Date=${currentDate}`);

                const filtered = parsedData.filter(item => {
                    const itemMonth = (item.month || '').toUpperCase();
                    const matchYear = item.year === currentYear;
                    const matchDate = item.date === currentDate;
                    const matchMonth = itemMonth.includes(currentMonthName);

                    if (matchYear && matchMonth && !matchDate) {
                        // Checking if we have data for the month but not the date
                        // console.log(`Found match for month/year but date differs: ${item.date}`);
                    }

                    return matchYear && matchDate && matchMonth;
                });

                console.log(`Matches for TODAY: ${filtered.length}`);

                // Check if ANY data exists for this month
                const monthMatches = parsedData.filter(item => {
                    return item.year === currentYear && (item.month || '').toUpperCase().includes(currentMonthName);
                });
                console.log(`Matches for MONTH (February 2026): ${monthMatches.length}`);

                if (monthMatches.length > 0 && filtered.length === 0) {
                    console.log('WARNING: Data exists for the month, but not for today (19th).');
                    console.log('Sample dates in month data:', monthMatches.map(m => m.date).slice(0, 10));
                }
            }
        });

    } catch (error) {
        console.error('Network Error:', error);
    }
}

debugData();
