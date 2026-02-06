// scripts/calculate-technicals.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Simple Moving Average
function calculateSMA(data, period) {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

// Exponential Moving Average
function calculateEMA(data, period) {
  if (data.length < period) return null;
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

// Relative Strength Index (RSI)
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);
  
  const avgGain = calculateSMA(gains.slice(-period), period);
  const avgLoss = calculateSMA(losses.slice(-period), period);
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

// MACD (Moving Average Convergence Divergence)
function calculateMACD(prices) {
  if (prices.length < 26) return null;
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-day EMA of MACD)
  const macdValues = [];
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }
  
  const signalLine = calculateEMA(macdValues, 9);
  const histogram = macdLine - signalLine;
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

// Bollinger Bands
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return null;
  
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  
  // Calculate standard deviation
  const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
}

// Support and Resistance (basic calculation using recent highs/lows)
function calculateSupportResistance(historicalData, lookbackPeriod = 20) {
  if (historicalData.length < lookbackPeriod) return null;
  
  const recentData = historicalData.slice(-lookbackPeriod);
  const highs = recentData.map(d => d.high).filter(h => h !== null);
  const lows = recentData.map(d => d.low).filter(l => l !== null);
  
  // Simple approach: use max/min of recent period
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  
  return { support, resistance };
}

// Volume Analysis
function calculateVolumeAnalysis(historicalData) {
  if (historicalData.length < 20) return null;
  
  const recentData = historicalData.slice(-20);
  const volumes = recentData.map(d => d.volume).filter(v => v !== null);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  
  return {
    current: currentVolume,
    average: avgVolume,
    ratio: currentVolume / avgVolume,
    trend: currentVolume > avgVolume ? 'above average' : 'below average'
  };
}

// Main function to calculate all indicators
function calculateAllIndicators(stockData) {
  if (!stockData.historicalData || stockData.historicalData.length < 26) {
    console.log(`Insufficient data for ${stockData.symbol}`);
    return null;
  }
  
  const closePrices = stockData.historicalData.map(d => d.close).filter(c => c !== null);
  
  const technicals = {
    sma20: calculateSMA(closePrices, 20),
    sma50: calculateSMA(closePrices, 50),
    sma200: calculateSMA(closePrices, 200),
    ema12: calculateEMA(closePrices, 12),
    ema26: calculateEMA(closePrices, 26),
    rsi: calculateRSI(closePrices, 14),
    macd: calculateMACD(closePrices),
    bollingerBands: calculateBollingerBands(closePrices, 20, 2),
    supportResistance: calculateSupportResistance(stockData.historicalData, 20),
    volume: calculateVolumeAnalysis(stockData.historicalData)
  };
  
  // Add trend analysis
  const currentPrice = closePrices[closePrices.length - 1];
  technicals.trend = {
    shortTerm: currentPrice > technicals.sma20 ? 'bullish' : 'bearish',
    mediumTerm: currentPrice > technicals.sma50 ? 'bullish' : 'bearish',
    longTerm: technicals.sma200 ? (currentPrice > technicals.sma200 ? 'bullish' : 'bearish') : 'insufficient data'
  };
  
  // RSI interpretation
  if (technicals.rsi) {
    if (technicals.rsi > 70) technicals.rsiSignal = 'overbought';
    else if (technicals.rsi < 30) technicals.rsiSignal = 'oversold';
    else technicals.rsiSignal = 'neutral';
  }
  
  return technicals;
}

// Process all stock files
function processAllStocks() {
  console.log('Calculating technical indicators...');
  
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && f !== 'all-stocks.json' && f !== 'metadata.json');
  
  let processedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const stockData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const technicals = calculateAllIndicators(stockData);
    
    if (technicals) {
      stockData.technicalIndicators = technicals;
      stockData.technicalIndicators.lastCalculated = new Date().toISOString();
      
      fs.writeFileSync(filePath, JSON.stringify(stockData, null, 2));
      console.log(`✓ ${stockData.symbol} indicators calculated`);
      processedCount++;
    }
  }
  
  console.log(`\n✓ Complete! Processed ${processedCount}/${files.length} stocks`);
}

// Run the script
processAllStocks();
