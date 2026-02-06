# IDX Stock Calculator - Enhanced Version Setup Guide

## 📋 Overview

This enhanced version of your IDX stock calculator includes:
- ✅ Stock news integration
- ✅ Technical indicators (RSI, MACD, SMA, Bollinger Bands, etc.)
- ✅ Automated daily data updates via GitHub Actions
- ✅ Self-hosted data on your GitHub repository
- ✅ No external API dependencies (free forever!)

## 🚀 Quick Start

### 1. Repository Structure

Create the following folder structure in your repository:

```
your-repo/
├── index.html                    # Your enhanced calculator
├── data/                         # Stock data files (auto-generated)
│   ├── BBCA.json
│   ├── BBRI.json
│   ├── metadata.json
│   └── all-stocks.json
├── scripts/                      # Data fetching scripts
│   ├── fetch-stock-data.js
│   ├── calculate-technicals.js
│   └── fetch-news.js
└── .github/
    └── workflows/
        └── daily-update.yml      # GitHub Actions workflow
```

### 2. Setup GitHub Actions

1. **Create the workflow file:**
   - Copy `.github-workflows-daily-update.yml` to `.github/workflows/daily-update.yml` in your repo

2. **Install dependencies:**
   - Create `package.json` in your repository root:

```json
{
  "name": "kalkulatorlot-enhanced",
  "version": "2.0.0",
  "description": "Enhanced IDX Stock Calculator with technical analysis and news",
  "scripts": {
    "fetch-data": "node scripts/fetch-stock-data.js",
    "calculate-tech": "node scripts/calculate-technicals.js",
    "fetch-news": "node scripts/fetch-news.js",
    "update-all": "npm run fetch-data && npm run calculate-tech && npm run fetch-news"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

3. **Enable GitHub Actions:**
   - Go to your repository Settings
   - Navigate to Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Click Save

### 3. Deploy to GitHub Pages

1. **Enable GitHub Pages:**
   - Go to repository Settings
   - Navigate to Pages
   - Under "Source", select "Deploy from a branch"
   - Select `main` branch and `/ (root)` folder
   - Click Save

2. **Update the data URL in index.html:**
   - Open `index.html`
   - Find the line: `const DATA_BASE_URL = './data/';`
   - Change it to: `const DATA_BASE_URL = 'https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/data/';`

### 4. Manual First Run

Before the automated workflow runs, you should manually generate the initial data:

```bash
# Install dependencies
npm install

# Run data fetch
npm run update-all

# Commit the data files
git add data/
git commit -m "Initial stock data"
git push
```

## 📊 Data Sources

### Current Implementation

The scripts fetch data from:

1. **Yahoo Finance** (Primary source)
   - Provides: Price, volume, historical data
   - Coverage: Most IDX stocks with .JK suffix
   - Free and reliable

2. **Pasardana API** (Backup source)
   - URL: https://indonesia-stock-exchange.vercel.app/
   - Provides: Daily stock data
   - Free to use

3. **News Sources** (Currently using mock data)
   - Google News RSS
   - Indonesian finance portals (Kontan, CNBC Indonesia, Bisnis)

### Adding More Stocks

Edit `fetch-stock-data.js` and modify the `STOCKS_TO_TRACK` array:

```javascript
const STOCKS_TO_TRACK = [
  'BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII',
  // Add more stock codes here
  'YOUR_STOCK_CODE'
];
```

## 🔧 Configuration Options

### Update Frequency

The GitHub Action runs daily at 17:00 WIB (after market close). To change this:

Edit `.github/workflows/daily-update.yml`:
```yaml
schedule:
  - cron: '0 10 * * 1-5'  # Change this cron expression
```

Cron format: `minute hour day month weekday`
- `0 10 * * 1-5` = 10:00 UTC (17:00 WIB) Monday-Friday
- `30 8 * * 1-5` = 08:30 UTC (15:30 WIB) Monday-Friday

### Technical Indicators Customization

Edit `calculate-technicals.js` to modify indicator parameters:

```javascript
// RSI period (default: 14)
const rsi = calculateRSI(closePrices, 14);  // Change to 9, 25, etc.

// SMA periods (default: 20, 50, 200)
const sma20 = calculateSMA(closePrices, 20);  // Change periods as needed

