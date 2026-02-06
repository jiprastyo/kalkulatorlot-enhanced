// scripts/fetch-stock-data.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// List of popular IDX stocks to track
const STOCKS_TO_TRACK = [
  'BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 
  'UNVR', 'KLBF', 'ICBP', 'INDF', 'SMGR',
  'GOTO', 'BUKA', 'EMTK', 'MDKA', 'PGAS'
];

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Fetch data from IDX official API
async function fetchIDXData() {
  try {
    const response = await axios.get(
      'https://www.idx.co.id/umbraco/Surface/StockData/GetConstituent',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching IDX data:', error.message);
    return null;
  }
}

// Fetch from Pasardana API alternative
async function fetchPasardanaData(stockCode) {
  try {
    // Using the vercel-hosted API
    const response = await axios.get(
      `https://indonesia-stock-exchange.vercel.app/api/stock/${stockCode}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${stockCode} from Pasardana:`, error.message);
    return null;
  }
}

// Fetch from Yahoo Finance as backup
async function fetchYahooFinanceData(stockCode) {
  try {
    const ticker = `${stockCode}.JK`;
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=90d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );
    
    if (response.data.chart.result) {
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quotes = result.indicators.quote[0];
      const timestamps = result.timestamp;
      
      return {
        symbol: stockCode,
        currency: meta.currency,
        regularMarketPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        regularMarketVolume: meta.regularMarketVolume,
        historicalData: timestamps.map((ts, i) => ({
          date: new Date(ts * 1000).toISOString().split('T')[0],
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i]
        })).filter(d => d.close !== null) // Remove null values
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${stockCode} from Yahoo:`, error.message);
    return null;
  }
}

// Main function to fetch all stock data
async function fetchAllStockData() {
  console.log('Starting stock data fetch...');
  const allData = {};
  
  for (const stockCode of STOCKS_TO_TRACK) {
    console.log(`Fetching ${stockCode}...`);
    
    // Try multiple sources
    let stockData = await fetchYahooFinanceData(stockCode);
    
    if (!stockData) {
      stockData = await fetchPasardanaData(stockCode);
    }
    
    if (stockData) {
      allData[stockCode] = {
        ...stockData,
        lastUpdate: new Date().toISOString(),
        source: 'yahoo-finance'
      };
      
      // Save individual stock file
      fs.writeFileSync(
        path.join(dataDir, `${stockCode}.json`),
        JSON.stringify(allData[stockCode], null, 2)
      );
      
      console.log(`✓ ${stockCode} data saved`);
    } else {
      console.log(`✗ ${stockCode} data not available`);
    }
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save combined file
  fs.writeFileSync(
    path.join(dataDir, 'all-stocks.json'),
    JSON.stringify(allData, null, 2)
  );
  
  // Save metadata
  const metadata = {
    lastUpdate: new Date().toISOString(),
    totalStocks: Object.keys(allData).length,
    stocks: STOCKS_TO_TRACK,
    successfullyFetched: Object.keys(allData)
  };
  
  fs.writeFileSync(
    path.join(dataDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log(`\n✓ Complete! Fetched ${Object.keys(allData).length}/${STOCKS_TO_TRACK.length} stocks`);
}

// Run the script
fetchAllStockData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
