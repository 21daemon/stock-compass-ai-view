import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      const { data, error: functionError } = await supabase.functions.invoke('stock-data', {
        body: {
          action: 'quote',
          symbol: symbol
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        setError(data.error);
        return null;
      }

      return data;
    } catch (err: any) {
      console.error('Stock price fetch error:', err);
      setError(err.message || `Failed to fetch data for ${symbol}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockChart = useCallback(async (symbol: string): Promise<StockChart[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('stock-data', {
        body: {
          action: 'historical',
          symbol: symbol
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        setError(data.error);
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('Chart data fetch error:', err);
      setError(err.message || `Failed to fetch chart data for ${symbol}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketOverview = useCallback(async (symbols: string[]): Promise<StockPrice[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('stock-data', {
        body: {
          action: 'overview',
          symbols: symbols
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        setError(data.error);
        return [];
      }

      return data;
    } catch (err: any) {
      console.error('Market overview fetch error:', err);
      setError(err.message || 'Failed to fetch market data');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchStockPrice,
    fetchStockChart,
    fetchMarketOverview,
    loading,
    error,
  };
};

