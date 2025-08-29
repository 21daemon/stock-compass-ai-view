import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol, symbols } = await req.json();
    const apiKey = Deno.env.get('FINANCIAL_MODELING_PREP_API_KEY') || 'demo';

    if (action === 'quote') {
      const data = await fetchStockQuote(symbol, apiKey);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'historical') {
      const data = await fetchHistoricalData(symbol, apiKey);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'overview') {
      const data = await fetchMarketOverview(symbols, apiKey);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action specified');
  } catch (error) {
    console.error('Stock data API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchStockQuote(symbol: string, apiKey: string): Promise<StockData | null> {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const data = await response.json();
    const quote = data[0];
    
    if (!quote || data.error || data['Error Message']) {
      throw new Error(`Stock ${symbol} not found`);
    }

    return {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      high: quote.dayHigh,
      low: quote.dayLow,
      volume: quote.volume,
      marketCap: quote.marketCap || Math.round(quote.price * quote.volume / 1000000),
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw new Error(`Unable to fetch data for ${symbol}`);
  }
}

async function fetchHistoricalData(symbol: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Historical data for ${symbol} not found`);
    }

    const data = await response.json();
    
    if (!data.historical || data.historical.length === 0 || data.error || data['Error Message']) {
      throw new Error(`Historical data for ${symbol} not found`);
    }

    return data.historical
      .slice(0, 30)
      .map((item: any) => ({
        timestamp: new Date(item.date).getTime(),
        price: item.close,
        volume: item.volume,
      }))
      .reverse();
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error(`Unable to fetch historical data for ${symbol}`);
  }
}

async function fetchMarketOverview(symbols: string[], apiKey: string) {
  const promises = symbols.map(symbol => 
    fetchStockQuote(symbol, apiKey).catch(err => {
      console.warn(`Failed to fetch ${symbol}:`, err.message);
      return null;
    })
  );
  
  const results = await Promise.allSettled(promises);
  return results
    .filter((result): result is PromiseFulfilledResult<StockData | null> => 
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}