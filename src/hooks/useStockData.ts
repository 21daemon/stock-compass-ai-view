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

      // Use Alpha Vantage API (free tier with real data)
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`
      );
      
      if (!response.ok) {
        setError(`Stock ${symbol} not found`);
        return null;
      }

      const data = await response.json();
      const quote = data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        setError(`Stock ${symbol} not found`);
        return null;
      }

      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change']);
      const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

      return {
        symbol: quote['01. symbol'],
        price: price,
        change: change,
        changePercent: changePercent,
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume']),
        marketCap: Math.round(price * parseInt(quote['06. volume']) / 1000000), // Estimated
      };
    } catch (err) {
      console.error('Stock price fetch error:', err);
      setError(`Failed to fetch data for ${symbol}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockChart = useCallback(async (symbol: string): Promise<StockChart[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get historical data from Alpha Vantage
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=demo&outputsize=compact`
      );

      if (!response.ok) {
        setError(`Chart data for ${symbol} not found`);
        return [];
      }

      const data = await response.json();
      const timeSeries = data['Time Series (Daily)'];
      
      if (!timeSeries || Object.keys(timeSeries).length === 0) {
        setError(`Chart data for ${symbol} not found`);
        return [];
      }

      const chartData: StockChart[] = Object.entries(timeSeries)
        .slice(0, 30)
        .map(([date, values]: [string, any]) => ({
          timestamp: new Date(date).getTime(),
          price: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }))
        .reverse();

      return chartData;
    } catch (err) {
      console.error('Chart data fetch error:', err);
      setError(`Failed to fetch chart data for ${symbol}`);
      return [];
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