// Bollinger Bands (period: 20, std dev: 2)
const bb = calculateBollingerBands(closePrices, 20, 2);
```

## 🌐 Integrating Third-Party APIs (Optional)

If you want real-time news instead of mock data, you can integrate free APIs:

### Option 1: Alpha Vantage (25 requests/day free)

1. Get free API key: https://www.alphavantage.co/support/#api-key
2. Modify `fetch-news.js`:

```javascript
async function fetchAlphaVantageNews(stockCode) {
  const apiKey = 'YOUR_API_KEY';
  const response = await axios.get(
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${stockCode}.JK&apikey=${apiKey}`
  );
  return response.data.feed;
}
```

### Option 2: Finnhub (60 requests/minute free)

1. Get free API key: https://finnhub.io/register
2. Modify `fetch-news.js`:

```javascript
async function fetchFinnhubNews(stockCode) {
  const apiKey = 'YOUR_API_KEY';
  const response = await axios.get(
    `https://finnhub.io/api/v1/company-news?symbol=${stockCode}.JK&from=${fromDate}&to=${toDate}&token=${apiKey}`
  );
  return response.data;
}
```

### Option 3: Google News RSS (Free, no API key)

```javascript
async function fetchGoogleNewsRSS(stockCode) {
  const rssUrl = `https://news.google.com/rss/search?q=${stockCode}+stock&hl=id&gl=ID&ceid=ID:id`;
  // Use RSS parser library
  const feed = await parser.parseURL(rssUrl);
  return feed.items;
}
```

## 📱 Features of Enhanced Calculator

### 1. Technical Indicators
- **RSI (Relative Strength Index)**: Overbought/oversold signals
- **Moving Averages**: SMA 20, 50, 200
- **MACD**: Trend following momentum indicator
- **Bollinger Bands**: Volatility indicator
- **Support/Resistance**: Price levels
- **Volume Analysis**: Trading volume trends

### 2. Price Information
- Current price with real-time changes
- Percentage change from previous close
- Short/medium/long-term trend analysis
- Volume comparison to average

### 3. News Feed
- Latest news about the selected stock
- News source and date
- Sentiment analysis (positive/neutral/negative)

### 4. Lot Calculator (Original Feature)
- Calculate how many lots you can buy
- Total shares calculation
- Total investment amount
- Remaining capital

## 🐛 Troubleshooting

### GitHub Actions Not Running

1. Check if Actions are enabled in repository settings
2. Verify workflow file is in `.github/workflows/` directory
3. Check workflow permissions are set to "Read and write"

### Data Not Loading in Frontend

1. Verify GitHub Pages is enabled
2. Check the `DATA_BASE_URL` in index.html matches your GitHub Pages URL
3. Open browser console (F12) to see error messages
4. Verify `data/` folder exists and contains JSON files

### Stock Data Not Fetching

1. Check if stock code is correct (use .JK suffix for Yahoo Finance)
2. Verify network access in GitHub Actions
3. Check API rate limits if using third-party APIs
4. Review workflow logs in Actions tab

### News Not Showing

The default implementation uses mock news data. To get real news:
1. Implement one of the third-party API options above
2. Or set up web scraping with proper rate limiting
3. Ensure you comply with terms of service

## 🔐 Security Best Practices

### API Keys

If you use third-party APIs:

1. **Never commit API keys to your repository**
2. Use GitHub Secrets instead:
   - Go to repository Settings → Secrets and variables → Actions
   - Add New repository secret
   - Reference in workflow: `${{ secrets.API_KEY_NAME }}`

Example in workflow:
```yaml
- name: Fetch news
  env:
    ALPHA_VANTAGE_KEY: ${{ secrets.ALPHA_VANTAGE_KEY }}
  run: node scripts/fetch-news.js
```

### Rate Limiting

Always implement rate limiting when fetching from external sources:

```javascript
// Wait 1 second between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

## 📈 Future Enhancements

Potential additions you could make:

1. **Chart Visualization**
   - Use Chart.js or lightweight-charts
   - Display candlestick charts
   - Show technical indicators on chart

2. **More Stocks**
   - Expand to all IDX stocks
   - Add watchlist feature
   - Portfolio tracking

3. **Advanced Analytics**
   - Fibonacci retracement
   - Elliott Wave analysis
   - Pattern recognition

4. **Alerts**
   - Price alerts
   - Technical indicator signals
   - News alerts

5. **Mobile App**
   - Progressive Web App (PWA)
   - Native mobile app

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Open an issue in your repository

## 📄 License

This enhanced calculator is provided as-is for educational purposes.
Always verify data from official sources before making investment decisions.

---

**Disclaimer**: This tool is for educational purposes only. Stock market investments carry risk. Always do your own research and consult with financial advisors before making investment decisions.
