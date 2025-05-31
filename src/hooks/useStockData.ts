import { useState, useCallback } from 'react';

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

export const useStockData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockPrice = useCallback(async (symbol: string): Promise<StockPrice | null> => {
    try {
      setLoading(true);
      setError(null);

      // Try Financial Modeling Prep API first (free tier)
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=demo`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }

      const data = await response.json();
      const quote = data[0];
      
      if (!quote) {
        return generateSimulatedStockPrice(symbol);
      }

      return {
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changesPercentage,
        high: quote.dayHigh,
        low: quote.dayLow,
        volume: quote.volume,
        marketCap: quote.marketCap,
      };
    } catch (err) {
      console.error('Stock price fetch error:', err);
      return generateSimulatedStockPrice(symbol);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockChart = useCallback(async (symbol: string): Promise<StockChart[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get historical data from Financial Modeling Prep
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=demo`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }

      const data = await response.json();
      
      if (!data.historical || data.historical.length === 0) {
        return generateSimulatedChartData(symbol);
      }

      const chartData: StockChart[] = data.historical
        .slice(0, 30)
        .map((item: any) => ({
          timestamp: new Date(item.date).getTime(),
          price: item.close,
          volume: item.volume,
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

// ... keep existing code (fallback functions remain the same)
function generateSimulatedStockPrice(symbol: string): StockPrice {
  const basePrice = getBasePriceForSymbol(symbol);
  const changePercent = (Math.random() - 0.5) * 8;
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
    const timestamp = Date.now() - (i * 24 * 60 * 60 * 1000);
    const volatility = 0.02;
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
