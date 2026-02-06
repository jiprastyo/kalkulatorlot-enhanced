// scripts/fetch-news.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// Indonesian finance news sources
const NEWS_SOURCES = {
  KONTAN: 'https://investasi.kontan.co.id',
  CNBC: 'https://www.cnbcindonesia.com/market',
  BISNIS: 'https://market.bisnis.com'
};

// Scrape news from Kontan (example)
async function scrapeKontanNews(stockCode) {
  try {
    const searchUrl = `https://www.google.com/search?q=${stockCode}+site:kontan.co.id&tbm=nws`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const news = [];
    
    // This is a simplified example - actual scraping would need more robust selectors
    $('.g').slice(0, 3).each((i, elem) => {
      const title = $(elem).find('h3').text();
      const link = $(elem).find('a').attr('href');
      const snippet = $(elem).find('.VwiC3b').text();
      
      if (title && link) {
        news.push({
          title: title,
          url: link,
          snippet: snippet || '',
          source: 'Kontan',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    return news;
  } catch (error) {
    console.error(`Error scraping news for ${stockCode}:`, error.message);
    return [];
  }
}

// Alternative: Use RSS feeds
async function fetchRSSNews(stockCode) {
  const news = [];
  
  // Example RSS endpoints (these would need to be real endpoints)
  const rssSources = [
    `https://www.google.com/alerts/feeds/12345/${stockCode}`, // Google Alerts RSS
  ];
  
  // RSS parsing would go here
  // For now, returning empty array as placeholder
  
  return news;
}

// Mock news generator (for testing/demo purposes)
function generateMockNews(stockCode) {
  const templates = [
    `${stockCode} mencatatkan kenaikan signifikan di perdagangan hari ini`,
    `Analis merekomendasikan BUY untuk saham ${stockCode}`,
    `${stockCode} rilis laporan keuangan Q4 dengan pertumbuhan positif`,
    `Volume perdagangan ${stockCode} meningkat 25% hari ini`,
    `${stockCode} berencana melakukan ekspansi bisnis di 2026`
  ];
  
  const sources = ['Kontan', 'CNBC Indonesia', 'Bisnis Indonesia', 'IDX Channel', 'Bareksa'];
  
  const newsCount = Math.floor(Math.random() * 3) + 1;
  const news = [];
  
  for (let i = 0; i < newsCount; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    news.push({
      title: templates[Math.floor(Math.random() * templates.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      url: `https://example.com/news/${stockCode.toLowerCase()}-${i}`,
      date: date.toISOString().split('T')[0],
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
    });
  }
  
  return news;
}

// Main function to fetch news for all stocks
async function fetchNewsForAllStocks() {
  console.log('Fetching stock news...');
  
  const files = fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json') && f !== 'all-stocks.json' && f !== 'metadata.json');
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const stockData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const stockCode = stockData.symbol;
    
    console.log(`Fetching news for ${stockCode}...`);
    
    // Try to scrape real news (uncomment when ready)
    // let news = await scrapeKontanNews(stockCode);
    
    // For now, use mock data
    let news = generateMockNews(stockCode);
    
    if (news.length === 0) {
      console.log(`No news found for ${stockCode}, using mock data`);
      news = generateMockNews(stockCode);
    }
    
    stockData.news = news;
    stockData.news_lastUpdate = new Date().toISOString();
    
    fs.writeFileSync(filePath, JSON.stringify(stockData, null, 2));
    console.log(`✓ ${stockCode} - ${news.length} news items added`);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✓ News fetch complete!');
}

// Note about real news fetching
console.log(`
================================================================================
NOTE: This script currently uses mock news data for demonstration.

To fetch real news, you can:
1. Use Google News RSS feeds with your stock ticker
2. Scrape from Indonesian financial news websites (Kontan, CNBC Indonesia, etc.)
3. Use a third-party news API like:
   - Alpha Vantage News API
   - Finnhub News API
   - Stock News API

For Google News RSS:
https://news.google.com/rss/search?q=${stockCode}+stock&hl=id&gl=ID&ceid=ID:id

IMPORTANT: When scraping, always:
- Respect robots.txt
- Add delays between requests
- Include proper User-Agent headers
- Cache results to minimize requests
================================================================================
`);

// Run the script
fetchNewsForAllStocks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
