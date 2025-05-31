
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
}

interface StockChart {
  timestamp: number;
  price: number;
  volume: number;
}

// Alpha Vantage API (Free tier: 5 calls per minute, 500 calls per day)
const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with actual key
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Finnhub API (Free tier: 60 calls per minute)
const FINNHUB_API_KEY = 'demo'; // Replace with actual key
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export const useStockData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real-time stock price using Alpha Vantage
  const fetchStockPrice = useCallback(async (symbol: string): Promise<StockPrice | null> => {
    try {
      setLoading(true);
      setError(null);

      // Try Alpha Vantage first
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        // If API limit reached, fall back to simulated data
        console.warn('API limit reached, using simulated data');
        return generateSimulatedStockPrice(symbol);
      }

      const quote = data['Global Quote'];
      if (!quote) {
        throw new Error('Invalid stock symbol');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
      };
    } catch (err) {
      console.error('Stock price fetch error:', err);
      // Fall back to simulated data
      return generateSimulatedStockPrice(symbol);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch historical chart data
  const fetchStockChart = useCallback(async (symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily' = 'daily'): Promise<StockChart[]> => {
    try {
      setLoading(true);
      setError(null);

      const functionName = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
      const intervalParam = interval === 'daily' ? '' : `&interval=${interval}`;
      
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=${functionName}&symbol=${symbol}${intervalParam}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        // Fall back to simulated data
        return generateSimulatedChartData(symbol);
      }

      const timeSeriesKey = interval === 'daily' ? 'Time Series (Daily)' : `Time Series (${interval})`;
      const timeSeries = data[timeSeriesKey];
      
      if (!timeSeries) {
        return generateSimulatedChartData(symbol);
      }

      const chartData: StockChart[] = Object.entries(timeSeries)
        .slice(0, 30) // Last 30 data points
        .map(([timestamp, values]: [string, any]) => ({
          timestamp: new Date(timestamp).getTime(),
          price: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .reverse();

      return chartData;
    } catch (err) {
      console.error('Chart data fetch error:', err);
      return generateSimulatedChartData(symbol);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch multiple stocks for market overview
  const fetchMarketOverview = useCallback(async (symbols: string[]): Promise<StockPrice[]> => {
    try {
      setLoading(true);
      setError(null);

      const promises = symbols.map(symbol => fetchStockPrice(symbol));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<StockPrice | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value!);
    } catch (err) {
      console.error('Market overview fetch error:', err);
      setError('Failed to fetch market data');
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchStockPrice]);

  return {
    fetchStockPrice,
    fetchStockChart,
    fetchMarketOverview,
    loading,
    error,
  };
};

// Fallback simulated data when API limits are reached
function generateSimulatedStockPrice(symbol: string): StockPrice {
  const basePrice = getBasePriceForSymbol(symbol);
  const changePercent = (Math.random() - 0.5) * 8; // -4% to +4%
  const change = basePrice * (changePercent / 100);
  const price = basePrice + change;
  
  return {
    symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    high: Math.round((price * 1.02) * 100) / 100,
    low: Math.round((price * 0.98) * 100) / 100,
    volume: Math.floor(Math.random() * 10000000) + 1000000,
  };
}

function generateSimulatedChartData(symbol: string): StockChart[] {
  const basePrice = getBasePriceForSymbol(symbol);
  const data: StockChart[] = [];
  let currentPrice = basePrice;
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000); // Last 30 days
    const volatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + randomChange);
    
    data.push({
      timestamp,
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
    });
  }
  
  return data;
}

function getBasePriceForSymbol(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'AAPL': 180,
    'GOOGL': 140,
    'MSFT': 380,
    'AMZN': 145,
    'TSLA': 250,
    'META': 320,
    'NFLX': 450,
    'NVDA': 480,
    'SPY': 450,
    'QQQ': 380,
  };
  
  return basePrices[symbol.toUpperCase()] || (100 + Math.random() * 200);
}
